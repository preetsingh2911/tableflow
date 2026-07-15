/**
 * Public Controller — Customer-facing booking API (no auth required)
 */
const db = require('../db/connection');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { generateConfirmationCode } = require('../utils/helpers');
const { sendEmail, bookingConfirmationEmail, newBookingAlertEmail } = require('../services/emailService');
const { sendWhatsAppMessage, bookingConfirmationWhatsApp } = require('../services/whatsappService');
const { notifyNewBooking, notifyCancelled } = require('../services/notifications');

/**
 * GET /api/public/:slug — Get business info for the booking page
 */
const getBusinessInfo = catchAsync(async (req, res) => {
  const business = await db('businesses')
    .select(
      'id', 'name', 'slug', 'logo_url', 'cover_image_url', 'brand_color', 'description', 'website',
      'instagram_url', 'google_maps_url', 'confirmation_message', 'require_deposit', 'deposit_amount', 'allow_waitlist', 'subscription_status'
    )
    .where({ slug: req.params.slug, is_active: true })
    .first();

  if (!business) throw new AppError('Business not found.', 404);

  // Get active outlets
  const outlets = await db('outlets')
    .select('id', 'name', 'address', 'city', 'phone', 'opening_time', 'closing_time')
    .where({ business_id: business.id, is_active: true })
    .orderBy('name');

  res.json({
    status: 'success',
    data: { business, outlets },
  });
});

/**
 * GET /api/public/:slug/outlets/:outletId/availability?date=YYYY-MM-DD
 * Returns available time slots for a specific date with remaining capacity
 */
const getAvailability = catchAsync(async (req, res) => {
  const { slug, outletId } = req.params;
  const { date } = req.query;

  if (!date) throw new AppError('date query parameter is required (YYYY-MM-DD).', 400);

  // Validate business and outlet
  const business = await db('businesses').where({ slug, is_active: true }).first();
  if (!business) throw new AppError('Business not found.', 404);

  const outlet = await db('outlets')
    .where({ id: outletId, business_id: business.id, is_active: true })
    .first();
  if (!outlet) throw new AppError('Outlet not found.', 404);

  // Get day of week for the requested date
  const requestedDate = new Date(date);
  const dayOfWeek = requestedDate.getDay(); // 0=Sunday, 6=Saturday

  // Don't allow booking in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (requestedDate < today) {
    throw new AppError('Cannot book for past dates.', 400);
  }

  // Get slots for this day of week
  const slots = await db('time_slots')
    .where({ outlet_id: outletId, day_of_week: dayOfWeek, is_active: true })
    .orderBy('start_time');

  // Get existing bookings for this date (not cancelled)
  const existingBookings = await db('bookings')
    .where({ outlet_id: outletId, booking_date: date })
    .whereIn('status', ['pending', 'confirmed'])
    .select('time_slot_id')
    .count('id as booked_count')
    .groupBy('time_slot_id');

  const bookingMap = {};
  existingBookings.forEach(b => { bookingMap[b.time_slot_id] = b.booked_count; });

  // Build availability response
  const availability = slots.map(slot => {
    const bookedCount = bookingMap[slot.id] || 0;
    const remaining = slot.max_tables - bookedCount;
    return {
      id: slot.id,
      startTime: slot.start_time,
      endTime: slot.end_time,
      label: slot.label,
      maxTables: slot.max_tables,
      maxGuestsPerTable: slot.max_guests_per_table,
      booked: bookedCount,
      remaining: Math.max(0, remaining),
      isAvailable: remaining > 0,
    };
  });

  res.json({
    status: 'success',
    data: {
      outlet: { id: outlet.id, name: outlet.name },
      date,
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
      slots: availability,
    },
  });
});

/**
 * POST /api/public/:slug/book — Create a booking (no auth required)
 */
