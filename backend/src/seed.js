const { sequelize } = require('./config/db');
const bcrypt = require('bcryptjs');
const User = require('./models/user.model');
const Product = require('./models/product.model');
const RentalPeriod = require('./models/rental_period.model');
const Order = require('./models/order.model');
const OrderItem = require('./models/order_item.model');
const Invoice = require('./models/invoice.model');
const Pricelist = require('./models/pricelist.model');
const QuotationTemplate = require('./models/quotation_template.model');
require('./models/index');

async function resetAndSeedDatabase() {
  console.log('🔄 Starting database reset and fresh seed process...');

  try {
    // 1. Authenticate & Ensure Schema
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection verified.');

    // Add columns if missing
    await sequelize.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS gst_number VARCHAR(20);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
      ALTER TABLE quotation_templates ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
      ALTER TABLE pricelists ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
    `).catch(() => {});

    // 2. Drop and Sync all tables cleanly
    await sequelize.sync({ force: true });
    console.log('🧹 All existing database tables truncated and recreated (clean slate).');

    // 3. Create Password Hashes
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const vendorPassword = await bcrypt.hash('vendor123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    // 4. Seed Users (Super Admin, Vendors, Customers)
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: 'admin@rental.com',
      password: hashedPassword,
      role: 'SUPERADMIN',
      phone: '+91 9876543210',
      address: 'Corporate HQ, Tech Park, Sector 5, Bengaluru, KA 560001',
      is_approved: true,
    });

    const vendor1 = await User.create({
      name: 'Apex Cinema Rentals',
      email: 'vendor@rental.com',
      password: vendorPassword,
      role: 'VENDOR',
      business_name: 'Apex Cinema & Production Gear Hub',
      phone: '+91 9988776655',
      gst_number: '22AAAAA0000A1Z5',
      address: 'Studio 12, Film City, Goregaon East, Mumbai, MH 400065',
      profile_image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80',
      is_approved: true,
    });

    const vendor2 = await User.create({
      name: 'Pro Sound & Stage Supply',
      email: 'equipment@pro.com',
      password: vendorPassword,
      role: 'VENDOR',
      business_name: 'Pro Sound & Live Lighting Solutions',
      phone: '+91 9123456789',
      gst_number: '27BBBBB1111B2Z4',
      is_approved: true,
      address: 'Unit 4, Industrial Area Phase 2, New Delhi, DL 110020',
      profile_image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500&q=80',
    });

    const customer1 = await User.create({
      name: 'Shovon Sharma',
      email: 'customer@user.com',
      password: userPassword,
      role: 'CUSTOMER',
      phone: '+91 9112233445',
      address: 'Flat 402, Sunshine Heights, Powai, Mumbai, MH 400076',
      profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80',
    });

    const customer2 = await User.create({
      name: 'Priya Verma',
      email: 'priya@gmail.com',
      password: userPassword,
      role: 'CUSTOMER',
      phone: '+91 9887766554',
      address: '78 Park Street, 3rd Floor, Kolkata, WB 700016',
      profile_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80',
    });

    console.log('👤 Seeded 5 Users (1 SuperAdmin, 2 Vendors, 2 Customers).');

    // 5. Seed Rental Periods
    const periods = await RentalPeriod.bulkCreate([
      { name: 'Hourly', duration: 1, unit: 'HOUR', discount_percent: 0, status: 'ACTIVE' },
      { name: 'Full Day', duration: 1, unit: 'DAY', discount_percent: 5, status: 'ACTIVE' },
      { name: 'Weekly Package', duration: 1, unit: 'WEEK', discount_percent: 15, status: 'ACTIVE' },
      { name: 'Monthly Lease', duration: 1, unit: 'MONTH', discount_percent: 25, status: 'ACTIVE' },
    ]);
    console.log('⏱️ Seeded 4 Rental Periods.');

    // 6. Seed Equipment Products
    const prod1 = await Product.create({
      name: 'Sony FX3 Cinema Camera Bundle',
      description: 'Full-frame cinema line camera with XLR handle top unit, 4K 120fps recording, and dual CFexpress card reader.',
      category: 'Cameras & Cinema',
      base_price: 3500,
      quantity_on_hand: 10,
      is_published: true,
      status: 'ACTIVE',
      image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
      vendor_id: vendor1.id,
      attributes: [
        { id: '1', name: 'Brand', values: 'Sony' },
        { id: '2', name: 'Resolution', values: '4K Full Frame' },
        { id: '3', name: 'Lens Mount', values: 'Sony E-Mount' },
      ],
      periodicity: 'Day',
      pickup_time: '10:00 H',
      return_time: '19:00 H',
      padding_time: '2:00 H',
      late_fees: 250,
      security_deposit: 5000,
    });

    const prod2 = await Product.create({
      name: 'RED Komodo 6K Digital Cinema Package',
      description: 'Ultra-compact 6K Super35 cinema camera with Global Shutter, RF mount, and dual Canon V-mount battery module.',
      category: 'Cameras & Cinema',
      base_price: 7500,
      quantity_on_hand: 5,
      is_published: true,
      status: 'ACTIVE',
      image_url: 'https://images.unsplash.com/photo-1589872565439-0158a74e5088?w=800&q=80',
      vendor_id: vendor1.id,
      attributes: [
        { id: '1', name: 'Brand', values: 'RED Digital Cinema' },
        { id: '2', name: 'Sensor', values: '6K Super35 Global Shutter' },
      ],
      periodicity: 'Day',
      pickup_time: '09:00 H',
      return_time: '20:00 H',
      padding_time: '2:00 H',
      late_fees: 500,
      security_deposit: 10000,
    });

    const prod3 = await Product.create({
      name: 'DJI Inspire 3 Drone 8K CinemaRAW',
      description: 'Professional 8K full-frame camera drone with Waypoint Pro autonomous routing and dual-operator control.',
      category: 'Drones & Aerial',
      base_price: 12000,
      quantity_on_hand: 3,
      is_published: true,
      status: 'ACTIVE',
      image_url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80',
      vendor_id: vendor1.id,
      attributes: [
        { id: '1', name: 'Brand', values: 'DJI' },
        { id: '2', name: 'Max Speed', values: '94 km/h' },
      ],
      periodicity: 'Day',
      pickup_time: '08:00 H',
      return_time: '18:00 H',
      padding_time: '3:00 H',
      late_fees: 1000,
      security_deposit: 15000,
    });

    const prod4 = await Product.create({
      name: 'Sennheiser EW-DP Wireless Mic System',
      description: 'Digital UHF wireless microphone receiver and transmitter set with lavalier and OLED display.',
      category: 'Audio & Sound',
      base_price: 1200,
      quantity_on_hand: 15,
      is_published: true,
      status: 'ACTIVE',
      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
      vendor_id: vendor2.id,
      attributes: [
        { id: '1', name: 'Brand', values: 'Sennheiser' },
        { id: '2', name: 'Type', values: 'Digital UHF Wireless' },
      ],
      periodicity: 'Day',
      pickup_time: '10:00 H',
      return_time: '19:00 H',
      padding_time: '1:00 H',
      late_fees: 100,
      security_deposit: 2000,
    });

    const prod5 = await Product.create({
      name: 'Aputure LS 1200d Pro LED Light Kit',
      description: 'Flagship 1200W daylight COB LED light fixture with Bowens mount and weather-resistant IP65 design.',
      category: 'Lighting & Grip',
      base_price: 2800,
      quantity_on_hand: 8,
      is_published: true,
      status: 'ACTIVE',
      image_url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
      vendor_id: vendor2.id,
      attributes: [
        { id: '1', name: 'Brand', values: 'Aputure' },
        { id: '2', name: 'Power Output', values: '1200W Daylight' },
      ],
      periodicity: 'Day',
      pickup_time: '10:00 H',
      return_time: '19:00 H',
      padding_time: '2:00 H',
      late_fees: 200,
      security_deposit: 4000,
    });

    console.log('📷 Seeded 5 High-Quality Equipment Products.');

    // 7. Seed Sample Orders
    const today = new Date();
    const startDateStr = today.toISOString().split('T')[0];
    const endDateObj = new Date(today);
    endDateObj.setDate(today.getDate() + 3);
    const endDateStr = endDateObj.toISOString().split('T')[0];

    const order1 = await Order.create({
      order_number: 'ORD-1001',
      customer_id: customer1.id,
      vendor_id: vendor1.id,
      status: 'CONFIRMED',
      delivery_method: 'STORE_PICKUP',
      start_date: startDateStr,
      end_date: endDateStr,
      subtotal: 10500,
      delivery_address: customer1.address,
    });

    await OrderItem.create({
      order_id: order1.id,
      product_id: prod1.id,
      rental_period_id: periods[1].id,
      product_name: prod1.name,
      start_date: startDateStr,
      end_date: endDateStr,
      quantity: 1,
      unit_price: 3500,
      total_price: 10500,
    });

    const order2 = await Order.create({
      order_number: 'ORD-1002',
      customer_id: customer2.id,
      vendor_id: vendor1.id,
      status: 'PICKED_UP',
      delivery_method: 'DELIVERY',
      start_date: startDateStr,
      end_date: endDateStr,
      subtotal: 15000,
      delivery_address: customer2.address,
    });

    await OrderItem.create({
      order_id: order2.id,
      product_id: prod2.id,
      rental_period_id: periods[1].id,
      product_name: prod2.name,
      start_date: startDateStr,
      end_date: endDateStr,
      quantity: 1,
      unit_price: 7500,
      total_price: 15000,
    });

    console.log('🧾 Seeded 2 Sample Orders (CONFIRMED & PICKED_UP).');

    // 8. Seed Invoices
    await Invoice.create({
      order_id: order1.id,
      customer_id: customer1.id,
      vendor_id: vendor1.id,
      invoice_number: 'INV-2026-001',
      total_amount: 12390,
      status: 'POSTED',
      payment_status: 'PAID',
    });

    await Invoice.create({
      order_id: order2.id,
      customer_id: customer2.id,
      vendor_id: vendor1.id,
      invoice_number: 'INV-2026-002',
      total_amount: 17700,
      status: 'POSTED',
      payment_status: 'PAID',
    });

    console.log('💳 Seeded 2 Paid Invoices.');

    // 9. Seed Default Pricelist & Quotation Templates
    await Pricelist.create({
      name: 'Standard Retail Rental Rate 2026',
      currency: 'INR',
      is_active: true,
      discount_percentage: 0,
      vendor_id: vendor1.id,
    });

    await QuotationTemplate.create({
      name: 'Standard Commercial Production Template',
      header_text: 'APEX CINEMA RENTALS - OFFICIAL EQUIPMENT QUOTATION',
      footer_text: 'Thank you for renting with Apex Cinema. Please inspect gear upon pickup.',
      is_default: true,
      vendor_id: vendor1.id,
    });

    console.log('✨ Database reset and seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during database reset and seeding:', err);
    process.exit(1);
  }
}

resetAndSeedDatabase();
