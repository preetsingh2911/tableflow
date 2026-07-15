/**
 * Booking Controller — Business owner booking management
 */
const db = require('../db/connection');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { paginate } = require('../utils/helpers');
const { notifyNewBooking, notifyConfirmed, notifyCancelled } = require('../services/notifications');

/**
 * GET /api/bookings — List bookings with filters
 */
const listBookings = catchAsync(async (req, res) => {
  const { outletId, status, date, dateFrom, dateTo, search, page, limit } = req.query;

  let query = db('bookings')
    .join('outlets', 'bookings.outlet_id', 'outlets.id')
    .leftJoin('time_slots', 'bookings.time_slot_id', 'time_slots.id')
    .where('outlets.business_id', req.business.id)
    .select(
      'bookings.*',
      'outlets.name as outlet_name',
      'time_slots.start_time as slot_start',
      'time_slots.end_time as slot_end',
      'time_slots.label as slot_label'
    );

  if (outletId) query = query.where('bookings.outlet_id', outletId);
  if (status) query = query.where('bookings.status', status);
  if (date) query = query.where('bookings.date', date);
  if (dateFrom) query = query.where('bookings.date', '>=', dateFrom);
  if (dateTo) query = query.where('bookings.date', '<=', dateTo);
  if (search) {
    query = query.where(function () {
      this.where('bookings.customer_name', 'like', `%${search}%`)
        .orWhere('bookings.customer_phone', 'like', `%${search}%`)
        .orWhere('bookings.confirmation_code', 'like', `%${search}%`);
    });
  }

  query = query.orderBy('bookings.date', 'desc').orderBy('time_slots.start_time', 'asc');

  const result = await paginate(query, page, limit);

  res.json({ status: 'success', data: result });
});

/**
 * GET /api/bookings/:id
 */
const getBooking = catchAsync(async (req, res) => {
  const booking = await db('bookings')
    .join('outlets', 'bookings.outlet_id', 'outlets.id')
    .leftJoin('time_slots', 'bookings.time_slot_id', 'time_slots.id')
    .where('bookings.id', req.params.id)
    .where('outlets.business_id', req.business.id)
    .select(
      'bookings.*',
      'outlets.name as outlet_name',
      'time_slots.start_time as slot_start',
      'time_slots.end_time as slot_end',
      'time_slots.label as slot_label'
    )
    .first();

  if (!booking) throw new AppError('Booking not found.', 404);

  res.json({ status: 'success', data: { booking } });
});

/**
 * PUT /api/bookings/:id/status — Change booking status
 */