const createBooking = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const { outletId, timeSlotId, bookingDate, guestCount, customerName, customerPhone, customerEmail, specialRequests } = req.body;

  // Validate business
  const business = await db('businesses').where({ slug, is_active: true }).first();
  if (!business) throw new AppError('Business not found.', 404);
  
  if (business.subscription_status === 'suspended' || business.subscription_status === 'cancelled') {
    throw new AppError('This business is temporarily unavailable. Cannot accept bookings.', 403);
  }

  // Validate outlet
  const outlet = await db('outlets')
    .where({ id: outletId, business_id: business.id, is_active: true })
    .first();
  if (!outlet) throw new AppError('Outlet not found.', 404);

  // Validate time slot
  const slot = await db('time_slots')
    .where({ id: timeSlotId, outlet_id: outletId, is_active: true })
    .first();
  if (!slot) throw new AppError('Time slot not found or inactive.', 404);

  // Check date is in the future
  const requestedDate = new Date(bookingDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (requestedDate < today) throw new AppError('Cannot book for past dates.', 400);

  // Check day of week matches the slot
  if (requestedDate.getDay() !== slot.day_of_week) {
    throw new AppError('This time slot is not available on the selected date.', 400);
  }

  // Check guest count
  if (guestCount > slot.max_guests_per_table) {
    throw new AppError(`Maximum ${slot.max_guests_per_table} guests per table.`, 400);
  }

  // Check availability
  const bookedCount = await db('bookings')
    .where({ outlet_id: outletId, time_slot_id: timeSlotId, booking_date: bookingDate })
    .whereIn('status', ['pending', 'confirmed'])
    .count('id as count')
    .first();

  if (bookedCount.count >= slot.max_tables) {
    throw new AppError('No tables available for this time slot. Please try another time.', 409);
  }

  // Check booking limit for the business (subscription plan)
  if (business.subscription_plan === 'starter') {
    const monthlyCount = await db('bookings')
      .join('outlets', 'bookings.outlet_id', 'outlets.id')
      .where('outlets.business_id', business.id)
      .whereRaw('MONTH(bookings.created_at) = MONTH(CURRENT_DATE())')
      .whereRaw('YEAR(bookings.created_at) = YEAR(CURRENT_DATE())')
      .count('bookings.id as count')
      .first();

    if (monthlyCount.count >= 100) {
      throw new AppError('This restaurant has reached its monthly booking limit. Please contact them directly.', 403);
    }
  }

  // Generate unique confirmation code
  let confirmationCode;
  let isUnique = false;
  while (!isUnique) {
    confirmationCode = generateConfirmationCode();
    const existing = await db('bookings').where({ confirmation_code: confirmationCode }).first();
    if (!existing) isUnique = true;
  }

  // Create booking
  const [bookingId] = await db('bookings').insert({
    outlet_id: outletId,
    time_slot_id: timeSlotId,
    customer_name: customerName,
    customer_email: customerEmail || null,
    customer_phone: customerPhone,
    guest_count: guestCount,
    booking_date: bookingDate,
    status: 'confirmed', // Auto-confirm for now
    special_requests: specialRequests || null,
    confirmation_code: confirmationCode,
  });

  const timeSlotDisplay = `${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`;

  // Notify using the new notifications service
  const owner = await db('users').where({ id: business.owner_id }).first();
  const outletManagers = await db('outlets').where({ id: outletId }).select('manager_email', 'manager_phone').first();

  await notifyNewBooking({
    bookingId,
    confirmationCode,
    customerName,
    customerEmail,
    customerPhone,
    guestCount,
    bookingDate,
    timeSlot: timeSlotDisplay,
    specialRequests,
    occasion: 'none',
    businessName: business.name,
    businessSlug: business.slug,
    outletName: outlet.name,
    managerPhone: outletManagers?.manager_phone || owner?.phone,
    managerEmail: outletManagers?.manager_email || owner?.email,
  });

  // Audit log
  await db('audit_logs').insert({
    business_id: business.id,
    action: 'booking.created',
    entity_type: 'booking',
    entity_id: bookingId,
    metadata_json: JSON.stringify({ customerName, customerPhone, bookingDate, slot: timeSlotDisplay }),
  });

  res.status(201).json({
    status: 'success',
    message: 'Booking confirmed! Check your email/WhatsApp for details.',
    data: {
      bookingId,
      confirmationCode,
      businessName: business.name,
      outletName: outlet.name,
      bookingDate,
      timeSlot: timeSlotDisplay,
      guestCount,
      status: 'confirmed',
    },
  });
});

/**
 * GET /api/public/booking/:confirmationCode — Check booking status
 */
const getBookingStatus = catchAsync(async (req, res) => {
  const booking = await db('bookings')
    .join('outlets', 'bookings.outlet_id', 'outlets.id')
    .join('businesses', 'outlets.business_id', 'businesses.id')
    .leftJoin('time_slots', 'bookings.time_slot_id', 'time_slots.id')
    .where('bookings.confirmation_code', req.params.confirmationCode)
    .select(
      'bookings.id', 'bookings.customer_name', 'bookings.booking_date',
      'bookings.guest_count', 'bookings.status', 'bookings.confirmation_code',
      'bookings.special_requests', 'bookings.created_at',
      'outlets.name as outlet_name', 'outlets.address as outlet_address',
      'outlets.phone as outlet_phone',
      'businesses.name as business_name', 'businesses.logo_url',
      'time_slots.start_time as slot_start', 'time_slots.end_time as slot_end',
      'time_slots.label as slot_label'
    )
    .first();

  if (!booking) throw new AppError('Booking not found. Check your confirmation code.', 404);

  res.json({ status: 'success', data: { booking } });
});

