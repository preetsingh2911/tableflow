/**
 * WhatsApp Service — Twilio WhatsApp Business API integration
 */

let twilioClient = null;

function getClient() {
  if (twilioClient) return twilioClient;

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('⚠️  WhatsApp service not configured (TWILIO credentials missing). Messages will be logged only.');
    return null;
  }

  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return twilioClient;
}

/**
 * Send a WhatsApp message. Gracefully logs if Twilio is not configured.
 */
async function sendWhatsAppMessage({ to, body }) {
  const client = getClient();

  // Ensure Indian phone format with country code
  const formattedPhone = to.startsWith('+') ? to : `+91${to.replace(/^0/, '')}`;

  if (!client) {
    console.log(`📱 [WHATSAPP STUB] To: ${formattedPhone} | Message: ${body}`);
    return { stubbed: true };
  }

  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
      to: `whatsapp:${formattedPhone}`,
    });

    console.log(`📱 WhatsApp sent to ${formattedPhone}: ${message.sid}`);
    return message;
  } catch (err) {
    console.error(`📱 WhatsApp failed to ${formattedPhone}:`, err.message);
    // Don't throw — WhatsApp failure should not break the flow
    return { error: err.message };
  }
}

// --- Message Templates ---

function bookingConfirmationWhatsApp({ customerName, businessName, outletName, bookingDate, timeSlot, guestCount, confirmationCode, cancelLink }) {
  return `🍽️ *Booking Confirmed!*

Hi ${customerName}, your table at *${businessName}* is booked!

📅 ${bookingDate} at ${timeSlot}
👥 ${guestCount} guests at ${outletName}
Ref: ${confirmationCode}

To cancel: ${cancelLink}`;
}

function bookingReminderWhatsApp({ customerName, businessName, outletName, bookingDate, timeSlot, confirmationCode }) {
  return `⏰ *Booking Reminder*

Hi ${customerName}, this is a reminder for your reservation tomorrow!

📍 *${businessName}* — ${outletName}
📅 ${bookingDate}
🕐 ${timeSlot}

🔑 Code: *${confirmationCode}*

We look forward to seeing you! 😊`;
}

function newBookingAlertManager({ outletName, customerName, customerPhone, bookingDate, timeSlot, guestCount, occasion, confirmationCode, specialRequests }) {
  return `🚨 *New booking at ${outletName}*

Name: ${customerName}
Mobile: ${customerPhone}
Date: ${bookingDate}
Time: ${timeSlot}
Guests: ${guestCount}
Occasion: ${occasion}
Ref: ${confirmationCode}
Special: ${specialRequests || 'None'}`;
}

function bookingCancelledAlert({ customerName, businessName }) {
  return `❌ *Booking Cancelled*

Hi ${customerName}, your booking at ${businessName} has been cancelled.`;
}

function waitlistSpotAvailable({ customerName, businessName, bookingDate, timeSlot, confirmLink }) {
  return `🎉 *A table just opened up!*

Hi ${customerName}, a spot is now available at ${businessName} for your waitlist request.
📅 ${bookingDate} at ${timeSlot}

Confirm within 2hrs to secure your table:
${confirmLink}`;
}

module.exports = {
  sendWhatsAppMessage,
  bookingConfirmationWhatsApp,
  bookingReminderWhatsApp,
  newBookingAlertManager,
  bookingCancelledAlert,
  waitlistSpotAvailable,
};
