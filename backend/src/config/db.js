const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('FATAL ERROR: DATABASE_URL environment variable is not defined.');
  process.exit(1);
}

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
});

const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL database connection established successfully via Sequelize.');

    try {
      await sequelize.query(`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
        ALTER TABLE quotation_templates ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
        ALTER TABLE pricelists ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
      `);
    } catch (colErr) {
      console.log('vendor_id migration check:', colErr.message);
    }

    await sequelize.sync();
    console.log('Sequelize models synchronized with database tables.');
    const userService = require('../services/user.service');
    await userService.seedSuperAdmin();
  } catch (error) {
    console.error('Unable to connect to PostgreSQL database or sync models:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  initDb,
};
