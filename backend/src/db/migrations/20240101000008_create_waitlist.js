/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('waitlist', (table) => {
    table.increments('id').primary();
    table.integer('outlet_id').unsigned().notNullable()
      .references('id').inTable('outlets').onDelete('CASCADE');
    table.integer('time_slot_id').unsigned().notNullable()
      .references('id').inTable('time_slots').onDelete('CASCADE');
    table.date('date').notNullable();
    
    table.string('customer_name').notNullable();
    table.string('customer_phone').notNullable();
    table.string('customer_email').nullable();
    
    table.integer('guests').notNullable();
    table.integer('position').notNullable();
    
    table.enum('status', ['waiting', 'notified', 'confirmed', 'expired']).defaultTo('waiting');
    table.datetime('notified_at').nullable();
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['outlet_id', 'time_slot_id', 'date']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('waitlist');
};
