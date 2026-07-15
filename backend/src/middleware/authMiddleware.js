/**
 * Authentication middleware — JWT verification and role-based access control
 */
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { AppError } = require('./errorHandler');

/**
 * Authenticate — verify JWT access token from Authorization header.
 * Attaches decoded user/admin to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists based on their role
    if (decoded.role === 'platform_admin') {
      const admin = await db('platform_admins').where({ id: decoded.userId }).first();
      if (!admin) throw new AppError('Admin no longer exists.', 401);
      req.user = { id: admin.id, email: admin.email, role: 'platform_admin' };
    } else if (decoded.role === 'business_owner') {
      const business = await db('businesses').where({ id: decoded.userId }).first();
      if (!business) throw new AppError('Business no longer exists.', 401);
      req.user = { id: business.id, email: business.owner_email, role: 'business_owner' };
    } else if (decoded.role === 'customer') {
      const customer = await db('customers').where({ id: decoded.userId }).first();
      if (!customer) throw new AppError('Customer no longer exists.', 401);
      req.user = { id: customer.id, email: customer.email, role: 'customer' };
    } else if (decoded.role === 'impersonating') {
      // Impersonation tokens are valid without DB lookup for speed, 
      // but they are short-lived. They grant business owner access.
      req.user = { id: decoded.businessId, email: decoded.businessEmail, role: 'impersonating', adminId: decoded.adminId };
    } else {
      throw new AppError('Invalid user role.', 401);
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please log in again.', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401));
    }
    next(err);
  }
};

/**
 * Authorize — restrict access to specific roles.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    // 'impersonating' acts like 'business_owner'
    const userRole = req.user.role === 'impersonating' ? 'business_owner' : req.user.role;
    
    if (!roles.includes(userRole) && !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

/**
 * Require platform admin only
 */
const requirePlatformAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'platform_admin') {
    return next(new AppError('Access denied. Platform Admin only.', 403));
  }
  next();
};

/**
 * Require business ownership — verify the authenticated user owns the business
 * being accessed. Loads the business and attaches to req.business.
 * Platform admins bypass this check.
 */
const requireBusinessOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    // Platform admins can access any business
    if (req.user.role === 'platform_admin') {
      const businessId = req.params.businessId || req.query.businessId;
      if (businessId) {
        const business = await db('businesses').where({ id: businessId }).first();
        if (!business) {
          return next(new AppError('Business not found.', 404));
        }
        req.business = business;
      }
      return next();
    }

    // For business owners or impersonators, load their business
    // Note: req.user.id is the business.id for business owners and impersonators
    const business = await db('businesses').where({ id: req.user.id }).first();

    if (!business) {
      return next(new AppError('No business found for your account.', 404));
    }

    req.business = business;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, authorize, requirePlatformAdmin, requireBusinessOwnership };
