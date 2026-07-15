/**
 * Admin Controller — Platform admin management (Shyara Tech)
 */
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { paginate } = require('../utils/helpers');

/**
 * GET /api/admin/businesses — List all businesses on the platform
 */
const listBusinesses = catchAsync(async (req, res) => {
  const { search, status, page, limit } = req.query;

  let query = db('businesses')
    .join('users', 'businesses.owner_id', 'users.id')
    .select(
      'businesses.*',
      'users.email as owner_email',
      'users.full_name as owner_name',
      'users.phone as owner_phone'
    );

  if (search) {
    query = query.where(function () {
      this.where('businesses.name', 'like', `%${search}%`)
        .orWhere('businesses.slug', 'like', `%${search}%`)
        .orWhere('users.email', 'like', `%${search}%`);
    });
  }

  if (status) {
    query = query.where('businesses.subscription_status', status);
  }

  query = query.orderBy('businesses.created_at', 'desc');

  const result = await paginate(query, page, limit);

  // Enrich with outlet and booking counts
  for (const biz of result.data) {
    const outletCount = await db('outlets').where({ business_id: biz.id }).count('id as count').first();
    const bookingCount = await db('bookings')
      .join('outlets', 'bookings.outlet_id', 'outlets.id')
      .where('outlets.business_id', biz.id)
      .count('bookings.id as count')
      .first();

    biz.outletCount = outletCount.count;
    biz.totalBookings = bookingCount.count;
  }

  res.json({ status: 'success', data: result });
});

/**
 * GET /api/admin/businesses/:id — Business detail
 */
const getBusinessDetail = catchAsync(async (req, res) => {
  const business = await db('businesses')
    .join('users', 'businesses.owner_id', 'users.id')
    .leftJoin('subscription_plans', 'businesses.subscription_plan_id', 'subscription_plans.id')
    .where('businesses.id', req.params.id)
    .select(
      'businesses.*',
      'users.email as owner_email',
      'users.full_name as owner_name',
      'users.phone as owner_phone',
      'subscription_plans.name as plan_name',
      'subscription_plans.slug as plan_slug'
    )
    .first();

  if (!business) throw new AppError('Business not found.', 404);

  const outlets = await db('outlets').where({ business_id: business.id });
  const recentBookings = await db('bookings')
    .join('outlets', 'bookings.outlet_id', 'outlets.id')
    .where('outlets.business_id', business.id)
    .select('bookings.*', 'outlets.name as outlet_name')
    .orderBy('bookings.created_at', 'desc')
    .limit(20);

  res.json({
    status: 'success',
    data: { business, outlets, recentBookings },
  });
});

/**
 * PUT /api/admin/businesses/:id/status — Activate/deactivate a business
 */
const updateBusinessStatus = catchAsync(async (req, res) => {
  const { isActive, subscriptionStatus } = req.body;

  const business = await db('businesses').where({ id: req.params.id }).first();
  if (!business) throw new AppError('Business not found.', 404);

  const updates = {};
  if (isActive !== undefined) updates.is_active = isActive;
  if (subscriptionStatus) updates.subscription_status = subscriptionStatus;

  await db('businesses').where({ id: business.id }).update(updates);

  // Audit log
  await db('audit_logs').insert({
    user_id: req.user.id,
    business_id: business.id,
    action: 'admin.business_status_changed',
    entity_type: 'business',
    entity_id: business.id,
    metadata_json: JSON.stringify(updates),
  });

  res.json({ status: 'success', message: 'Business status updated.' });
});

/**
 * POST /api/admin/businesses/:id/impersonate — Generate token as business owner
 */
const impersonateBusiness = catchAsync(async (req, res) => {
  const business = await db('businesses').where({ id: req.params.id }).first();
  if (!business) throw new AppError('Business not found.', 404);

  const owner = await db('users').where({ id: business.owner_id }).first();
  if (!owner) throw new AppError('Business owner not found.', 404);

  // Generate short-lived token as the business owner
  const impersonationToken = jwt.sign(
    { userId: owner.id, email: owner.email, role: owner.role, impersonatedBy: req.user.id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Audit log
  await db('audit_logs').insert({
    user_id: req.user.id,
    business_id: business.id,
    action: 'admin.impersonation',
    entity_type: 'business',
    entity_id: business.id,
    metadata_json: JSON.stringify({ ownerEmail: owner.email }),
  });

  res.json({
    status: 'success',
    message: `Impersonating ${owner.full_name} (${owner.email}). Token valid for 1 hour.`,
    data: {
      accessToken: impersonationToken,
      business: { id: business.id, name: business.name, slug: business.slug },
      owner: { id: owner.id, email: owner.email, fullName: owner.full_name },
    },
  });
});

/**
 * GET /api/admin/stats — Platform-wide analytics
 */
const getPlatformStats = catchAsync(async (req, res) => {
  const totalBusinesses = await db('businesses').count('id as count').first();
  const activeBusinesses = await db('businesses').where({ is_active: true }).count('id as count').first();
  const totalOutlets = await db('outlets').count('id as count').first();
  const totalBookings = await db('bookings').count('id as count').first();
  const totalUsers = await db('users').count('id as count').first();

  // Bookings this month
  const monthlyBookings = await db('bookings')
    .whereRaw('MONTH(created_at) = MONTH(CURDATE())')
    .whereRaw('YEAR(created_at) = YEAR(CURDATE())')
    .count('id as count')
    .first();

  // Subscription breakdown
  const subscriptionBreakdown = await db('businesses')
    .select('subscription_status')
    .count('id as count')
    .groupBy('subscription_status');

  // New businesses this month
  const newBusinesses = await db('businesses')
    .whereRaw('MONTH(created_at) = MONTH(CURDATE())')
    .whereRaw('YEAR(created_at) = YEAR(CURDATE())')
    .count('id as count')
    .first();

  res.json({
    status: 'success',
    data: {
      totalBusinesses: totalBusinesses.count,
      activeBusinesses: activeBusinesses.count,
      totalOutlets: totalOutlets.count,
      totalBookings: totalBookings.count,
      totalUsers: totalUsers.count,
      monthlyBookings: monthlyBookings.count,
      newBusinessesThisMonth: newBusinesses.count,
      subscriptionBreakdown,
    },
  });
});

/**
 * GET /api/admin/audit-logs — Platform audit trail
 */
const getAuditLogs = catchAsync(async (req, res) => {
  const { action, businessId, page, limit } = req.query;

  let query = db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .leftJoin('businesses', 'audit_logs.business_id', 'businesses.id')
    .select(
      'audit_logs.*',
      'users.email as user_email',
      'users.full_name as user_name',
      'businesses.name as business_name'
    );

  if (action) query = query.where('audit_logs.action', 'like', `%${action}%`);
  if (businessId) query = query.where('audit_logs.business_id', businessId);

  query = query.orderBy('audit_logs.created_at', 'desc');

  const result = await paginate(query, page, limit);
  res.json({ status: 'success', data: result });
});

module.exports = {
  listBusinesses,
  getBusinessDetail,
  updateBusinessStatus,
  impersonateBusiness,
  getPlatformStats,
  getAuditLogs,
};
