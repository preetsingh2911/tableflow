/**
 * Email Service — Nodemailer integration with HTML templates
 */
const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize the email transporter (lazy, singleton)
 */
function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('⚠️  Email service not configured (SMTP_HOST/SMTP_USER missing). Emails will be logged only.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Send an email. Gracefully logs if SMTP is not configured.
 */
async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter();

  if (!transport) {
    console.log(`📧 [EMAIL STUB] To: ${to} | Subject: ${subject}`);
    return { stubbed: true };
  }

  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || '"TableFlow" <noreply@tableflow.in>',
    to,
    subject,
    html,
    text: text || subject,
  });

  console.log(`📧 Email sent to ${to}: ${info.messageId}`);
  return info;
}

// --- Email Templates ---

function bookingConfirmationEmail({ customerName, businessName, outletName, bookingDate, timeSlot, guestCount, confirmationCode }) {
  return {
    subject: `Booking Confirmed — ${businessName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
        <div style="background: linear-gradient(135deg, #6366F1, #8B5CF6); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🍽️ Booking Confirmed!</h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <p style="font-size: 16px; color: #374151;">Hi <strong>${customerName}</strong>,</p>
          <p style="font-size: 16px; color: #374151;">Your table at <strong>${businessName}</strong> has been confirmed!</p>
          
          <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6B7280;">📍 Outlet</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${outletName}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">📅 Date</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${bookingDate}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">🕐 Time</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${timeSlot}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">👥 Guests</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${guestCount}</td></tr>
            </table>
          </div>

          <div style="background: #EEF2FF; border: 2px dashed #6366F1; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
            <p style="color: #6B7280; margin: 0 0 8px;">Confirmation Code</p>
            <p style="font-size: 28px; font-weight: 700; color: #6366F1; margin: 0; letter-spacing: 3px;">${confirmationCode}</p>
          </div>

          <p style="font-size: 14px; color: #9CA3AF; text-align: center;">Show this code at the restaurant. Need to cancel? Reply to this email.</p>
        </div>
        <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 16px;">Powered by TableFlow</p>
      </div>
    `,
  };
}

