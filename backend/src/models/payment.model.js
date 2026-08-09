const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'rental_orders',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'INR',
  },
  payment_type: {
    type: DataTypes.ENUM('RENTAL', 'SECURITY_DEPOSIT'),
    allowNull: false,
    defaultValue: 'RENTAL',
  },
  payment_method: {
    type: DataTypes.ENUM('ONLINE', 'CASH', 'RAZORPAY'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  transaction_reference: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
});

module.exports = Payment;
