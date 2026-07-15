/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('blocked_dates', (table) => {
    table.increments('id').primary();
    table.integer('outlet_id').unsigned().notNullable()
      .references('id').inTable('outlets').onDelete('CASCADE');
    table.date('date').notNullable();
    table.string('reason').nullable();
    
    table.index(['outlet_id', 'date']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('blocked_dates');
};