function welcomeEmail({ fullName, businessName, loginUrl }) {
  return {
    subject: `Welcome to TableFlow, ${fullName}!`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
        <div style="background: linear-gradient(135deg, #6366F1, #8B5CF6); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Welcome to TableFlow!</h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <p style="font-size: 16px; color: #374151;">Hi <strong>${fullName}</strong>,</p>
          <p style="font-size: 16px; color: #374151;">Your business <strong>${businessName}</strong> is now set up on TableFlow. Here's what to do next:</p>
          <ol style="color: #374151; line-height: 2;">
            <li>Set up your first outlet (location)</li>
            <li>Configure time slots for bookings</li>
            <li>Share your booking page with customers</li>
          </ol>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${loginUrl}" style="background: #6366F1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Go to Dashboard →</a>
          </div>
          <p style="font-size: 14px; color: #9CA3AF; text-align: center;">Need help? Reply to this email.</p>
        </div>
        <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 16px;">Powered by TableFlow — by Shyara Tech Solution</p>
      </div>
    `,
  };
}

function passwordResetEmail({ fullName, resetUrl }) {
  return {
    subject: 'Reset Your TableFlow Password',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
        <div style="background: linear-gradient(135deg, #6366F1, #8B5CF6); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Password Reset</h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <p style="font-size: 16px; color: #374151;">Hi <strong>${fullName}</strong>,</p>
          <p style="font-size: 16px; color: #374151;">We received a request to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #6366F1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #9CA3AF;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  };
}

function newBookingAlertEmail({ businessName, outletName, customerName, bookingDate, timeSlot, guestCount, confirmationCode }) {
  return {
    subject: `📋 New Booking — ${customerName} at ${outletName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 4px solid #6366F1;">
          <h2 style="color: #1F2937; margin: 0 0 16px;">New Booking Received</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6B7280;">Customer</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${customerName}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7280;">Outlet</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${outletName}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7280;">Date</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${bookingDate}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7280;">Time</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${timeSlot}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7280;">Guests</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${guestCount}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7280;">Code</td><td style="padding: 8px 0; font-weight: 600; text-align: right; color: #6366F1;">${confirmationCode}</td></tr>
          </table>
        </div>
      </div>
    `,
  };
}

function bookingConfirmedByBusinessEmail({ customerName, businessName, outletName, bookingDate, timeSlot, guestCount, confirmationCode }) {
  return {
    subject: `Your booking at ${businessName} is confirmed!`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">✅ Booking Confirmed</h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <p style="font-size: 16px; color: #374151;">Hi <strong>${customerName}</strong>,</p>
          <p style="font-size: 16px; color: #374151;">Great news! <strong>${businessName}</strong> has confirmed your reservation.</p>
          
          <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6B7280;">📍 Outlet</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${outletName}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">📅 Date</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${bookingDate}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">🕐 Time</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${timeSlot}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">👥 Guests</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${guestCount}</td></tr>
            </table>
          </div>
          
          <div style="background: #ECFDF5; border: 2px dashed #10B981; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
            <p style="color: #6B7280; margin: 0 0 8px;">Confirmation Code</p>
            <p style="font-size: 28px; font-weight: 700; color: #10B981; margin: 0; letter-spacing: 3px;">${confirmationCode}</p>
          </div>
        </div>
        <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 16px;">Powered by TableFlow</p>
      </div>
    `,
  };
}

function bookingCancelledByBusinessEmail({ customerName, businessName, reason, contactPhone }) {
  return {
    subject: `Booking Cancellation Update from ${businessName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
        <div style="background: linear-gradient(135deg, #EF4444, #B91C1C); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">❌ Booking Cancelled</h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <p style="font-size: 16px; color: #374151;">Hi <strong>${customerName}</strong>,</p>
          <p style="font-size: 16px; color: #374151;">Unfortunately, your booking at <strong>${businessName}</strong> has been cancelled.</p>
          ${reason ? `<div style="background: #FEF2F2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #EF4444;"><p style="margin: 0; color: #991B1B;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
          <p style="font-size: 16px; color: #374151;">If you have any questions, please contact the restaurant at ${contactPhone}.</p>
        </div>
        <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 16px;">Powered by TableFlow</p>
      </div>
    `,
  };
}

function bookingCancelledByCustomerEmail({ businessName, outletName, customerName, bookingDate, timeSlot, confirmationCode }) {
  return {
    subject: `🚨 Booking Cancelled by Customer — ${customerName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 4px solid #EF4444;">
          <h2 style="color: #1F2937; margin: 0 0 16px;">Booking Cancelled by Customer</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6B7280;">Customer</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${customerName}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7280;">Outlet</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${outletName}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7280;">Date</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${bookingDate}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7280;">Time</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${timeSlot}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7280;">Code</td><td style="padding: 8px 0; font-weight: 600; text-align: right; color: #EF4444;">${confirmationCode}</td></tr>
          </table>
          <p style="color: #6B7280; font-size: 14px; margin-top: 16px;">This spot is now available for other bookings.</p>
        </div>
      </div>
    `,
  };
}

function trialExpiringEmail({ daysLeft, businessName, loginUrl }) {
  return {
    subject: `Action Required: Your TableFlow trial expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
        <div style="background: linear-gradient(135deg, #F59E0B, #D97706); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⏳ Trial Expiring Soon</h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <p style="font-size: 16px; color: #374151;">Hi there,</p>
          <p style="font-size: 16px; color: #374151;">Your free trial for <strong>${businessName}</strong> expires in exactly <strong>${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}</strong>.</p>
          <p style="font-size: 16px; color: #374151;">To keep your booking page active and continue accepting reservations smoothly, please upgrade to a paid plan.</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${loginUrl}" style="background: #F59E0B; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Upgrade Now</a>
          </div>
        </div>
        <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 16px;">TableFlow — by Shyara Tech Solution</p>
      </div>
    `,
  };
}

function paymentFailedEmail({ businessName, loginUrl }) {
  return {
    subject: `Payment Failed for ${businessName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
        <div style="background: linear-gradient(135deg, #EF4444, #B91C1C); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">💳 Payment Failed</h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <p style="font-size: 16px; color: #374151;">Hi there,</p>
          <p style="font-size: 16px; color: #374151;">We were unable to process the subscription payment for <strong>${businessName}</strong>.</p>
          <p style="font-size: 16px; color: #374151;">Please update your payment method to avoid any interruption in your service.</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${loginUrl}" style="background: #EF4444; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Update Payment Method</a>
          </div>
        </div>
        <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 16px;">TableFlow — by Shyara Tech Solution</p>
      </div>
    `,
  };
}

function platformWelcomeEmail({ businessName }) {
  return {
    subject: `New Business Signup: ${businessName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 4px solid #10B981;">
          <h2 style="color: #1F2937; margin: 0 0 16px;">🚀 New Business Signed Up!</h2>
          <p style="color: #374151; font-size: 16px;"><strong>${businessName}</strong> just registered on TableFlow and started their 14-day trial.</p>
        </div>
      </div>
    `,
  };
}

module.exports = {
  sendEmail,
  bookingConfirmationEmail,
  welcomeEmail,
  passwordResetEmail,
  newBookingAlertEmail,
  bookingConfirmedByBusinessEmail,
  bookingCancelledByBusinessEmail,
  bookingCancelledByCustomerEmail,
  trialExpiringEmail,
  paymentFailedEmail,
  platformWelcomeEmail,
};
