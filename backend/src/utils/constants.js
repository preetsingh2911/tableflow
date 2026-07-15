/**
 * Application-wide constants
 */

const USER_ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  BUSINESS_OWNER: 'business_owner',
  CUSTOMER: 'customer',
};

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
};

const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

const TABLE_LOCATIONS = {
  INDOOR: 'indoor',
  OUTDOOR: 'outdoor',
  TERRACE: 'terrace',
  PRIVATE: 'private',
};

const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

module.exports = {
  USER_ROLES,
  BOOKING_STATUS,
  SUBSCRIPTION_STATUS,
  TABLE_LOCATIONS,
  DAYS_OF_WEEK,
  DAY_NAMES,
};
