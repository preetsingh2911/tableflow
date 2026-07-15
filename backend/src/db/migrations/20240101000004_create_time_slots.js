/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('time_slots', (table) => {
    table.increments('id').primary();
    table.integer('outlet_id').unsigned().notNullable()
      .references('id').inTable('outlets').onDelete('CASCADE');
    table.string('label').notNullable();
    table.integer('max_covers').notNullable();
    table.boolean('is_active').defaultTo(true);
    
    table.index(['outlet_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('time_slots');
};