const updateBookingStatus = catchAsync(async (req, res) => {
  const { status, cancellationReason } = req.body;

  const validStatuses = ['confirmed', 'cancelled', 'completed', 'no_show'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  const booking = await db('bookings')
    .join('outlets', 'bookings.outlet_id', 'outlets.id')
    .where('bookings.id', req.params.id)
    .where('outlets.business_id', req.business.id)
    .select('bookings.*')
    .first();

  if (!booking) throw new AppError('Booking not found.', 404);

  const updates = { status };
  if (status === 'cancelled' && cancellationReason) {
    updates.cancellation_reason = cancellationReason;
  }

  await db('bookings').where({ id: booking.id }).update(updates);

  // Log the status change
  await db('audit_logs').insert({
    user_id: req.user.id,
    business_id: req.business.id,
    action: `booking.${status}`,
    entity_type: 'booking',
    entity_id: booking.id,
    metadata_json: JSON.stringify({ previousStatus: booking.status, newStatus: status }),
  });

  // Notifications
  const fullBooking = await db('bookings')
    .join('outlets', 'bookings.outlet_id', 'outlets.id')
    .join('businesses', 'outlets.business_id', 'businesses.id')
    .join('time_slots', 'bookings.time_slot_id', 'time_slots.id')
    .where('bookings.id', booking.id)
    .select(
      'bookings.id as bookingId',
      'bookings.customer_name as customerName',
      'bookings.customer_email as customerEmail',
      'bookings.customer_phone as customerPhone',
      'bookings.booking_date as bookingDate',
      'bookings.confirmation_code as confirmationCode',
      'outlets.name as outletName',
      'outlets.manager_email as managerEmail',
      'outlets.manager_phone as managerPhone',
      'businesses.name as businessName',
      'time_slots.start_time as timeSlot'
    ).first();

  if (fullBooking) {
    fullBooking.timeSlot = fullBooking.timeSlot.slice(0, 5);
    if (status === 'confirmed') {
      await notifyConfirmed(fullBooking);
    } else if (status === 'cancelled') {
      fullBooking.cancellationReason = cancellationReason;
      await notifyCancelled(fullBooking, 'business');
    }
  }

  res.json({
    status: 'success',
    message: `Booking ${status}.`,
    data: { bookingId: booking.id, status },
  });
});

/**
 * POST /api/bookings/manual — Dashboard booking (no deposit checking)
 */
const createManualBooking = catchAsync(async (req, res) => {
  const { outletId, date, timeSlotId, customerName, customerPhone, customerEmail, guests, occasion, specialRequests, sendConfirmation } = req.body;

  const outlet = await db('outlets').where({ id: outletId, business_id: req.business.id }).first();
  if (!outlet) throw new AppError('Outlet not found.', 404);

  // Check booking limit
  if (req.business.subscription_plan === 'starter') {
    const monthlyCount = await db('bookings')
      .join('outlets', 'bookings.outlet_id', 'outlets.id')
      .where('outlets.business_id', req.business.id)
      .whereRaw('MONTH(bookings.created_at) = MONTH(CURRENT_DATE())')
      .whereRaw('YEAR(bookings.created_at) = YEAR(CURRENT_DATE())')
      .count('bookings.id as count')
      .first();

    if (monthlyCount.count >= 100) {
      throw new AppError('You have reached your monthly booking limit of 100. Please upgrade your plan to accept more bookings.', 403);
    }
  }

  // Generate short unique reference
  const bookingRef = 'TF' + Math.random().toString(36).substr(2, 6).toUpperCase();

  const [bookingId] = await db('bookings').insert({
    business_id: req.business.id,
    outlet_id: outletId,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail || null,
    date: date,
    time_slot_id: timeSlotId,
    guests: guests,
    occasion: occasion || 'none',
    special_requests: specialRequests || null,
    status: 'confirmed',
    booking_ref: bookingRef,
  });

  // Optionally insert into customers table (or upsert)
  const existingCustomer = await db('customers').where({ phone: customerPhone }).first();
  if (!existingCustomer) {
    await db('customers').insert({
      name: customerName,
      phone: customerPhone,
      email: customerEmail || null
    });
  }

  // Notifications
  const timeSlot = await db('time_slots').where({ id: timeSlotId }).first();
  const timeSlotDisplay = timeSlot ? timeSlot.start_time.slice(0, 5) : '';
  const owner = await db('users').where({ id: req.business.owner_id }).first();

  await notifyNewBooking({
    bookingId,
    confirmationCode: bookingRef,
    customerName,
    customerEmail,
    customerPhone,
    guestCount: guests,
    bookingDate: date,
    timeSlot: timeSlotDisplay,
    specialRequests,
    occasion: occasion || 'none',
    businessName: req.business.name,
    businessSlug: req.business.slug,
    outletName: outlet.name,
    managerPhone: outlet.manager_phone || owner?.phone,
    managerEmail: outlet.manager_email || owner?.email,
  }, { 
    notifyCustomer: sendConfirmation,
    notifyManager: true 
  });

  res.status(201).json({
    status: 'success',
    message: 'Booking created.',
    data: { bookingId, bookingRef }
  });
});

/**
 * GET /api/bookings/stats — Dashboard analytics
 */
const getStats = catchAsync(async (req, res) => {
  const businessId = req.business.id;
  const today = db.raw('CURDATE()');

  // Today's bookings
  const todayStats = await db('bookings')
    .join('outlets', 'bookings.outlet_id', 'outlets.id')
    .where('outlets.business_id', businessId)
    .where('bookings.date', today)
    .select(
      db.raw('COUNT(bookings.id) as total'),
      db.raw("SUM(CASE WHEN bookings.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed"),
      db.raw("SUM(CASE WHEN bookings.status = 'pending' THEN 1 ELSE 0 END) as pending"),
      db.raw("SUM(CASE WHEN bookings.status = 'no_show' THEN 1 ELSE 0 END) as no_shows")
    )
    .first();

  // Upcoming bookings (confirmed, next 7 days)
  const upcomingCount = await db('bookings')
    .join('outlets', 'bookings.outlet_id', 'outlets.id')
    .where('outlets.business_id', businessId)
    .where('bookings.date', '>', today)
    .where('bookings.date', '<=', db.raw("DATE_ADD(CURDATE(), INTERVAL 7 DAY)"))
    .whereIn('bookings.status', ['pending', 'confirmed'])
    .count('bookings.id as count')
    .first();

  // Next 5 upcoming list
  const upcomingList = await db('bookings')
    .join('outlets', 'bookings.outlet_id', 'outlets.id')
    .leftJoin('time_slots', 'bookings.time_slot_id', 'time_slots.id')
    .where('outlets.business_id', businessId)
    .where('bookings.date', '>=', today)
    .whereIn('bookings.status', ['pending', 'confirmed'])
    .select(
      'bookings.id', 'bookings.customer_name', 'bookings.guests', 'bookings.date', 'bookings.status',
      'outlets.name as outlet_name', 'time_slots.label as slot_label'
    )
    .orderBy('bookings.date', 'asc')
    .limit(5);

  res.json({
    status: 'success',
    data: {
      todayBookings: parseInt(todayStats.total) || 0,
      todayConfirmed: parseInt(todayStats.confirmed) || 0,
      todayPending: parseInt(todayStats.pending) || 0,
      todayNoShows: parseInt(todayStats.no_shows) || 0,
      upcomingBookings: upcomingCount.count,
      upcomingList: upcomingList,
    },
  });
});

module.exports = { listBookings, getBooking, updateBookingStatus, getStats, createManualBooking };
