/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('notifications_log', (table) => {
    table.increments('id').primary();
    table.integer('booking_id').unsigned().nullable()
      .references('id').inTable('bookings').onDelete('CASCADE');
    table.string('type').notNullable(); // e.g. 'whatsapp_confirmation'
    table.string('recipient').notNullable();
    table.enum('status', ['sent', 'failed']).notNullable();
    table.text('error_message').nullable();
    table.timestamp('sent_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('notifications_log');
};
