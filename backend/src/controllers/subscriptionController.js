/**
 * Subscription Controller — Plan management + Razorpay integration
 */
const db = require('../db/connection');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const razorpay = require('../services/razorpayService');
const { notifyPaymentFailed } = require('../services/notifications');

const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price_monthly: 999,
    max_outlets: 1,
    max_bookings_monthly: 100,
    razorpay_plan_id_monthly: process.env.RAZORPAY_PLAN_STARTER || 'plan_starter_stub',
    features: ['1 Outlet', 'Up to 100 bookings/month']
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price_monthly: 2499,
    max_outlets: 5,
    max_bookings_monthly: null,
    razorpay_plan_id_monthly: process.env.RAZORPAY_PLAN_GROWTH || 'plan_growth_stub',
    features: ['Up to 5 Outlets', 'Unlimited bookings', 'Analytics']
  },
  franchise: {
    id: 'franchise',
    name: 'Franchise',
    price_monthly: 5999,
    max_outlets: null,
    max_bookings_monthly: null,
    razorpay_plan_id_monthly: process.env.RAZORPAY_PLAN_FRANCHISE || 'plan_franchise_stub',
    features: ['Unlimited Outlets', 'White label', 'HQ Dashboard', 'API Access']
  }
};

/**
 * GET /api/subscriptions/plans — List available plans
 */
const listPlans = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { plans: Object.values(PLANS) } });
});

/**
 * POST /api/subscriptions/create — Create Razorpay subscription
 */
const createSubscription = catchAsync(async (req, res) => {
  const { planSlug } = req.body;

  if (!planSlug || !PLANS[planSlug]) throw new AppError('Invalid plan slug.', 400);
  const plan = PLANS[planSlug];

  // Get business and Razorpay customer
  const business = await db('businesses').where({ id: req.user.id }).first();
  let customerId = business.razorpay_customer_id;

  if (!customerId) {
    const customer = await razorpay.createCustomer({
      name: business.owner_name,
      email: business.owner_email,
      contact: business.owner_phone || '',
    });
    customerId = customer.id;
    await db('businesses').where({ id: business.id }).update({ razorpay_customer_id: customerId });
  }

  // Create subscription
  const razorpayPlanId = plan.razorpay_plan_id_monthly;
  const subscription = await razorpay.createSubscription({
    planId: razorpayPlanId,
    customerId,
    totalCount: 12,
    notes: { businessId: business.id, planSlug },
  });

  // Update business with subscription info
  await db('businesses').where({ id: business.id }).update({
    razorpay_subscription_id: subscription.id,
    subscription_plan: planSlug,
    // Keep status as it is until webhook activates it
  });

  res.json({
    status: 'success',
    message: 'Subscription created.',
    data: {
      subscriptionId: subscription.id,
      plan,
    },
  });
});

/**
 * POST /api/subscriptions/cancel — Cancel Razorpay subscription
 */
const cancelSubscription = catchAsync(async (req, res) => {
  const business = await db('businesses').where({ id: req.user.id }).first();
  
  if (!business.razorpay_subscription_id) {
    throw new AppError('No active subscription found.', 400);
  }

  await razorpay.cancelSubscription(business.razorpay_subscription_id);

  // We set to cancelled immediately, though Razorpay might send a webhook
  await db('businesses').where({ id: business.id }).update({
    subscription_status: 'cancelled',
  });

  res.json({
    status: 'success',
    message: 'Subscription cancelled successfully.',
  });
});

/**
 * GET /api/subscriptions/status
 */
const getSubscriptionStatus = catchAsync(async (req, res) => {
  // Can be called by business owner OR impersonating admin
  const businessId = req.user.role === 'impersonating' ? req.user.id : req.user.id;
  const business = await db('businesses')
    .where({ id: businessId })
    .first();

  if (!business) throw new AppError('No business found.', 404);

  const plan = PLANS[business.subscription_plan] || null;

  // Calculate stats
  const [outletsCountRes] = await db('outlets').where({ business_id: business.id }).count('* as total');
  const outletsCount = outletsCountRes.total || 0;

  // Current month bookings
  const [bookingsCountRes] = await db('bookings')
    .join('outlets', 'bookings.outlet_id', 'outlets.id')
    .where('outlets.business_id', business.id)
    .whereRaw('MONTH(bookings.created_at) = MONTH(CURRENT_DATE())')
    .whereRaw('YEAR(bookings.created_at) = YEAR(CURRENT_DATE())')
    .count('* as total');
  const bookingsCount = bookingsCountRes.total || 0;

  res.json({
    status: 'success',
    data: {
      subscriptionStatus: business.subscription_status,
      plan: plan ? {
        ...plan,
      } : { id: 'trial', name: 'Trial', max_outlets: null, max_bookings_monthly: null },
      trialEndsAt: business.trial_ends_at,
      usage: {
        outlets: outletsCount,
        bookingsThisMonth: bookingsCount,
      }
    },
  });
});

/**
 * POST /api/subscriptions/webhook — Razorpay webhook handler
 */
const handleWebhook = catchAsync(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  if (!razorpay.verifyWebhookSignature(req.body, signature)) {
    throw new AppError('Invalid webhook signature.', 400);
  }

  const event = req.body.event;
  const payload = req.body.payload;

  switch (event) {
    case 'subscription.activated':
    case 'subscription.charged': {
      const subId = payload.subscription?.entity?.id;
      if (subId) {
        await db('businesses')
          .where({ razorpay_subscription_id: subId })
          .update({ subscription_status: 'active' });
      }
      break;
    }
    
    case 'subscription.halted': {
      const subId = payload.subscription?.entity?.id;
      if (subId) {
        await db('businesses')
          .where({ razorpay_subscription_id: subId })
          .update({ subscription_status: 'suspended' });
      }
      break;
    }

    case 'subscription.payment_failed': {
      const subId = payload.subscription?.entity?.id;
      if (subId) {
        await db('businesses')
          .where({ razorpay_subscription_id: subId })
          .update({ subscription_status: 'suspended' }); // Or payment_failed, but schema only has suspended
          
        const business = await db('businesses').where({ razorpay_subscription_id: subId }).first();
        if (business) {
          await notifyPaymentFailed(business, process.env.PLATFORM_ADMIN_EMAIL || 'admin@tableflow.in');
        }
      }
      break;
    }

    case 'subscription.cancelled':
    case 'subscription.expired': {
      const subId = payload.subscription?.entity?.id;
      if (subId) {
        await db('businesses')
          .where({ razorpay_subscription_id: subId })
          .update({ subscription_status: event === 'subscription.cancelled' ? 'cancelled' : 'suspended' });
      }
      break;
    }

    default:
      console.log(`Unhandled Razorpay event: ${event}`);
  }

  res.json({ status: 'ok' });
});

module.exports = { listPlans, createSubscription, cancelSubscription, getSubscriptionStatus, handleWebhook };
