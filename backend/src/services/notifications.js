const db = require('../db/connection');
const { sendEmail, ...emailTemplates } = require('./emailService');
const { sendWhatsAppMessage, ...whatsappTemplates } = require('./whatsappService');

/**
 * Log notification attempt to DB
 */
async function logNotification(bookingId, type, recipient, status, errorMessage = null) {
  try {
    await db('notifications_log').insert({
      booking_id: bookingId || null,
      type,
      recipient,
      status,
      error_message: errorMessage ? errorMessage.toString().substring(0, 255) : null
    });
  } catch (err) {
    console.error('Failed to log notification:', err);
  }
}

/**
 * Helper to safely send email and log
 */
async function sendAndLogEmail(bookingId, type, to, emailObj) {
  if (!to) return;
  try {
    const result = await sendEmail({ to, ...emailObj });
    await logNotification(bookingId, type, to, result.error ? 'failed' : 'sent', result.error);
  } catch (err) {
    await logNotification(bookingId, type, to, 'failed', err.message);
  }
}

/**
 * Helper to safely send WhatsApp and log
 */
async function sendAndLogWhatsApp(bookingId, type, to, body) {
  if (!to) return;
  try {
    const result = await sendWhatsAppMessage({ to, body });
    await logNotification(bookingId, type, to, result.error ? 'failed' : 'sent', result.error);
  } catch (err) {
    await logNotification(bookingId, type, to, 'failed', err.message);
  }
}

/**
 * 1. & 2. New Booking Created
 */
async function notifyNewBooking(booking, options = {}) {
  const { notifyManager = true, notifyCustomer = true } = options;
  
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const cancelLink = `${baseUrl}/cancel/${booking.confirmationCode}`;

  // Notify Manager (WhatsApp)
  if (notifyManager && booking.managerPhone) {
    await sendAndLogWhatsApp(
      booking.bookingId,
      'whatsapp_new_booking_manager',
      booking.managerPhone,
      whatsappTemplates.newBookingAlertManager({
        outletName: booking.outletName,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        bookingDate: booking.bookingDate,
        timeSlot: booking.timeSlot,
        guestCount: booking.guestCount,
        occasion: booking.occasion || 'none',
        confirmationCode: booking.confirmationCode,
        specialRequests: booking.specialRequests,
      })
    );
  }

  // Notify Customer (Email & WhatsApp)
  if (notifyCustomer) {
    if (booking.customerEmail) {
      await sendAndLogEmail(
        booking.bookingId,
        'email_booking_confirmation_customer',
        booking.customerEmail,
        emailTemplates.bookingConfirmationEmail({
          customerName: booking.customerName,
          businessName: booking.businessName,
          outletName: booking.outletName,
          bookingDate: booking.bookingDate,
          timeSlot: booking.timeSlot,
          guestCount: booking.guestCount,
          confirmationCode: booking.confirmationCode,
        })
      );
    }
    if (booking.customerPhone) {
      await sendAndLogWhatsApp(
        booking.bookingId,
        'whatsapp_booking_confirmation_customer',
        booking.customerPhone,
        whatsappTemplates.bookingConfirmationWhatsApp({
          customerName: booking.customerName,
          businessName: booking.businessName,
          outletName: booking.outletName,
          bookingDate: booking.bookingDate,
          timeSlot: booking.timeSlot,
          guestCount: booking.guestCount,
          confirmationCode: booking.confirmationCode,
          cancelLink,
        })
      );
    }
  }
}

/**
 * 3. Booking Confirmed by Business Owner
 */
async function notifyConfirmed(booking) {
  if (booking.customerEmail) {
    await sendAndLogEmail(
      booking.bookingId,
      'email_booking_confirmed_by_business',
      booking.customerEmail,
      emailTemplates.bookingConfirmedByBusinessEmail({
        customerName: booking.customerName,
        businessName: booking.businessName,
        outletName: booking.outletName,
        bookingDate: booking.bookingDate,
        timeSlot: booking.timeSlot,
        guestCount: booking.guestCount,
        confirmationCode: booking.confirmationCode,
      })
    );
  }
  if (booking.customerPhone) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const cancelLink = `${baseUrl}/cancel/${booking.confirmationCode}`;
    await sendAndLogWhatsApp(
      booking.bookingId,
      'whatsapp_booking_confirmed_by_business',
      booking.customerPhone,
      whatsappTemplates.bookingConfirmationWhatsApp({ // same as original confirm
        customerName: booking.customerName,
        businessName: booking.businessName,
        outletName: booking.outletName,
        bookingDate: booking.bookingDate,
        timeSlot: booking.timeSlot,
        guestCount: booking.guestCount,
        confirmationCode: booking.confirmationCode,
        cancelLink,
      })
    );
  }
}

