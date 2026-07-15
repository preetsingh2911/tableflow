/**
 * Time Slot Controller — CRUD for booking time windows per outlet
 */
const db = require('../db/connection');
const { AppError, catchAsync } = require('../middleware/errorHandler');

/**
 * GET /api/slots?outletId=X
 */
const listSlots = catchAsync(async (req, res) => {
  const { outletId } = req.query;

  if (!outletId) throw new AppError('outletId query parameter is required.', 400);

  // Verify outlet belongs to business
  const outlet = await db('outlets')
    .where({ id: outletId, business_id: req.business.id })
    .first();
  if (!outlet) throw new AppError('Outlet not found.', 404);

  const slots = await db('time_slots')
    .where({ outlet_id: outletId })
    .orderBy('id');

  res.json({ status: 'success', data: { slots } });
});

/**
 * POST /api/slots
 */
const createSlot = catchAsync(async (req, res) => {
  const { outletId, label, maxCovers } = req.body;

  // Verify outlet
  const outlet = await db('outlets')
    .where({ id: outletId, business_id: req.business.id })
    .first();
  if (!outlet) throw new AppError('Outlet not found.', 404);

  const [slotId] = await db('time_slots').insert({
    outlet_id: outletId,
    label: label,
    max_covers: maxCovers || 20,
    is_active: true
  });

  const slot = await db('time_slots').where({ id: slotId }).first();

  res.status(201).json({ status: 'success', message: 'Time slot created.', data: { slot } });
});

/**
 * POST /api/slots/bulk
 * Create multiple slots at once (e.g., presets)
 */
const createBulkSlots = catchAsync(async (req, res) => {
  const { outletId, slots } = req.body; // slots is an array: [{label, maxCovers}]

  if (!Array.isArray(slots) || slots.length === 0) {
    throw new AppError('slots must be a non-empty array.', 400);
  }

  const outlet = await db('outlets')
    .where({ id: outletId, business_id: req.business.id })
    .first();
  if (!outlet) throw new AppError('Outlet not found.', 404);

  const slotsToInsert = slots.map(slot => ({
    outlet_id: outletId,
    label: slot.label,
    max_covers: slot.maxCovers || 20,
    is_active: true
  }));

  await db('time_slots').insert(slotsToInsert);

  const createdSlots = await db('time_slots')
    .where({ outlet_id: outletId })
    .orderBy('id');

  res.status(201).json({
    status: 'success',
    message: `${slots.length} time slot(s) created.`,
    data: { slots: createdSlots },
  });
});

/**
 * PUT /api/slots/:id
 */
const updateSlot = catchAsync(async (req, res) => {
  const slot = await db('time_slots').where({ id: req.params.id }).first();
  if (!slot) throw new AppError('Time slot not found.', 404);

  // Verify outlet ownership
  const outlet = await db('outlets')
    .where({ id: slot.outlet_id, business_id: req.business.id })
    .first();
  if (!outlet) throw new AppError('Outlet not found.', 404);

  const updates = {};
  if (req.body.label !== undefined) updates.label = req.body.label;
  if (req.body.maxCovers !== undefined) updates.max_covers = req.body.maxCovers;
  if (req.body.isActive !== undefined) updates.is_active = req.body.isActive;

  await db('time_slots').where({ id: slot.id }).update(updates);
  const updated = await db('time_slots').where({ id: slot.id }).first();

  res.json({ status: 'success', message: 'Time slot updated.', data: { slot: updated } });
});

/**
 * DELETE /api/slots/:id
 */
const deleteSlot = catchAsync(async (req, res) => {
  const slot = await db('time_slots').where({ id: req.params.id }).first();
  if (!slot) throw new AppError('Time slot not found.', 404);

  const outlet = await db('outlets')
    .where({ id: slot.outlet_id, business_id: req.business.id })
    .first();
  if (!outlet) throw new AppError('Outlet not found.', 404);

  await db('time_slots').where({ id: slot.id }).delete();

  res.json({ status: 'success', message: 'Time slot deleted.' });
});

module.exports = { listSlots, createSlot, createBulkSlots, updateSlot, deleteSlot };
