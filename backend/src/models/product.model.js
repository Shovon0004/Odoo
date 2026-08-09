const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    vendor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product name is required' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product category is required' },
      },
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Base price must be a valid number' },
        min: { args: [0], msg: 'Base price cannot be negative' },
      },
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    product_type: {
      type: DataTypes.ENUM('Goods', 'Service'),
      allowNull: false,
      defaultValue: 'Goods',
    },
    quantity_on_hand: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 100.00,
    },
    cost_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    periodicity: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Day',
    },
    pickup_time: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '10:00 H',
    },
    return_time: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '19:00 H',
    },
    padding_time: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '2:00 H',
    },
    late_fees: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 150.00,
    },
    security_deposit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 100.00,
    },
    attributes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Product;
