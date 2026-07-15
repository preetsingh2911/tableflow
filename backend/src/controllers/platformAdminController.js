/**
 * Platform Admin Controller — Master control panel API
 */
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { sendEmail } = require('../services/emailService');

const getDashboardStats = catchAsync(async (req, res) => {
  // 1. Total businesses grouped by status
  const businessesByStatus = await db('businesses')
    .select('subscription_status as status')
    .count('id as count')
    .groupBy('subscription_status');

  const totalBusinesses = businessesByStatus.reduce((acc, curr) => {
    acc[curr.status] = curr.count;
    acc.total = (acc.total || 0) + curr.count;
    return acc;
  }, { total: 0 });

  // 2. Total bookings today across all businesses
  const today = new Date().toISOString().split('T')[0];
  const bookingsToday = await db('bookings')
    .where({ date: today })
    .count('id as count')
    .first();

  // 3. MRR (approximation based on active non-trial plans in platform_settings)
  const settings = await db('platform_settings').first() || { price_starter: 999, price_growth: 1999, price_franchise: 4999 };
  
  const activeSubs = await db('businesses')
    .where('subscription_status', 'active')
    .select('subscription_plan')
    .count('id as count')
    .groupBy('subscription_plan');

  let mrr = 0;
  activeSubs.forEach(sub => {
    if (sub.subscription_plan === 'starter') mrr += sub.count * settings.price_starter;
    if (sub.subscription_plan === 'growth') mrr += sub.count * settings.price_growth;
    if (sub.subscription_plan === 'franchise') mrr += sub.count * settings.price_franchise;
  });

  // 4. New signups in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const signups = await db('businesses')
    .where('created_at', '>=', sevenDaysAgo)
    .select(db.raw('DATE(created_at) as date'))
    .count('id as count')
    .groupByRaw('DATE(created_at)')
    .orderBy('date', 'asc');

  // 5. Businesses whose trial expires in next 3 days
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const expiringTrials = await db('businesses')
    .where('subscription_status', 'trial')
    .where('trial_ends_at', '<=', threeDaysFromNow)
    .where('trial_ends_at', '>=', new Date())
    .select('id', 'name', 'slug', 'owner_name', 'owner_email', 'trial_ends_at')
    .orderBy('trial_ends_at', 'asc');

  res.json({
    status: 'success',
    data: {
      totalBusinesses,
      bookingsToday: bookingsToday.count,
      mrr,
      signupsChart: signups,
      expiringTrials
    }
  });
});

const listBusinesses = catchAsync(async (req, res) => {
  const { search, plan, status, city, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = db('businesses').select('*');

  if (search) {
    query = query.where(function() {
      this.where('name', 'like', `%${search}%`)
          .orWhere('slug', 'like', `%${search}%`)
          .orWhere('owner_email', 'like', `%${search}%`);
    });
  }
  if (plan) query = query.where('subscription_plan', plan);
  if (status) query = query.where('subscription_status', status);
  if (city) query = query.where('city', 'like', `%${city}%`);

  const totalRes = await query.clone().count('id as count').first();
  const businesses = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);

  // Aggregated outlet and booking counts
  for (let biz of businesses) {
    const outlets = await db('outlets').where({ business_id: biz.id }).count('id as count').first();
    const bookings = await db('bookings').where({ business_id: biz.id }).count('id as count').first();
    biz.outlets_count = outlets.count;
    biz.total_bookings = bookings.count;
  }

  res.json({
    status: 'success',
    data: {
      businesses,
      pagination: {
        total: totalRes.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalRes.count / limit)
      }
    }
  });
});

const getBusinessDetail = catchAsync(async (req, res) => {
  const { id } = req.params;
  const business = await db('businesses').where({ id }).first();
  if (!business) throw new AppError('Business not found', 404);

  const outlets = await db('outlets').where({ business_id: id });
  
  // Get booking counts per outlet
  for (let outlet of outlets) {
    const bCount = await db('bookings').where({ outlet_id: outlet.id }).count('id as count').first();
    outlet.total_bookings = bCount.count;
  }

  const recentBookings = await db('bookings')
    .where({ business_id: id })
    .orderBy('created_at', 'desc')
    .limit(20);

  const subscriptionEvents = await db('subscription_events')
    .where({ business_id: id })
    .orderBy('created_at', 'desc');

  res.json({
    status: 'success',
    data: { business, outlets, recentBookings, subscriptionEvents }
  });
});

const updateBusinessStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { is_active, subscription_status, subscription_plan, suspend_reason } = req.body;

  const updates = {};
  if (is_active !== undefined) updates.is_active = is_active;
  if (subscription_status !== undefined) updates.subscription_status = subscription_status;
  if (subscription_plan !== undefined) updates.subscription_plan = subscription_plan;

  // Soft delete logic if is_active is false and status is cancelled
  if (is_active === false && subscription_status === 'cancelled') {
    // We leave actual PII anonymization to a background worker as per specs "after 30 days"
  }

  await db('businesses').where({ id }).update(updates);

  await db('audit_logs').insert({
    admin_id: req.user.id,
    action: 'update_business_status',
    target_business_id: id,
    metadata: JSON.stringify({ updates, reason: suspend_reason })
  });

  res.json({ status: 'success', message: 'Business updated successfully' });
});

const impersonateBusiness = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const business = await db('businesses').where({ id }).first();
  if (!business) throw new AppError('Business not found', 404);

  // Generate a short-lived token for business owner role
  const impersonationToken = jwt.sign(
    { 
      userId: business.id, // impersonating logic maps this to business.id
      businessId: business.id, 
      businessEmail: business.owner_email,
      adminId: req.user.id, 
      role: 'impersonating' 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  await db('audit_logs').insert({
    admin_id: req.user.id,
    action: 'impersonate_business',
    target_business_id: id,
    metadata: JSON.stringify({ business_slug: business.slug })
  });

  res.json({
    status: 'success',
    data: {
      impersonationToken,
      business: { id: business.id, name: business.name, slug: business.slug }
    }
  });
});

const getSettings = catchAsync(async (req, res) => {
  const settings = await db('platform_settings').first();
  res.json({ status: 'success', data: { settings } });
});

const updateSettings = catchAsync(async (req, res) => {
  const updates = req.body;
  const settings = await db('platform_settings').first();
  if (settings) {
    await db('platform_settings').update(updates);
  } else {
    await db('platform_settings').insert(updates);
  }

  await db('audit_logs').insert({
    admin_id: req.user.id,
    action: 'update_platform_settings',
    metadata: JSON.stringify(updates)
  });

  res.json({ status: 'success', message: 'Settings updated' });
});

module.exports = {
  getDashboardStats,
  listBusinesses,
  getBusinessDetail,
  updateBusinessStatus,
  impersonateBusiness,
  getSettings,
  updateSettings
};
