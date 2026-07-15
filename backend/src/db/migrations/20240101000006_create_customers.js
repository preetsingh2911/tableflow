/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('customers', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').nullable().unique();
    table.string('phone').notNullable().unique();
    table.string('password_hash').nullable();
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['phone']);
    table.index(['email']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('customers');
};
