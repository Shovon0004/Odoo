const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    order_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM(
        'DRAFT',
        'SENT',
        'PENDING_PAYMENT',
        'CONFIRMED',
        'READY_FOR_PICKUP',
        'PICKED_UP',
        'ACTIVE',
        'RETURN_PENDING',
        'RETURNED',
        'COMPLETED',
        'CANCELLED'
      ),
      allowNull: false,
      defaultValue: 'DRAFT',
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    delivery_method: {
      type: DataTypes.ENUM('DELIVERY', 'STORE_PICKUP'),
      allowNull: false,
    },
    delivery_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    pre_rental_images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    post_rental_images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    damage_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    damage_assessment: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'rental_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Order;
