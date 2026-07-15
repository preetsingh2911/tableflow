const db = require('../db/connection');
const { AppError } = require('./errorHandler');

const checkSubscription = async (req, res, next) => {
  try {
    // We assume this is used AFTER authenticate (so req.user exists)
    // If it's a public route, req.business might be set differently
    
    let businessId = null;
    if (req.user && req.user.role === 'business_owner') {
      businessId = req.user.id;
    } else if (req.user && req.user.role === 'impersonating') {
      businessId = req.user.id; // Usually set to business ID when impersonating
    } else if (req.business) {
      businessId = req.business.id;
    }
    
    if (!businessId) {
      return next(new AppError('Business context required for subscription check.', 401));
    }

    const business = await db('businesses').where({ id: businessId }).first();
    
    if (!business) {
      return next(new AppError('Business not found.', 404));
    }

    // Check status
    if (business.subscription_status === 'suspended' || business.subscription_status === 'cancelled') {
      return res.status(403).json({
        status: 'error',
        code: 'SUBSCRIPTION_INACTIVE',
        message: 'Your subscription is inactive or suspended. Please update your billing details.',
      });
    }

    if (business.subscription_status === 'trial') {
      const now = new Date();
      const trialEnds = new Date(business.trial_ends_at);
      if (now > trialEnds) {
        return res.status(403).json({
          status: 'error',
          code: 'TRIAL_EXPIRED',
          message: 'Your trial has expired. Please upgrade your plan to continue.',
        });
      }
    }

    // Attach business to request for downstream handlers if not already there
    if (!req.business) req.business = business;
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { checkSubscription };
