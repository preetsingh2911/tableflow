/**
 * Razorpay Service — Subscription management & webhook handling
 */

let razorpayInstance = null;

function getInstance() {
  if (razorpayInstance) return razorpayInstance;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('⚠️  Razorpay not configured (KEY_ID/KEY_SECRET missing). Payment features will be stubbed.');
    return null;
  }

  const Razorpay = require('razorpay');
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  return razorpayInstance;
}

/**
 * Create a Razorpay subscription for a business
 */
async function createSubscription({ planId, customerId, totalCount = 12, notes = {} }) {
  const rp = getInstance();
  if (!rp) {
    console.log(`💳 [RAZORPAY STUB] Create subscription — Plan: ${planId}`);
    return { stubbed: true, id: 'sub_stub_' + Date.now() };
  }

  return rp.subscriptions.create({
    plan_id: planId,
    customer_id: customerId,
    total_count: totalCount,
    notes,
  });
}

/**
 * Create a Razorpay customer
 */
async function createCustomer({ name, email, contact }) {
  const rp = getInstance();
  if (!rp) {
    console.log(`💳 [RAZORPAY STUB] Create customer — ${email}`);
    return { stubbed: true, id: 'cust_stub_' + Date.now() };
  }

  return rp.customers.create({ name, email, contact });
}

/**
 * Fetch subscription details
 */
async function fetchSubscription(subscriptionId) {
  const rp = getInstance();
  if (!rp) return { stubbed: true };

  return rp.subscriptions.fetch(subscriptionId);
}

/**
 * Cancel a subscription
 */
async function cancelSubscription(subscriptionId, cancelAtCycleEnd = true) {
  const rp = getInstance();
  if (!rp) return { stubbed: true };

  return rp.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
}

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(body, signature) {
  const crypto = require('crypto');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('⚠️  RAZORPAY_WEBHOOK_SECRET not set, skipping verification');
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');

  return expectedSignature === signature;
}

module.exports = {
  createSubscription,
  createCustomer,
  fetchSubscription,
  cancelSubscription,
  verifyWebhookSignature,
};
