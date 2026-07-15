const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Clear all related tables to avoid foreign key conflicts
  await knex('bookings').del();
  await knex('time_slots').del();
  await knex('outlets').del();
  await knex('businesses').del();
  await knex('platform_admins').del();
  await knex('customers').del();
  // Resets for AI-generated tables if they exist
  await knex('waitlist').del();
  await knex('blocked_dates').del();
  await knex('notifications_log').del();
  await knex('subscription_events').del();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create platform admin
  await knex('platform_admins').insert([
    {
      email: 'admin@tableflow.in',
      password_hash: passwordHash,
      name: 'Super Admin',
      created_at: new Date()
    }
  ]);

  // 2. Create demo business
  const [businessId] = await knex('businesses').insert([
    {
      name: 'Poppin Deli',
      slug: 'poppindeli',
      owner_name: 'John Doe',
      owner_email: 'john@poppindeli.com',
      owner_phone: '9876543210',
      password_hash: passwordHash,
      brand_colour: '#1A56DB',
      description: 'A cozy deli serving the best sandwiches in town.',
      address: '123 Main St',
      city: 'Bhopal',
      cuisine_type: 'Cafe / Deli',
      subscription_plan: 'trial',
      subscription_status: 'active',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]).returning('id'); // Note: returning() is supported in MySQL 8.0.10+ in Knex

  // Fetch the actual ID if returning() didn't work (fallback for older MySQL)
  const biz = await knex('businesses').where({ slug: 'poppindeli' }).first();
  const actualBusinessId = biz.id;

  // 3. Create outlets
  await knex('outlets').insert([
    {
      business_id: actualBusinessId,
      name: 'Poppin Deli Bhopal',
      address: 'Arera Colony',
      city: 'Bhopal',
      phone: '9876543210',
      manager_name: 'Jane Smith',
      total_tables: 10,
      max_guests_per_booking: 20,
      is_active: true,
      created_at: new Date()
    },
    {
      business_id: actualBusinessId,
      name: 'Poppin Deli Indore',
      address: 'Vijay Nagar',
      city: 'Indore',
      phone: '9876543211',
      manager_name: 'Bob Jones',
      total_tables: 15,
      max_guests_per_booking: 30,
      is_active: true,
      created_at: new Date()
    }
  ]);

  const [outlet1, outlet2] = await knex('outlets').where({ business_id: actualBusinessId }).orderBy('id', 'asc');

  // 4. Create time slots
  const slotsData = [];
  // For Bhopal outlet
  slotsData.push(
    { outlet_id: outlet1.id, label: '12:00 PM', max_covers: 40, is_active: true },
    { outlet_id: outlet1.id, label: '1:00 PM', max_covers: 40, is_active: true },
    { outlet_id: outlet1.id, label: '7:00 PM', max_covers: 40, is_active: true },
    { outlet_id: outlet1.id, label: '8:00 PM', max_covers: 40, is_active: true },
    { outlet_id: outlet1.id, label: '9:00 PM', max_covers: 40, is_active: true }
  );
  // For Indore outlet
  slotsData.push(
    { outlet_id: outlet2.id, label: '12:30 PM', max_covers: 60, is_active: true },
    { outlet_id: outlet2.id, label: '1:30 PM', max_covers: 60, is_active: true },
    { outlet_id: outlet2.id, label: '7:30 PM', max_covers: 60, is_active: true },
    { outlet_id: outlet2.id, label: '8:30 PM', max_covers: 60, is_active: true },
    { outlet_id: outlet2.id, label: '9:30 PM', max_covers: 60, is_active: true }
  );
  
  await knex('time_slots').insert(slotsData);
  const dbSlots = await knex('time_slots').orderBy('id', 'asc');

  // 5. Create demo customer
  await knex('customers').insert([
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '9988776655',
      created_at: new Date()
    }
  ]);
  const customer = await knex('customers').where({ phone: '9988776655' }).first();

  // 6. Create sample bookings
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  await knex('bookings').insert([
    {
      business_id: actualBusinessId,
      outlet_id: outlet1.id,
      customer_id: customer.id,
      customer_name: 'Alice Johnson',
      customer_phone: '9988776655',
      customer_email: 'alice@example.com',
      date: today,
      time_slot_id: dbSlots[2].id, // 7:00 PM Bhopal
      guests: 2,
      occasion: 'anniversary',
      status: 'confirmed',
      booking_ref: 'POP-20250901-0001',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      business_id: actualBusinessId,
      outlet_id: outlet1.id,
      customer_id: null,
      customer_name: 'Mike Brown',
      customer_phone: '8877665544',
      customer_email: null,
      date: tomorrow,
      time_slot_id: dbSlots[3].id, // 8:00 PM Bhopal
      guests: 4,
      occasion: 'none',
      status: 'pending',
      booking_ref: 'POP-20250901-0002',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      business_id: actualBusinessId,
      outlet_id: outlet2.id,
      customer_id: null,
      customer_name: 'Sarah Connor',
      customer_phone: '7766554433',
      customer_email: null,
      date: today,
      time_slot_id: dbSlots[7].id, // 7:30 PM Indore
      guests: 6,
      occasion: 'birthday',
      status: 'cancelled',
      cancellation_reason: 'Changed plans',
      booking_ref: 'POP-20250901-0003',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};
