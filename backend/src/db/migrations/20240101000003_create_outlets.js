/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('outlets', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('address').notNullable();
    table.string('city').notNullable();
    table.string('phone').nullable();
    table.string('manager_name').nullable();
    table.string('manager_phone').nullable();
    table.string('manager_email').nullable();
    
    table.integer('total_tables').defaultTo(10);
    table.integer('max_guests_per_booking').defaultTo(20);
    table.boolean('is_active').defaultTo(true);
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('outlets');
};
