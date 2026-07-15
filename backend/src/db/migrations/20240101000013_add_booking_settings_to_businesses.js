/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('businesses', (table) => {
    table.string('instagram_url').nullable();
    table.string('google_maps_url').nullable();
    table.text('confirmation_message').nullable();
    table.boolean('require_deposit').defaultTo(false);
    table.decimal('deposit_amount', 10, 2).nullable();
    table.boolean('allow_waitlist').defaultTo(false);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('businesses', (table) => {
    table.dropColumn('instagram_url');
    table.dropColumn('google_maps_url');
    table.dropColumn('confirmation_message');
    table.dropColumn('require_deposit');
    table.dropColumn('deposit_amount');
    table.dropColumn('allow_waitlist');
  });
};
