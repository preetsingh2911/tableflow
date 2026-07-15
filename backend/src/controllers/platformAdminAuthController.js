/**
 * Platform Admin Auth Controller — Login, Refresh, Logout for Shyara Tech Admins
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/connection');
const { AppError, catchAsync } = require('../middleware/errorHandler');

/**
 * Generate JWT access token (15 min)
 */
function generateAccessToken(admin) {
  return jwt.sign(
    { userId: admin.id, email: admin.email, role: 'platform_admin' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Generate JWT refresh token (7 days)
 */
function generateRefreshToken(admin) {
  return jwt.sign(
    { userId: admin.id, type: 'refresh', role: 'platform_admin' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/platform-admin/auth/login
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Find admin
  const admin = await db('platform_admins').where({ email }).first();
  if (!admin) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Generate tokens
  const accessToken = generateAccessToken(admin);
  const refreshToken = generateRefreshToken(admin);

  // Store refresh token hash
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await db('refresh_tokens').insert({
    user_id: admin.id, // Using user_id for generic reference, although it's an admin
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.json({
    status: 'success',
    data: {
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'platform_admin',
      },
      accessToken,
      refreshToken,
    },
  });
});

/**
 * POST /api/platform-admin/auth/refresh
 */
const refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required.', 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (decoded.role !== 'platform_admin') throw new Error('Role mismatch');
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const storedToken = await db('refresh_tokens')
    .where({ user_id: decoded.userId, token_hash: tokenHash, is_revoked: false })
    .first();

  if (!storedToken) {
    throw new AppError('Refresh token has been revoked.', 401);
  }

  await db('refresh_tokens').where({ id: storedToken.id }).update({ is_revoked: true });

  const admin = await db('platform_admins').where({ id: decoded.userId }).first();
  if (!admin) {
    throw new AppError('Admin not found.', 401);
  }

  const newAccessToken = generateAccessToken(admin);
  const newRefreshToken = generateRefreshToken(admin);

  const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  await db('refresh_tokens').insert({
    user_id: admin.id,
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
 * POST /api/platform-admin/auth/logout
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
 * GET /api/platform-admin/auth/me
 */
const getMe = catchAsync(async (req, res) => {
  const admin = await db('platform_admins')
    .select('id', 'email', 'name', 'created_at')
    .where({ id: req.user.id })
    .first();

  if (!admin) throw new AppError('Admin not found', 404);

  res.json({
    status: 'success',
    data: {
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'platform_admin'
      }
    },
  });
});

module.exports = {
  login,
  refresh,
  logout,
  getMe,
};
