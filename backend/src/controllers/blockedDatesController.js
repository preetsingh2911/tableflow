/**
 * Blocked Dates Controller
 */
const db = require('../db/connection');
const { catchAsync, AppError } = require('../middleware/errorHandler');

const listBlockedDates = catchAsync(async (req, res) => {
  const businessId = req.business.id;
  const { outletId, startDate, endDate } = req.query;

  let query = db('blocked_dates')
    .join('outlets', 'blocked_dates.outlet_id', 'outlets.id')
    .where('outlets.business_id', businessId)
    .select('blocked_dates.*', 'outlets.name as outlet_name');

  if (outletId) query = query.where('blocked_dates.outlet_id', outletId);
  if (startDate) query = query.where('blocked_dates.date', '>=', startDate);
  if (endDate) query = query.where('blocked_dates.date', '<=', endDate);

  const blockedDates = await query.orderBy('blocked_dates.date', 'asc');

  res.json({ status: 'success', data: { blockedDates } });
});

const blockDates = catchAsync(async (req, res) => {
  const businessId = req.business.id;
  const { outletId, dates, reason } = req.body; // dates: array of YYYY-MM-DD strings

  if (!Array.isArray(dates) || dates.length === 0) {
    throw new AppError('Dates array is required', 400);
  }

  const outlet = await db('outlets').where({ id: outletId, business_id: businessId }).first();
  if (!outlet) throw new AppError('Outlet not found', 404);

  const inserts = dates.map(date => ({
    outlet_id: outletId,
    date: date,
    reason: reason || null
  }));

  // Simple insert, ignoring duplicates might require native query or we can just try/catch
  // In MySQL we can use INSERT IGNORE, but Knex doesn't have a simple cross-db insert ignore.
  // Assuming frontend prevents dupes, or we just catch constraints.
  // Actually the schema doesn't enforce unique date per outlet. Let's do it manually.
  
  for (const item of inserts) {
    const existing = await db('blocked_dates').where({ outlet_id: outletId, date: item.date }).first();
    if (!existing) {
      await db('blocked_dates').insert(item);
    }
  }

  res.status(201).json({ status: 'success', message: 'Dates blocked successfully' });
});

const unblockDate = catchAsync(async (req, res) => {
  const { id } = req.params;
  const businessId = req.business.id;

  const blocked = await db('blocked_dates')
    .join('outlets', 'blocked_dates.outlet_id', 'outlets.id')
    .where('blocked_dates.id', id)
    .where('outlets.business_id', businessId)
    .first();

  if (!blocked) throw new AppError('Blocked date not found', 404);

  await db('blocked_dates').where({ id }).delete();

  res.json({ status: 'success', message: 'Date unblocked' });
});

module.exports = { listBlockedDates, blockDates, unblockDate };