/**
 * 4. & 5. Booking Cancelled
 * source = 'business' | 'customer'
 */
async function notifyCancelled(booking, source = 'business', reason = null) {
  if (source === 'business') {
    if (booking.customerEmail) {
      await sendAndLogEmail(
        booking.bookingId,
        'email_booking_cancelled_by_business',
        booking.customerEmail,
        emailTemplates.bookingCancelledByBusinessEmail({
          customerName: booking.customerName,
          businessName: booking.businessName,
          reason: reason || booking.cancellationReason,
          contactPhone: booking.managerPhone || booking.outletPhone || 'us',
        })
      );
    }
    if (booking.customerPhone) {
      await sendAndLogWhatsApp(
        booking.bookingId,
        'whatsapp_booking_cancelled_by_business',
        booking.customerPhone,
        whatsappTemplates.bookingCancelledAlert({
          customerName: booking.customerName,
          businessName: booking.businessName,
        })
      );
    }
  } else if (source === 'customer') {
    if (booking.managerEmail) {
      await sendAndLogEmail(
        booking.bookingId,
        'email_booking_cancelled_by_customer_manager',
        booking.managerEmail,
        emailTemplates.bookingCancelledByCustomerEmail({
          businessName: booking.businessName,
          outletName: booking.outletName,
          customerName: booking.customerName,
          bookingDate: booking.bookingDate,
          timeSlot: booking.timeSlot,
          confirmationCode: booking.confirmationCode,
        })
      );
    }
    if (booking.managerPhone) {
      await sendAndLogWhatsApp(
        booking.bookingId,
        'whatsapp_booking_cancelled_by_customer_manager',
        booking.managerPhone,
        `❌ *Cancellation Alert*\n\nBooking for ${booking.customerName} on ${booking.bookingDate} at ${booking.timeSlot} has been cancelled by the customer.`
      );
    }
  }
}

/**
 * 6. & 7. Send Reminder
 */
async function sendReminder(booking, type = '24h') {
  if (booking.customerPhone) {
    await sendAndLogWhatsApp(
      booking.bookingId,
      `whatsapp_reminder_${type}`,
      booking.customerPhone,
      whatsappTemplates.bookingReminderWhatsApp({
        customerName: booking.customerName,
        businessName: booking.businessName,
        outletName: booking.outletName,
        bookingDate: booking.bookingDate,
        timeSlot: booking.timeSlot,
        confirmationCode: booking.confirmationCode,
      })
    );
  }
}

/**
 * 8. Waitlist Spot Available
 */
async function notifyWaitlistSpot(booking) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const confirmLink = `${baseUrl}/booking/${booking.confirmationCode}`;
  
  if (booking.customerPhone) {
    await sendAndLogWhatsApp(
      booking.bookingId,
      'whatsapp_waitlist_spot_available',
      booking.customerPhone,
      whatsappTemplates.waitlistSpotAvailable({
        customerName: booking.customerName,
        businessName: booking.businessName,
        bookingDate: booking.bookingDate,
        timeSlot: booking.timeSlot,
        confirmLink,
      })
    );
  }
}

/**
 * 9. Trial Expiring (Platform)
 */
async function notifyTrialExpiring(business, daysLeft) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  if (business.ownerEmail) {
    await sendAndLogEmail(
      null, // no booking ID for platform alert
      `email_trial_expiring_${daysLeft}d`,
      business.ownerEmail,
      emailTemplates.trialExpiringEmail({
        daysLeft,
        businessName: business.name,
        loginUrl: `${baseUrl}/login`,
      })
    );
  }
}

/**
 * 10. Payment Failed
 */
async function notifyPaymentFailed(business, adminEmail) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // To Business Owner
  if (business.ownerEmail) {
    await sendAndLogEmail(
      null,
      'email_payment_failed_business',
      business.ownerEmail,
      emailTemplates.paymentFailedEmail({
        businessName: business.name,
        loginUrl: `${baseUrl}/dashboard/settings`, // Example link
      })
    );
  }

  // To Admin
  if (adminEmail) {
    await sendAndLogEmail(
      null,
      'email_payment_failed_admin',
      adminEmail,
      {
        subject: `⚠️ Payment Failed Alert - ${business.name}`,
        html: `<p>Payment failed for business <strong>${business.name}</strong>.</p>`
      }
    );
  }
}

module.exports = {
  notifyNewBooking,
  notifyConfirmed,
  notifyCancelled,
  sendReminder,
  notifyWaitlistSpot,
  notifyTrialExpiring,
  notifyPaymentFailed,
};
