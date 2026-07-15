const cron = require('node-cron');
const db = require('../db/connection');
const { sendReminder, notifyTrialExpiring } = require('./notifications');

/**
 * 24-hour Reminder Cron
 * Runs every hour at the top of the hour.
 * Checks for bookings that are 23-25 hours away.
 */
function start24HourCron() {
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running 24-hour reminder check...');
    try {
      const now = new Date();
      const lowerBound = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23 hrs from now
      const upperBound = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hrs from now

      // We need to match booking_date and time_slot start_time
      const bookings = await db('bookings')
        .join('outlets', 'bookings.outlet_id', 'outlets.id')
        .join('businesses', 'outlets.business_id', 'businesses.id')
        .join('time_slots', 'bookings.time_slot_id', 'time_slots.id')
        .leftJoin('notifications_log', function() {
          this.on('bookings.id', '=', 'notifications_log.booking_id')
              .andOn('notifications_log.type', '=', db.raw('?', ['whatsapp_reminder_24h']))
              .andOn('notifications_log.status', '=', db.raw('?', ['sent']));
        })
        .where('bookings.status', 'confirmed')
        .whereNull('notifications_log.id') // Ensure we haven't sent it yet
        .select(
          'bookings.id as bookingId',
          'bookings.customer_name as customerName',
          'bookings.customer_phone as customerPhone',
          'bookings.booking_date as bookingDate',
          'bookings.confirmation_code as confirmationCode',
          'outlets.name as outletName',
          'businesses.name as businessName',
          'time_slots.start_time as startTime'
        );

      let sentCount = 0;
      for (const b of bookings) {
        // Construct exact Date object for the booking
        const bookingDateTime = new Date(`${b.bookingDate}T${b.startTime}`);
        if (bookingDateTime >= lowerBound && bookingDateTime <= upperBound) {
          await sendReminder({ ...b, timeSlot: b.startTime.slice(0, 5) }, '24h');
          sentCount++;
        }
      }
      if (sentCount > 0) console.log(`⏰ Sent ${sentCount} 24-hour reminders.`);
    } catch (err) {
      console.error('Error in 24-hour cron:', err);
    }
  });
}

/**
 * 2-hour Reminder Cron
 * Runs every 15 minutes.
 * Checks for bookings that are 1.5 - 2.5 hours away.
 */
function start2HourCron() {
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ Running 2-hour reminder check...');
    try {
      const now = new Date();
      const lowerBound = new Date(now.getTime() + 1.5 * 60 * 60 * 1000); // 1.5 hrs from now
      const upperBound = new Date(now.getTime() + 2.5 * 60 * 60 * 1000); // 2.5 hrs from now

      const bookings = await db('bookings')
        .join('outlets', 'bookings.outlet_id', 'outlets.id')
        .join('businesses', 'outlets.business_id', 'businesses.id')
        .join('time_slots', 'bookings.time_slot_id', 'time_slots.id')
        .leftJoin('notifications_log', function() {
          this.on('bookings.id', '=', 'notifications_log.booking_id')
              .andOn('notifications_log.type', '=', db.raw('?', ['whatsapp_reminder_2h']))
              .andOn('notifications_log.status', '=', db.raw('?', ['sent']));
        })
        .where('bookings.status', 'confirmed')
        .whereNull('notifications_log.id')
        .select(
          'bookings.id as bookingId',
          'bookings.customer_name as customerName',
          'bookings.customer_phone as customerPhone',
          'bookings.booking_date as bookingDate',
          'bookings.confirmation_code as confirmationCode',
          'outlets.name as outletName',
          'businesses.name as businessName',
          'time_slots.start_time as startTime'
        );

      let sentCount = 0;
      for (const b of bookings) {
        const bookingDateTime = new Date(`${b.bookingDate}T${b.startTime}`);
        if (bookingDateTime >= lowerBound && bookingDateTime <= upperBound) {
          await sendReminder({ ...b, timeSlot: b.startTime.slice(0, 5) }, '2h');
          sentCount++;
        }
      }
      if (sentCount > 0) console.log(`⏰ Sent ${sentCount} 2-hour reminders.`);
    } catch (err) {
      console.error('Error in 2-hour cron:', err);
    }
  });
}

/**
 * Trial Expiry Cron
 * Runs daily at 9:00 AM.
 * Checks for trials expiring in exactly 3 days and exactly 1 day.
 */
function startTrialExpiryCron() {
  cron.schedule('0 9 * * *', async () => {
    console.log('⏳ Running trial expiry check...');
    try {
      const businesses = await db('businesses')
        .join('users', 'businesses.owner_id', 'users.id')
        .where('businesses.subscription_status', 'trial')
        .whereNotNull('businesses.trial_ends_at')
        .select(
          'businesses.id',
          'businesses.name',
          'businesses.trial_ends_at',
          'users.email as ownerEmail'
        );

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      let sentCount = 0;
      for (const biz of businesses) {
        const trialEnd = new Date(biz.trial_ends_at);
        trialEnd.setHours(0, 0, 0, 0);

        const diffTime = trialEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 3 || diffDays === 1) {
          // Check if we already sent this specific notification
          const sent = await db('notifications_log')
            .where({
              recipient: biz.ownerEmail,
              type: `email_trial_expiring_${diffDays}d`,
              status: 'sent'
            })
            .first();

          if (!sent) {
            await notifyTrialExpiring(biz, diffDays);
            sentCount++;
          }
        }
      }
      if (sentCount > 0) console.log(`⏳ Sent ${sentCount} trial expiry notices.`);
    } catch (err) {
      console.error('Error in trial expiry cron:', err);
    }
  });
}

function startReminderCrons() {
  start24HourCron();
  start2HourCron();
  startTrialExpiryCron();
  console.log('🚀 Cron jobs initialized.');
}

module.exports = { startReminderCrons };
