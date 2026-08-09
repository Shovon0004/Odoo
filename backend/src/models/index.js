const { sequelize } = require('../config/db');
const User = require('./user.model');
const Product = require('./product.model');
const ProductVariant = require('./variant.model');
const RentalPeriod = require('./rental_period.model');
const Cart = require('./cart.model');
const CartItem = require('./cart_item.model');
const Order = require('./order.model');
const OrderItem = require('./order_item.model');
const Payment = require('./payment.model');
const SecurityDeposit = require('./security_deposit.model');
const RentalPickup = require('./pickup.model');
const RentalReturn = require('./return.model');
const LateFeeConfig = require('./late_fee_config.model');
const LateFee = require('./late_fee.model');
const DepositSettlement = require('./deposit_settlement.model');
const Invoice = require('./invoice.model');
const QuotationTemplate = require('./quotation_template.model');
const Pricelist = require('./pricelist.model');
const PricelistRule = require('./pricelist_rule.model');
const WalletTransaction = require('./wallet_transaction.model');

// --- User & Wallet Transactions ---
User.hasMany(WalletTransaction, {
  foreignKey: 'user_id',
  as: 'wallet_transactions',
  onDelete: 'CASCADE',
});

WalletTransaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// --- User & Product (Vendor) Associations ---
User.hasMany(Product, {
  foreignKey: 'vendor_id',
  as: 'products',
});

Product.belongsTo(User, {
  foreignKey: 'vendor_id',
  as: 'vendor',
});

// --- Product & Variant Associations ---
Product.hasMany(ProductVariant, {
  foreignKey: 'product_id',
  as: 'variants',
  onDelete: 'CASCADE',
});

ProductVariant.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

// --- User & Cart Associations ---
User.hasMany(Cart, {
  foreignKey: 'customer_id',
  as: 'carts',
  onDelete: 'CASCADE',
});

Cart.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer',
});

// --- Cart & CartItem Associations ---
Cart.hasMany(CartItem, {
  foreignKey: 'cart_id',
  as: 'items',
  onDelete: 'CASCADE',
});

CartItem.belongsTo(Cart, {
  foreignKey: 'cart_id',
  as: 'cart',
});

CartItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

CartItem.belongsTo(ProductVariant, {
  foreignKey: 'variant_id',
  as: 'variant',
});

CartItem.belongsTo(RentalPeriod, {
  foreignKey: 'rental_period_id',
  as: 'rental_period',
});

// --- User & Order Associations ---
User.hasMany(Order, {
  foreignKey: 'customer_id',
  as: 'orders',
  onDelete: 'CASCADE',
});

Order.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer',
});

// --- Order & OrderItem Associations ---
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items',
  onDelete: 'CASCADE',
});

OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

OrderItem.belongsTo(ProductVariant, {
  foreignKey: 'variant_id',
  as: 'variant',
});

OrderItem.belongsTo(RentalPeriod, {
  foreignKey: 'rental_period_id',
  as: 'rental_period',
});

// --- Order & Payment Associations ---
Order.hasMany(Payment, {
  foreignKey: 'order_id',
  as: 'payments',
  onDelete: 'CASCADE',
});

Payment.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

User.hasMany(Payment, {
  foreignKey: 'customer_id',
  as: 'payments',
});

Payment.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer',
});

// --- Order & SecurityDeposit Associations ---
Order.hasOne(SecurityDeposit, {
  foreignKey: 'order_id',
  as: 'security_deposit',
  onDelete: 'CASCADE',
});

SecurityDeposit.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

User.hasMany(SecurityDeposit, {
  foreignKey: 'customer_id',
  as: 'customer_deposits',
});

SecurityDeposit.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer',
});

// --- Order & RentalPickup Associations ---
Order.hasOne(RentalPickup, {
  foreignKey: 'order_id',
  as: 'pickup',
  onDelete: 'CASCADE',
});

RentalPickup.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

User.hasMany(RentalPickup, {
  foreignKey: 'customer_id',
  as: 'pickups',
});

RentalPickup.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer',
});

RentalPickup.belongsTo(User, {
  foreignKey: 'confirmed_by',
  as: 'confirmer',
});

// --- Order & RentalReturn Associations ---
Order.hasOne(RentalReturn, {
  foreignKey: 'order_id',
  as: 'return',
  onDelete: 'CASCADE',
});

RentalReturn.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

User.hasMany(RentalReturn, {
  foreignKey: 'customer_id',
  as: 'returns',
});

RentalReturn.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer',
});

RentalReturn.belongsTo(User, {
  foreignKey: 'inspected_by',
  as: 'inspector',
});

// --- Late Fee Config & Late Fee Associations ---
Order.hasMany(LateFee, {
  foreignKey: 'order_id',
  as: 'late_fees',
  onDelete: 'CASCADE',
});

LateFee.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

RentalReturn.hasOne(LateFee, {
  foreignKey: 'return_id',
  as: 'late_fee',
  onDelete: 'CASCADE',
});

LateFee.belongsTo(RentalReturn, {
  foreignKey: 'return_id',
  as: 'return',
});

User.hasMany(LateFee, {
  foreignKey: 'customer_id',
  as: 'late_fees',
});

LateFee.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer',
});

LateFeeConfig.hasMany(LateFee, {
  foreignKey: 'config_id',
  as: 'late_fees',
});

LateFee.belongsTo(LateFeeConfig, {
  foreignKey: 'config_id',
  as: 'config',
});

// --- Deposit Settlement Associations ---
SecurityDeposit.hasMany(DepositSettlement, {
  foreignKey: 'deposit_id',
  as: 'settlements',
  onDelete: 'CASCADE',
});

DepositSettlement.belongsTo(SecurityDeposit, {
  foreignKey: 'deposit_id',
  as: 'deposit',
});

Order.hasMany(DepositSettlement, {
  foreignKey: 'order_id',
  as: 'deposit_settlements',
  onDelete: 'CASCADE',
});

DepositSettlement.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

LateFee.hasOne(DepositSettlement, {
  foreignKey: 'late_fee_id',
  as: 'settlement',
  onDelete: 'SET NULL',
});

DepositSettlement.belongsTo(LateFee, {
  foreignKey: 'late_fee_id',
  as: 'late_fee',
});

// --- Invoice Associations ---
Order.hasMany(Invoice, {
  foreignKey: 'order_id',
  as: 'invoices',
  onDelete: 'CASCADE',
});

Invoice.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

User.hasMany(Invoice, {
  foreignKey: 'customer_id',
  as: 'invoices',
});

Invoice.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer',
});

// --- Pricelist Associations ---
Pricelist.hasMany(PricelistRule, {
  foreignKey: 'pricelist_id',
  as: 'rules',
  onDelete: 'CASCADE',
});

PricelistRule.belongsTo(Pricelist, {
  foreignKey: 'pricelist_id',
  as: 'pricelist',
});

Product.hasMany(PricelistRule, {
  foreignKey: 'product_id',
  as: 'pricelist_rules',
});

PricelistRule.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

module.exports = {
  sequelize,
  User,
  Product,
  ProductVariant,
  RentalPeriod,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  SecurityDeposit,
  RentalPickup,
  RentalReturn,
  LateFeeConfig,
  LateFee,
  DepositSettlement,
  Invoice,
  QuotationTemplate,
  Pricelist,
  PricelistRule,
};
