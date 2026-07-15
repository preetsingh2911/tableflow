/**
 * Customer Controller — Manage customers for a business
 */
const db = require('../db/connection');
const { catchAsync } = require('../middleware/errorHandler');

const listCustomers = catchAsync(async (req, res) => {
  const businessId = req.business.id;

  const customers = await db('customers')
    .join('bookings', 'customers.phone', 'bookings.customer_phone')
    .join('outlets', 'bookings.outlet_id', 'outlets.id')
    .where('outlets.business_id', businessId)
    .select('customers.*')
    .count('bookings.id as total_bookings')
    .max('bookings.date as last_booking_date')
    .sum(db.raw("CASE WHEN bookings.status = 'no_show' THEN 1 ELSE 0 END as no_show_count"))
    .groupBy('customers.id')
    .orderBy('last_booking_date', 'desc');

  res.json({
    status: 'success',
    data: { customers }
  });
});

module.exports = { listCustomers };
