const bcrypt = require('bcryptjs');
const { 
  sequelize, 
  User, 
  Product, 
  ProductVariant, 
  RentalPeriod, 
  Order, 
  OrderItem, 
  Invoice,
  RentalPickup,
  RentalReturn,
  SecurityDeposit
} = require('../src/models');

async function seedDatabase() {
  console.log('🌱 Starting Dummy Data Seeding Script...');

  try {
    // 1. Sync DB tables
    await sequelize.sync();
    console.log('✅ Database schema synchronized.');

    // 2. Hash default passwords
    const passwordHash = bcrypt.hashSync('Password@123', 10);

    // 3. Seed Users
    console.log('👤 Seeding Users (Admins, Vendors, Customers)...');
    
    const [admin] = await User.findOrCreate({
      where: { email: 'admin@odoorentals.com' },
      defaults: {
        name: 'Super Admin',
        email: 'admin@odoorentals.com',
        password: passwordHash,
        role: 'ADMIN',
      },
    });

    const [vendor1] = await User.findOrCreate({
      where: { email: 'techvendor@odoorentals.com' },
      defaults: {
        name: 'Apex Tech Rentals',
        email: 'techvendor@odoorentals.com',
        password: passwordHash,
        role: 'VENDOR',
      },
    });

    const [vendor2] = await User.findOrCreate({
      where: { email: 'gearhub@odoorentals.com' },
      defaults: {
        name: 'Pro Cinema & Gear Hub',
        email: 'gearhub@odoorentals.com',
        password: passwordHash,
        role: 'VENDOR',
      },
    });

    const [customer1] = await User.findOrCreate({
      where: { email: 'alice@example.com' },
      defaults: {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: passwordHash,
        role: 'CUSTOMER',
      },
    });

    const [customer2] = await User.findOrCreate({
      where: { email: 'bob@example.com' },
      defaults: {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: passwordHash,
        role: 'CUSTOMER',
      },
    });

    console.log('✅ Users seeded successfully.');

    // 4. Seed Rental Periods
    console.log('⏱️ Seeding Rental Periods...');
    const rentalPeriodsData = [
      { name: '4-Hour Express', duration: 4, unit: 'HOUR', discount_percent: 5 },
      { name: 'Daily Standard', duration: 1, unit: 'DAY', discount_percent: 0 },
      { name: 'Weekly Special', duration: 7, unit: 'DAY', discount_percent: 15 },
      { name: 'Monthly Flex', duration: 30, unit: 'DAY', discount_percent: 30 },
    ];

    const rentalPeriods = [];
    for (const periodData of rentalPeriodsData) {
      const [period] = await RentalPeriod.findOrCreate({
        where: { name: periodData.name },
        defaults: periodData,
      });
      rentalPeriods.push(period);
    }
    console.log('✅ Rental Periods seeded.');

    // 5. Seed Products
    console.log('📦 Seeding Products...');
    const productsData = [
      {
        name: 'MacBook Pro 16" M3 Max (64GB RAM, 1TB SSD)',
        description: 'Ultimate workstation laptop for 8K video editing, 3D rendering, and software development.',
        category: 'Computers',
        base_price: 2500,
        status: 'ACTIVE',
        product_type: 'Goods',
        quantity_on_hand: 15,
        cost_price: 2000,
        is_published: true,
        periodicity: 'Day',
        pickup_time: '10:00 H',
        return_time: '19:00 H',
        late_fees: 300,
        security_deposit: 1000,
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        vendor_id: vendor1.id,
      },
      {
        name: 'Sony FX3 Full-Frame Cinema Camera',
        description: 'Compact cinema camera with 4K 120fps recording, active cooling, and dual XLR audio handle.',
        category: 'Cameras',
        base_price: 3500,
        status: 'ACTIVE',
        product_type: 'Goods',
        quantity_on_hand: 8,
        cost_price: 3000,
        is_published: true,
        periodicity: 'Day',
        pickup_time: '09:00 H',
        return_time: '18:00 H',
        late_fees: 500,
        security_deposit: 1500,
        image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
        vendor_id: vendor2.id,
      },
      {
        name: 'DJI Inspire 3 8K Cinema Drone Bundle',
        description: 'Full-frame 8K ProRes RAW drone with Waypoint Pro & 360-degree pan tracking.',
        category: 'Drones',
        base_price: 5500,
        status: 'ACTIVE',
        product_type: 'Goods',
        quantity_on_hand: 4,
        cost_price: 4500,
        is_published: true,
        periodicity: 'Day',
        pickup_time: '09:00 H',
        return_time: '18:00 H',
        late_fees: 800,
        security_deposit: 2500,
        image_url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
        vendor_id: vendor2.id,
      },
      {
        name: 'Sennheiser EW-DX Wireless Mic Dual Kit',
        description: 'Professional digital wireless lavalier kit with ultra-low latency & OLED receivers.',
        category: 'Audio',
        base_price: 1200,
        status: 'ACTIVE',
        product_type: 'Goods',
        quantity_on_hand: 20,
        cost_price: 900,
        is_published: true,
        periodicity: 'Day',
        pickup_time: '10:00 H',
        return_time: '19:00 H',
        late_fees: 200,
        security_deposit: 500,
        image_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
        vendor_id: vendor1.id,
      },
      {
        name: 'Herman Miller Aeron Ergonomic Task Chair',
        description: 'Fully adjustable mesh ergonomic office chair with PostureFit SL support.',
        category: 'Furniture',
        base_price: 750,
        status: 'ACTIVE',
        product_type: 'Goods',
        quantity_on_hand: 30,
        cost_price: 500,
        is_published: true,
        periodicity: 'Day',
        pickup_time: '09:00 H',
        return_time: '17:00 H',
        late_fees: 150,
        security_deposit: 300,
        image_url: 'https://images.unsplash.com/photo-1580481072645-022f9a6d1279?auto=format&fit=crop&w=800&q=80',
        vendor_id: vendor1.id,
      },
      {
        name: 'Aputure LS 600d Pro Daylight LED Light',
        description: 'Weather-resistant 600W COB LED light equivalent to 1200W HMI with wireless DMX control.',
        category: 'Event Gear',
        base_price: 2200,
        status: 'ACTIVE',
        product_type: 'Goods',
        quantity_on_hand: 10,
        cost_price: 1800,
        is_published: true,
        periodicity: 'Day',
        pickup_time: '10:00 H',
        return_time: '19:00 H',
        late_fees: 350,
        security_deposit: 800,
        image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
        vendor_id: vendor2.id,
      },
    ];

    const seededProducts = [];
    for (const pData of productsData) {
      const [prod] = await Product.findOrCreate({
        where: { name: pData.name },
        defaults: pData,
      });
      seededProducts.push(prod);
    }
    console.log(`✅ Seeded ${seededProducts.length} products.`);

    // 6. Seed Product Variants
    console.log('🔀 Seeding Product Variants...');
    const macbook = seededProducts.find(p => p.name.includes('MacBook Pro'));
    if (macbook) {
      await ProductVariant.findOrCreate({
        where: { product_id: macbook.id, color: 'Space Black' },
        defaults: {
          product_id: macbook.id,
          brand: 'Apple',
          manufacturer: 'Apple Inc.',
          color: 'Space Black',
          size: '16-inch',
          status: 'ACTIVE',
        },
      });
    }

    // 7. Seed Sample Orders
    console.log('📄 Seeding Sample Rental Orders...');
    
    // Order 1: Confirmed Active Order for Alice
    const [order1] = await Order.findOrCreate({
      where: { order_number: 'ORD-2026-001' },
      defaults: {
        order_number: 'ORD-2026-001',
        customer_id: customer1.id,
        status: 'CONFIRMED',
        start_date: '2026-08-10',
        end_date: '2026-08-15',
        subtotal: 12500,
        delivery_method: 'STORE_PICKUP',
        delivery_address: '100 Technology Parkway, San Francisco, CA',
      },
    });

    if (order1 && macbook) {
      await OrderItem.findOrCreate({
        where: { order_id: order1.id, product_id: macbook.id },
        defaults: {
          order_id: order1.id,
          product_id: macbook.id,
          rental_period_id: rentalPeriods[1]?.id,
          product_name: macbook.name,
          start_date: '2026-08-10',
          end_date: '2026-08-15',
          unit_price: 2500,
          quantity: 1,
          total_price: 12500,
        },
      });

      await RentalPickup.findOrCreate({
        where: { order_id: order1.id },
        defaults: {
          order_id: order1.id,
          customer_id: customer1.id,
          pickup_type: 'STORE_PICKUP',
          scheduled_at: new Date('2026-08-10T10:00:00Z'),
          pickup_code: 'PKP-1001',
          status: 'COMPLETED',
          confirmed_at: new Date('2026-08-10T10:05:00Z'),
        },
      });

      await Invoice.findOrCreate({
        where: { invoice_number: 'INV-2026-001' },
        defaults: {
          invoice_number: 'INV-2026-001',
          order_id: order1.id,
          customer_id: customer1.id,
          amount: 12500,
          status: 'POSTED',
          payment_status: 'PAID',
        },
      });
    }

    // Order 2: Draft Quotation for Bob
    const camera = seededProducts.find(p => p.name.includes('Sony FX3'));
    const [order2] = await Order.findOrCreate({
      where: { order_number: 'ORD-2026-002' },
      defaults: {
        order_number: 'ORD-2026-002',
        customer_id: customer2.id,
        status: 'SENT',
        start_date: '2026-08-18',
        end_date: '2026-08-20',
        subtotal: 7000,
        delivery_method: 'DELIVERY',
        delivery_address: '456 Market St, San Francisco, CA',
      },
    });

    if (order2 && camera) {
      await OrderItem.findOrCreate({
        where: { order_id: order2.id, product_id: camera.id },
        defaults: {
          order_id: order2.id,
          product_id: camera.id,
          rental_period_id: rentalPeriods[1]?.id,
          product_name: camera.name,
          start_date: '2026-08-18',
          end_date: '2026-08-20',
          unit_price: 3500,
          quantity: 1,
          total_price: 7000,
        },
      });
    }

    console.log('✅ Sample Orders & Invoices seeded.');

    console.log('\n🎉 ALL DUMMY DATA SEEDED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
    console.log('🔑 Default Accounts Created:');
    console.log('  - Super Admin: admin@odoorentals.com / Password@123');
    console.log('  - Vendor 1:    techvendor@odoorentals.com / Password@123');
    console.log('  - Vendor 2:    gearhub@odoorentals.com / Password@123');
    console.log('  - Customer 1:  alice@example.com / Password@123');
    console.log('  - Customer 2:  bob@example.com / Password@123');
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
}

seedDatabase();
