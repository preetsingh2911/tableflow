/**
 * Auth Controller — Registration, Login, Token Refresh, Password Reset for Business Owners
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/connection');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { slugify } = require('../utils/helpers');
const { sendEmail, welcomeEmail, passwordResetEmail } = require('../services/emailService');
const razorpay = require('../services/razorpayService');

/**
 * Generate JWT access token (15 min)
 */
function generateAccessToken(business) {
  return jwt.sign(
    { userId: business.id, email: business.owner_email, role: 'business_owner' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Generate JWT refresh token (7 days)
 */
function generateRefreshToken(business) {
  return jwt.sign(
    { userId: business.id, type: 'refresh', role: 'business_owner' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/auth/register
 * Register a new business owner + create their business
 */
const register = catchAsync(async (req, res) => {
  const { email, password, fullName, phone, businessName, slug, businessType, city } = req.body;

  // Check if email already exists
  const existingEmail = await db('businesses').where({ owner_email: email }).first();
  if (existingEmail) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // Check if slug is available
  const cleanSlug = slug ? slug.toLowerCase().replace(/[^a-z0-9-]/g, '') : slugify(businessName);
  
  if (cleanSlug.length < 3 || cleanSlug.length > 30) {
    throw new AppError('Slug must be between 3 and 30 characters.', 400);
  }

  const existingBusiness = await db('businesses').where({ slug: cleanSlug }).first();
  if (existingBusiness) {
    throw new AppError(`The booking link "${cleanSlug}" is already taken. Please choose another one.`, 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create Razorpay Customer
  let razorpayCustomerId = null;
  try {
    const customer = await razorpay.createCustomer({
      name: fullName,
      email: email,
      contact: phone || '',
    });
    razorpayCustomerId = customer.id;
  } catch (err) {
    console.error('Failed to create Razorpay customer during registration:', err);
  }

  const [businessId] = await db('businesses').insert({
    name: businessName,
    slug: cleanSlug,
    owner_name: fullName,
    owner_email: email,
    owner_phone: phone || '',
    password_hash: passwordHash,
    cuisine_type: businessType || null,
    city: city || null,
    subscription_plan: 'trial',
    subscription_status: 'trial',
    trial_ends_at: db.raw("DATE_ADD(NOW(), INTERVAL 14 DAY)"),
    razorpay_customer_id: razorpayCustomerId,
    is_active: true
  });

  const business = await db('businesses').where({ id: businessId }).first();

  // Generate tokens
  const accessToken = generateAccessToken(business);
  const refreshToken = generateRefreshToken(business);

  // Store refresh token hash
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await db('refresh_tokens').insert({
    user_id: business.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Send welcome email (async, non-blocking)
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;
  sendEmail({
    to: email,
    ...welcomeEmail({ fullName, businessName, loginUrl }),
  }).catch(err => console.error('Welcome email failed:', err.message));

  res.status(201).json({
    status: 'success',
    message: 'Account created successfully. Welcome to TableFlow!',
    data: {
      user: { id: business.id, email, fullName, role: 'business_owner' },
      business: { id: business.id, name: businessName, slug: cleanSlug },
      accessToken,
      refreshToken,
    },
  });
});

/**
 * POST /api/auth/login
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Find business by owner_email
  const business = await db('businesses').where({ owner_email: email }).first();
  if (!business) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, business.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!business.is_active) {
    throw new AppError('Your account has been suspended or deactivated.', 403);
  }

  // Generate tokens
  const accessToken = generateAccessToken(business);
  const refreshToken = generateRefreshToken(business);

  // Store refresh token hash
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await db('refresh_tokens').insert({
    user_id: business.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.json({
    status: 'success',
    data: {
      user: {
        id: business.id,
        email: business.owner_email,
        fullName: business.owner_name,
        role: 'business_owner',
      },
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        logo_url: business.logo_url,
        brand_color: business.brand_colour,
        description: business.description,
        subscription_status: business.subscription_status
      },
      accessToken,
      refreshToken,
    },
  });
});

/**
 * POST /api/auth/refresh
 * Rotate refresh token
 */
const refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required.', 400);
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (decoded.role !== 'business_owner') throw new Error('Role mismatch');
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  // Check token in database
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const storedToken = await db('refresh_tokens')
    .where({ user_id: decoded.userId, token_hash: tokenHash, is_revoked: false })
    .first();

  if (!storedToken) {
    throw new AppError('Refresh token has been revoked.', 401);
  }

  // Revoke old token
  await db('refresh_tokens').where({ id: storedToken.id }).update({ is_revoked: true });

  // Get business
  const business = await db('businesses').where({ id: decoded.userId }).first();
  if (!business || !business.is_active) {
    throw new AppError('Business not found or inactive.', 401);
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(business);
  const newRefreshToken = generateRefreshToken(business);

  // Store new refresh token
  const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  await db('refresh_tokens').insert({
    user_id: business.id,
    token_hash: newTokenHash,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.json({
    status: 'success',
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
});

/**
 * POST /api/auth/logout
 */
const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await db('refresh_tokens')
      .where({ token_hash: tokenHash })
      .update({ is_revoked: true });
  }

  res.json({ status: 'success', message: 'Logged out successfully.' });
});

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = catchAsync(async (req, res) => {
  // Not fully implemented for new schema since reset tokens aren't in schema, 
  // but stubbing it to prevent errors.
  res.json({
    status: 'success',
    message: 'If that email is registered, you will receive a password reset link.',
  });
});

/**
 * POST /api/auth/reset-password
 */
const resetPassword = catchAsync(async (req, res) => {
  throw new AppError('Not implemented', 501);
});

/**
 * GET /api/auth/me — Get current user profile
 */
const getMe = catchAsync(async (req, res) => {
  // Check impersonation first
  if (req.user.role === 'impersonating') {
    const business = await db('businesses').where({ id: req.user.id }).first();
    return res.json({
      status: 'success',
      data: {
        user: { id: business.id, email: business.owner_email, fullName: business.owner_name, role: 'impersonating' },
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          logo_url: business.logo_url,
          brand_color: business.brand_colour,
          description: business.description,
          subscription_status: business.subscription_status
        }
      }
    });
  }

  const business = await db('businesses')
    .where({ id: req.user.id })
    .first();

  if (!business) throw new AppError('Business not found', 404);

  res.json({
    status: 'success',
    data: { 
      user: {
        id: business.id,
        email: business.owner_email,
        fullName: business.owner_name,
        role: 'business_owner',
      },
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        logo_url: business.logo_url,
        brand_color: business.brand_colour,
        subscription_status: business.subscription_status
      } 
    },
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
};
