/**
 * Table Controller — CRUD for individual table inventory per outlet
 */
const db = require('../db/connection');
const { AppError, catchAsync } = require('../middleware/errorHandler');

const listTables = catchAsync(async (req, res) => {
  const { outletId } = req.query;
  if (!outletId) throw new AppError('outletId query parameter is required.', 400);

  const outlet = await db('outlets').where({ id: outletId, business_id: req.business.id }).first();
  if (!outlet) throw new AppError('Outlet not found.', 404);

  const tables = await db('tables').where({ outlet_id: outletId }).orderBy('table_number');
  res.json({ status: 'success', data: { tables } });
});

const getTable = catchAsync(async (req, res) => {
  const table = await db('tables').where({ id: req.params.id }).first();
  if (!table) throw new AppError('Table not found.', 404);

  const outlet = await db('outlets').where({ id: table.outlet_id, business_id: req.business.id }).first();
  if (!outlet) throw new AppError('Table not found.', 404);

  res.json({ status: 'success', data: { table } });
});

const createTable = catchAsync(async (req, res) => {
  const { outletId, tableNumber, capacity, location } = req.body;

  const outlet = await db('outlets').where({ id: outletId, business_id: req.business.id }).first();
  if (!outlet) throw new AppError('Outlet not found.', 404);

  // Check for duplicate table number
  const existing = await db('tables').where({ outlet_id: outletId, table_number: tableNumber }).first();
  if (existing) throw new AppError(`Table "${tableNumber}" already exists in this outlet.`, 409);

  const [tableId] = await db('tables').insert({
    outlet_id: outletId,
    table_number: tableNumber,
    capacity: capacity || 4,
    location: location || 'indoor',
  });

  const table = await db('tables').where({ id: tableId }).first();
  res.status(201).json({ status: 'success', message: 'Table created.', data: { table } });
});

const updateTable = catchAsync(async (req, res) => {
  const table = await db('tables').where({ id: req.params.id }).first();
  if (!table) throw new AppError('Table not found.', 404);

  const outlet = await db('outlets').where({ id: table.outlet_id, business_id: req.business.id }).first();
  if (!outlet) throw new AppError('Table not found.', 404);

  const updates = {};
  if (req.body.tableNumber !== undefined) updates.table_number = req.body.tableNumber;
  if (req.body.capacity !== undefined) updates.capacity = req.body.capacity;
  if (req.body.location !== undefined) updates.location = req.body.location;
  if (req.body.isActive !== undefined) updates.is_active = req.body.isActive;

  await db('tables').where({ id: table.id }).update(updates);
  const updated = await db('tables').where({ id: table.id }).first();

  res.json({ status: 'success', message: 'Table updated.', data: { table: updated } });
});

const deleteTable = catchAsync(async (req, res) => {
  const table = await db('tables').where({ id: req.params.id }).first();
  if (!table) throw new AppError('Table not found.', 404);

  const outlet = await db('outlets').where({ id: table.outlet_id, business_id: req.business.id }).first();
  if (!outlet) throw new AppError('Table not found.', 404);

  await db('tables').where({ id: table.id }).delete();
  res.json({ status: 'success', message: 'Table deleted.' });
});

module.exports = { listTables, getTable, createTable, updateTable, deleteTable };
