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
