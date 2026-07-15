/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('platform_settings', (table) => {
    table.increments('id').primary();
    table.string('platform_name').defaultTo('TableFlow');
    table.string('support_email').defaultTo('support@tableflow.in');
    table.string('whatsapp_number').nullable();
    table.integer('trial_duration_days').defaultTo(14);
    table.decimal('price_starter', 10, 2).defaultTo(999.00);
    table.decimal('price_growth', 10, 2).defaultTo(1999.00);
    table.decimal('price_franchise', 10, 2).defaultTo(4999.00);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  }).then(() => {
    // Insert single default row
    return knex('platform_settings').insert({});
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('platform_settings');
};