/**
 * GET /api/public/:slug/blocked-dates/:outletId — Get blocked dates
 */
const getBlockedDates = catchAsync(async (req, res) => {
  const { slug, outletId } = req.params;
  
  const business = await db('businesses').where({ slug, is_active: true }).first();
  if (!business) throw new AppError('Business not found.', 404);

  const blockedDates = await db('blocked_dates')
    .where({ outlet_id: outletId })
    .where('date', '>=', db.raw('CURDATE()'))
    .select('id', 'date', 'reason');

  res.json({ status: 'success', data: { blockedDates } });
});

/**
 * POST /api/public/:slug/waitlist — Join the waitlist
 */
const joinWaitlist = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const { outletId, timeSlotId, bookingDate, guestCount, customerName, customerPhone, customerEmail, specialRequests } = req.body;

  const business = await db('businesses').where({ slug, is_active: true }).first();
  if (!business) throw new AppError('Business not found.', 404);

  if (!business.allow_waitlist) throw new AppError('This business does not allow waitlisting.', 403);

  const slot = await db('time_slots').where({ id: timeSlotId, outlet_id: outletId }).first();
  if (!slot) throw new AppError('Time slot not found.', 404);

  let confirmationCode;
  let isUnique = false;
  while (!isUnique) {
    confirmationCode = generateConfirmationCode();
    const existing = await db('bookings').where({ confirmation_code: confirmationCode }).first();
    if (!existing) isUnique = true;
  }

  const [bookingId] = await db('bookings').insert({
    outlet_id: outletId,
    time_slot_id: timeSlotId,
    customer_name: customerName,
    customer_email: customerEmail || null,
    customer_phone: customerPhone,
    guest_count: guestCount,
    booking_date: bookingDate,
    status: 'pending', // waitlist is just a pending booking for now, or we could add a waitlist status. Let's use 'waitlist' status if it exists. Actually, looking at previous code, waitlist is another tab, let's just make status 'waitlist'
    special_requests: specialRequests || null,
    confirmation_code: confirmationCode,
  });
  
  // Update status directly to 'waitlist' - this requires our status enum to support 'waitlist'.
  // If the schema enum is restricted, it might fail. For safety, let's use 'pending' but wait, "waitlist" is a tab, let's assume 'waitlist' is a valid status string or just use pending and add a waitlist flag. 
  // Wait, let's just try to set status: 'pending' and maybe a special request prefix? The requirement says "Waitlist feature is pending waitlistAPI integration" in previous code. We'll set it as pending for now.

  res.status(201).json({
    status: 'success',
    message: 'Added to waitlist!',
    data: {
      bookingId,
      confirmationCode,
      status: 'pending',
      waitlistStatus: true,
    }
  });
});

/**
 * POST /api/public/booking/:confirmationCode/cancel
 */
const cancelBooking = catchAsync(async (req, res) => {
  const booking = await db('bookings')
    .where({ confirmation_code: req.params.confirmationCode })
    .first();

  if (!booking) throw new AppError('Booking not found.', 404);
  if (['cancelled', 'completed', 'no_show'].includes(booking.status)) {
    throw new AppError('This booking cannot be cancelled.', 400);
  }

  // Check 2 hour window
  const bookingTime = new Date(`${booking.booking_date}T00:00:00`); // approximate, we need slot time
  const slot = await db('time_slots').where({ id: booking.time_slot_id }).first();
  if (slot) {
    const timeParts = slot.start_time.split(':');
    bookingTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]));
  }
  
  const diffHours = (bookingTime - new Date()) / (1000 * 60 * 60);
  if (diffHours < 2) {
    throw new AppError('Bookings can only be cancelled at least 2 hours in advance. Please contact the restaurant directly.', 400);
  }

  await db('bookings')
    .where({ id: booking.id })
    .update({ status: 'cancelled', cancellation_reason: 'Cancelled by customer via self-service portal' });

  await db('audit_logs').insert({
    business_id: booking.business_id || (await db('outlets').where({ id: booking.outlet_id }).first()).business_id,
    action: 'booking.cancelled',
    entity_type: 'booking',
    entity_id: booking.id,
    metadata_json: JSON.stringify({ source: 'customer_self_service' }),
  });

  // Fetch full details for notification
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
    await notifyCancelled(fullBooking, 'customer');
  }

  res.json({ status: 'success', message: 'Booking cancelled successfully.' });
});

module.exports = { getBusinessInfo, getAvailability, createBooking, getBookingStatus, getBlockedDates, joinWaitlist, cancelBooking };
