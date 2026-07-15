/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.integer('admin_id').unsigned().nullable()
      .references('id').inTable('platform_admins').onDelete('SET NULL');
    table.string('action').notNullable();
    table.integer('target_business_id').unsigned().nullable()
      .references('id').inTable('businesses').onDelete('SET NULL');
    table.json('metadata').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('audit_logs');
};
