const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        customEmail(value) {
          if (value && (value.toLowerCase().trim() === 'super@admin123' || value.toLowerCase().trim() === 'superadmin')) {
            return;
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            throw new Error('Must be a valid email address');
          }
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'CUSTOMER',
    },
    profile_image: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    business_name: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    gst_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },
    wallet_balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    kyc_status: {
      type: DataTypes.ENUM('NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'NOT_SUBMITTED',
    },
    kyc_id_type: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    kyc_id_number: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    kyc_document_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    reset_password_token: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = User;
