/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('bookings', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.integer('outlet_id').unsigned().notNullable()
      .references('id').inTable('outlets').onDelete('CASCADE');
    table.integer('customer_id').unsigned().nullable()
      .references('id').inTable('customers').onDelete('CASCADE');
      
    table.string('customer_name').notNullable();
    table.string('customer_phone').notNullable();
    table.string('customer_email').nullable();
    
    table.date('date').notNullable();
    table.integer('time_slot_id').unsigned().notNullable()
      .references('id').inTable('time_slots').onDelete('CASCADE');
    table.integer('guests').notNullable();
    
    table.enum('occasion', ['none', 'birthday', 'anniversary', 'business', 'date', 'other']).defaultTo('none');
    table.text('special_requests').nullable();
    
    table.enum('status', ['pending', 'confirmed', 'cancelled', 'seated', 'no_show']).defaultTo('pending');
    table.string('booking_ref').notNullable().unique();
    
    table.text('cancellation_reason').nullable();
    
    table.boolean('reminder_24h_sent').defaultTo(false);
    table.boolean('reminder_2h_sent').defaultTo(false);
    
    table.boolean('deposit_required').defaultTo(false);
    table.decimal('deposit_amount', 10, 2).nullable();
    table.boolean('deposit_paid').defaultTo(false);
    
    table.string('razorpay_payment_id').nullable();
    
    table.timestamps(true, true);
    
    // Indexes
    table.index(['outlet_id', 'date']);
    table.index(['business_id', 'status']);
    table.index(['booking_ref']);
  }).then(() => {
    // Add check constraint for guests count (MySQL 8.0.16+)
    return knex.raw(`
      ALTER TABLE bookings 
      ADD CONSTRAINT chk_bookings_guests 
      CHECK (guests >= 1 AND guests <= 50)
    `);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('bookings');
};
