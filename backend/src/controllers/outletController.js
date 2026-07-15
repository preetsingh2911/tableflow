/**
 * Outlet Controller — CRUD for physical outlet locations
 */
const db = require('../db/connection');
const { AppError, catchAsync } = require('../middleware/errorHandler');

/**
 * GET /api/outlets
 */
const listOutlets = catchAsync(async (req, res) => {
  const outlets = await db('outlets')
    .where({ business_id: req.business.id })
    .orderBy('created_at', 'desc');

  res.json({ status: 'success', data: { outlets } });
});

/**
 * GET /api/outlets/:id
 */
const getOutlet = catchAsync(async (req, res) => {
  const outlet = await db('outlets')
    .where({ id: req.params.id, business_id: req.business.id })
    .first();

  if (!outlet) throw new AppError('Outlet not found.', 404);

  // Get table count and slot count
  const tableCount = await db('tables').where({ outlet_id: outlet.id }).count('id as count').first();
  const slotCount = await db('time_slots').where({ outlet_id: outlet.id }).count('id as count').first();

  res.json({
    status: 'success',
    data: { outlet, tableCount: tableCount.count, slotCount: slotCount.count },
  });
});

/**
 * POST /api/outlets
 */
const createOutlet = catchAsync(async (req, res) => {
  const { name, address, city, state, pincode, phone, email, latitude, longitude, seatingCapacity, openingTime, closingTime } = req.body;

  // Check outlet limit based on subscription plan
  const plan = req.business.subscription_plan; // 'starter', 'growth', 'franchise', 'trial'
  
  let maxOutlets = null;
  if (plan === 'starter') maxOutlets = 1;
  else if (plan === 'growth') maxOutlets = 5;
  // franchise and trial have no strict limits on outlets here

  if (maxOutlets !== null) {
    const currentCount = await db('outlets').where({ business_id: req.business.id }).count('id as count').first();
    if (currentCount.count >= maxOutlets) {
      throw new AppError(`Your plan allows only ${maxOutlets} outlet(s). Please upgrade to add more.`, 403);
    }
  }

  const [outletId] = await db('outlets').insert({
    business_id: req.business.id,
    name,
    address,
    city,
    state,
    pincode,
    phone: phone || null,
    email: email || null,
    latitude: latitude || null,
    longitude: longitude || null,
    seating_capacity: seatingCapacity || 20,
    opening_time: openingTime || '09:00',
    closing_time: closingTime || '23:00',
  });

  const outlet = await db('outlets').where({ id: outletId }).first();

  res.status(201).json({
    status: 'success',
    message: 'Outlet created successfully.',
    data: { outlet },
  });
});

/**
 * PUT /api/outlets/:id
 */
const updateOutlet = catchAsync(async (req, res) => {
  const outlet = await db('outlets')
    .where({ id: req.params.id, business_id: req.business.id })
    .first();

  if (!outlet) throw new AppError('Outlet not found.', 404);

  const allowedFields = ['name', 'address', 'city', 'state', 'pincode', 'phone', 'email',
    'latitude', 'longitude', 'seating_capacity', 'opening_time', 'closing_time', 'is_active'];

  const fieldMap = {
    seatingCapacity: 'seating_capacity',
    openingTime: 'opening_time',
    closingTime: 'closing_time',
    isActive: 'is_active',
  };

  const updates = {};
  for (const [key, value] of Object.entries(req.body)) {
    const dbField = fieldMap[key] || key;
    if (allowedFields.includes(dbField) && value !== undefined) {
      updates[dbField] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields to update.', 400);
  }

  await db('outlets').where({ id: outlet.id }).update(updates);
  const updated = await db('outlets').where({ id: outlet.id }).first();

  res.json({ status: 'success', message: 'Outlet updated.', data: { outlet: updated } });
});

/**
 * DELETE /api/outlets/:id
 */
const deleteOutlet = catchAsync(async (req, res) => {
  const outlet = await db('outlets')
    .where({ id: req.params.id, business_id: req.business.id })
    .first();

  if (!outlet) throw new AppError('Outlet not found.', 404);

  // Check for future bookings
  const futureBookings = await db('bookings')
    .where({ outlet_id: outlet.id })
    .where('booking_date', '>=', db.raw('CURDATE()'))
    .whereIn('status', ['pending', 'confirmed'])
    .count('id as count')
    .first();

  if (futureBookings.count > 0) {
    throw new AppError(`Cannot delete outlet with ${futureBookings.count} upcoming booking(s). Cancel them first.`, 400);
  }

  await db('outlets').where({ id: outlet.id }).delete();

  res.json({ status: 'success', message: 'Outlet deleted.' });
});

module.exports = { listOutlets, getOutlet, createOutlet, updateOutlet, deleteOutlet };
