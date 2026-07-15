/**
 * Helper utility functions
 */
const crypto = require('crypto');

/**
 * Generate a unique confirmation code (8 chars, uppercase alphanumeric)
 */
function generateConfirmationCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Slugify a string for use in URLs/subdomains
 * e.g., "The Blue Cafe" → "the-blue-cafe"
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w-]+/g, '')    // Remove non-word chars (except -)
    .replace(/--+/g, '-')       // Collapse multiple -
    .replace(/^-+/, '')         // Trim leading -
    .replace(/-+$/, '');        // Trim trailing -
}

/**
 * Paginate a Knex query builder.
 * Returns { data, pagination }.
 */
async function paginate(queryBuilder, page = 1, limit = 20) {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (page - 1) * limit;

  // Clone the query to get count
  const countQuery = queryBuilder.clone().clearSelect().clearOrder().count('* as total').first();
  const [{ total }] = await countQuery.then(r => [r]);

  const data = await queryBuilder.limit(limit).offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

/**
 * Format a date to YYYY-MM-DD
 */
function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Check if a string is a valid Indian phone number
 */
function isValidIndianPhone(phone) {
  return /^(\+91)?[6-9]\d{9}$/.test(phone.replace(/\s|-/g, ''));
}

module.exports = {
  generateConfirmationCode,
  slugify,
  paginate,
  formatDate,
  isValidIndianPhone,
};
