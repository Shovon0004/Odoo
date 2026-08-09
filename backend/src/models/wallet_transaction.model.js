const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WalletTransaction = sequelize.define(
  'WalletTransaction',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
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
        min: { args: [0.01], msg: 'Transaction amount must be greater than 0' },
      },
    },
    type: {
      type: DataTypes.ENUM('CREDIT', 'DEBIT'),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('DEPOSIT_REFUND', 'DAMAGE_PENALTY', 'RENTAL_PAYMENT', 'TOP_UP', 'TRANSFER'),
      allowNull: false,
      defaultValue: 'TOP_UP',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reference_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: 'wallet_transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = WalletTransaction;
