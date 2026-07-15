/**
 * Tenant Resolver Middleware
 *
 * Extracts the tenant (business) from:
 * 1. Subdomain in production (e.g., slug.tableflow.in)
 * 2. x-tenant-slug header in development
 *
 * Attaches the business record to req.tenant
 * Skips resolution for auth routes, admin routes, and health checks.
 */
const db = require('../db/connection');
const { AppError } = require('./errorHandler');

// Routes that don't need tenant resolution
const SKIP_PATTERNS = [
  '/api/auth',
  '/api/admin',
  '/api/health',
  '/api/subscriptions/plans',
  '/api/subscriptions/webhook',
  '/api/public',
];

const tenantResolver = async (req, res, next) => {
  try {
    // Skip tenant resolution for certain routes
    const shouldSkip = SKIP_PATTERNS.some(pattern => req.path.startsWith(pattern));
    if (shouldSkip) {
      return next();
    }

    let slug = null;

    // 1. Try subdomain extraction in production
    const baseDomain = process.env.BASE_DOMAIN || 'tableflow.in';
    const hostname = req.hostname || '';

    if (hostname.endsWith(baseDomain) && hostname !== baseDomain && hostname !== `www.${baseDomain}`) {
      slug = hostname.replace(`.${baseDomain}`, '');
    }

    // 2. Fall back to x-tenant-slug header (for development)
    if (!slug && req.headers['x-tenant-slug']) {
      slug = req.headers['x-tenant-slug'];
    }

    // 3. Fall back to query parameter (for development)
    if (!slug && req.query.tenant) {
      slug = req.query.tenant;
    }

    // If we still don't have a slug, and the route requires it, that's fine
    // The business ownership middleware will handle this
    if (!slug) {
      return next();
    }

    // Look up the business by slug
    const business = await db('businesses')
      .where({ slug, is_active: true })
      .first();

    if (!business) {
      throw new AppError(`Business '${slug}' not found or inactive.`, 404);
    }

    // Check subscription status
    if (business.subscription_status === 'expired' || business.subscription_status === 'cancelled') {
      throw new AppError('This business account has been suspended. Please contact support.', 403);
    }

    req.tenant = business;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { tenantResolver };
