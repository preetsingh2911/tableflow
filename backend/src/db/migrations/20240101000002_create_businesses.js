/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('businesses', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('slug', 30).notNullable().unique();
    table.string('owner_name').notNullable();
    table.string('owner_email').notNullable().unique();
    table.string('owner_phone').notNullable();
    table.string('password_hash').notNullable();
    table.string('logo_url').nullable();
    table.string('cover_image_url').nullable();
    table.string('brand_colour', 7).defaultTo('#1A56DB');
    table.text('description').nullable();
    table.string('address').nullable();
    table.string('city').nullable();
    table.string('cuisine_type').nullable();
    
    table.enum('subscription_plan', ['trial', 'starter', 'growth', 'franchise']).defaultTo('trial');
    table.enum('subscription_status', ['active', 'suspended', 'cancelled', 'trial']).defaultTo('trial');
    table.datetime('trial_ends_at').nullable();
    table.string('razorpay_subscription_id').nullable();
    table.string('razorpay_customer_id').nullable();
    
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  }).then(() => {
    // Add check constraint for slug formatting (MySQL 8.0.16+)
    return knex.raw(`
      ALTER TABLE businesses 
      ADD CONSTRAINT chk_businesses_slug 
      CHECK (slug REGEXP '^[a-z0-9-]+$')
    `);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('businesses');
};
