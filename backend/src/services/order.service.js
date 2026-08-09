const { Op } = require('sequelize');
const { sequelize, Order, OrderItem, Cart, CartItem, Product, ProductVariant, RentalPeriod, User, RentalPickup, RentalReturn, SecurityDeposit } = require('../models');
const pricingService = require('./pricing.service');
const AppError = require('../utils/errors');

/**
 * Generate human-readable unique order number: RNT-YYYYMMDD-XXXX
 */
const generateOrderNumber = async (transaction = null) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `RNT-${dateStr}-`;

  const countToday = await Order.count({
    where: {
      order_number: {
        [Op.like]: `${prefix}%`,
      },
    },
    transaction,
  });

  const sequence = String(countToday + 1).padStart(4, '0');
  return `${prefix}${sequence}`;
};

/**
 * Auto-release stock for expired PENDING_PAYMENT orders (> 10 mins old)
 * Runs in its own independent DB operation — NOT inside the caller's transaction.
 */
const releaseExpiredOrders = async () => {
  try {
    const now = new Date();
    await Order.update(
      { status: 'CANCELLED', expires_at: null },
      {
        where: {
          status: 'PENDING_PAYMENT',
          expires_at: { [Op.lt]: now },
        },
      }
    );
  } catch (err) {
    console.error('Error releasing expired order stock:', err.message);
  }
};

/**
 * Convert customer's active cart into a Rental Order using a PostgreSQL Transaction
 */
const createOrderFromCart = async (customerId, { delivery_method, delivery_address }) => {
  // 0. Release any timed-out / expired pending reservations BEFORE opening main transaction
  //    so a failure here never aborts the checkout transaction
  await releaseExpiredOrders();

  const transaction = await sequelize.transaction();

  try {

    // 1. Fetch active cart
    const cart = await Cart.findOne({
      where: { customer_id: customerId, status: 'ACTIVE' },
      transaction,
    });

    if (!cart) {
      throw new AppError('No active cart found for checkout', 400);
    }

    const cartItems = await CartItem.findAll({
      where: { cart_id: cart.id },
      include: [
        { model: Product, as: 'product' },
        { model: ProductVariant, as: 'variant' },
        { model: RentalPeriod, as: 'rental_period' },
      ],
      transaction,
    });

    if (!cartItems || cartItems.length === 0) {
      throw new AppError('Cart is empty. Add items before checking out.', 400);
    }

    let subtotal = 0;
    let overallStartDate = null;
    let overallEndDate = null;
    const orderItemsData = [];

    // 2. Validate items, check atomic stock reservation, & recalculate prices
    for (const item of cartItems) {
      if (!item.product || item.product.status !== 'ACTIVE') {
        throw new AppError(`Product "${item.product ? item.product.name : 'Unknown'}" is no longer available`, 400);
      }
      if (item.variant && item.variant.status !== 'ACTIVE') {
        throw new AppError(`Product variant for "${item.product.name}" is no longer available`, 400);
      }
      if (!item.rental_period || item.rental_period.status !== 'ACTIVE') {
        throw new AppError(`Rental period for "${item.product.name}" is no longer available`, 400);
      }

      // Lock product row to prevent race conditions during concurrent checkouts
      const lockedProduct = await Product.findByPk(item.product_id, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      // Calculate currently reserved/active stock using raw SQL to avoid GROUP BY issues.
      // Counts qty held by: active orders (CONFIRMED/ACTIVE/etc) + non-expired PENDING_PAYMENT orders.
      const [[{ reserved }]] = await sequelize.query(
        `SELECT COALESCE(SUM(oi.quantity), 0) AS reserved
         FROM rental_order_items oi
         INNER JOIN rental_orders o ON oi.order_id = o.id
         WHERE oi.product_id = :productId
           AND (
             o.status IN ('CONFIRMED', 'READY_FOR_PICKUP', 'PICKED_UP', 'ACTIVE')
             OR (o.status = 'PENDING_PAYMENT' AND o.expires_at > NOW())
           )`,
        {
          replacements: { productId: item.product_id },
          transaction,
        }
      );
      const activeReservedSum = Number(reserved) || 0;

      const availableQuantity = Number(lockedProduct.quantity_on_hand) - Number(activeReservedSum);
      if (availableQuantity < item.quantity) {
        throw new AppError(
          `Stock reservation failed for "${lockedProduct.name}". Only ${Math.max(0, availableQuantity)} unit(s) available; the rest are currently reserved by another customer.`,
          400
        );
      }

      // Recalculate price
      const priceResult = pricingService.calculateRentalPrice({
        basePrice: item.product.base_price,
        startDate: item.start_date,
        endDate: item.end_date,
        rentalPeriod: item.rental_period,
        quantity: item.quantity,
      });

      subtotal += priceResult.totalPrice;

      // Track overall start and end dates
      if (!overallStartDate || new Date(item.start_date) < new Date(overallStartDate)) {
        overallStartDate = item.start_date;
      }
      if (!overallEndDate || new Date(item.end_date) > new Date(overallEndDate)) {
        overallEndDate = item.end_date;
      }

      // Prepare snapshot for order item
      const variantSnapshot = item.variant
        ? {
            id: item.variant.id,
            brand: item.variant.brand,
            manufacturer: item.variant.manufacturer,
            color: item.variant.color,
            size: item.variant.size,
          }
        : null;

      orderItemsData.push({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        rental_period_id: item.rental_period_id,
        product_name: item.product.name,
        variant_details: variantSnapshot,
        start_date: item.start_date,
        end_date: item.end_date,
        quantity: item.quantity,
        unit_price: priceResult.unitPrice,
        total_price: priceResult.totalPrice,
      });
    }

    // 3. Generate Order Number & Expiration Time (10 Minutes)
    const orderNumber = await generateOrderNumber(transaction);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes hold

    // 4. Create Rental Order with PENDING_PAYMENT status and 10-minute hold
    const order = await Order.create(
      {
        customer_id: customerId,
        order_number: orderNumber,
        status: 'PENDING_PAYMENT',
        expires_at: expiresAt,
        subtotal: Number(subtotal.toFixed(2)),
        delivery_method,
        delivery_address: delivery_method === 'DELIVERY' ? delivery_address.trim() : null,
        start_date: overallStartDate,
        end_date: overallEndDate,
      },
      { transaction }
    );

    // 5. Create Order Items
    for (const itemData of orderItemsData) {
      await OrderItem.create(
        {
          order_id: order.id,
          ...itemData,
        },
        { transaction }
      );
    }

    // 6. Mark Cart as CHECKED_OUT
    cart.status = 'CHECKED_OUT';
    await cart.save({ transaction });

    // 7. Commit Transaction
    await transaction.commit();

    // 8. Return complete order
    return await getOrderDetailsById(order.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get single order by ID (with items, pickup, return, deposit, customer info)
 */
const getOrderDetailsById = async (orderId) => {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: OrderItem,
        as: 'items',
      },
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: RentalPickup,
        as: 'pickup',
      },
      {
        model: RentalReturn,
        as: 'return',
      },
      {
        model: SecurityDeposit,
        as: 'security_deposit',
      },
    ],
  });

  return order ? order.toJSON() : null;
};

/**
 * Get customer orders list
 */
const getCustomerOrders = async (customerId) => {
  const orders = await Order.findAll({
    where: { customer_id: customerId },
    include: [
      {
        model: OrderItem,
        as: 'items',
      },
      {
        model: RentalPickup,
        as: 'pickup',
      },
      {
        model: RentalReturn,
        as: 'return',
      },
      {
        model: SecurityDeposit,
        as: 'security_deposit',
      },
    ],
    order: [['created_at', 'DESC']],
  });
  return orders.map((o) => o.toJSON());
};

/**
 * Get customer single order (with authorization check)
 */
const getCustomerOrderById = async (customerId, orderId) => {
  const order = await Order.findOne({
    where: { id: orderId, customer_id: customerId },
    include: [
      {
        model: OrderItem,
        as: 'items',
      },
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: RentalPickup,
        as: 'pickup',
      },
      {
        model: RentalReturn,
        as: 'return',
      },
      {
        model: SecurityDeposit,
        as: 'security_deposit',
      },
    ],
  });

  if (!order) {
    throw new AppError('Order not found or access denied', 404);
  }

  return order.toJSON();
};

/**
 * Cancel customer pending order
 */
const cancelOrder = async (customerId, orderId) => {
  const order = await Order.findOne({
    where: { id: orderId, customer_id: customerId },
  });

  if (!order) {
    throw new AppError('Order not found or access denied', 404);
  }

  if (order.status !== 'PENDING_PAYMENT') {
    throw new AppError('Only orders with status PENDING_PAYMENT can be cancelled', 400);
  }

  order.status = 'CANCELLED';
  await order.save();

  return await getOrderDetailsById(order.id);
};

/**
 * Validate stock availability for all items in an order for its rental date range.
 * Throws AppError if any item is out of stock / overbooked.
 */
const validateStockAvailabilityForOrder = async (orderId, transaction = null) => {
  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: 'items' }],
    transaction,
  });

  if (!order || !order.items || order.items.length === 0) return;

  for (const item of order.items) {
    const product = await Product.findByPk(item.product_id, { transaction });
    if (!product || product.status !== 'ACTIVE') {
      throw new AppError(`Product "${item.product_name || 'Item'}" is inactive or unavailable`, 400);
    }

    const startDate = item.start_date || order.start_date;
    const endDate = item.end_date || order.end_date;

    // Check reserved quantity by OTHER confirmed / active orders during overlapping date range
    const [[{ reserved }]] = await sequelize.query(
      `SELECT COALESCE(SUM(oi.quantity), 0) AS reserved
       FROM rental_order_items oi
       INNER JOIN rental_orders o ON oi.order_id = o.id
       WHERE oi.product_id = :productId
         AND o.id != :orderId
         AND o.status IN ('CONFIRMED', 'READY_FOR_PICKUP', 'PICKED_UP', 'ACTIVE')
         AND (o.start_date <= :endDate AND o.end_date >= :startDate)`,
      {
        replacements: {
          productId: item.product_id,
          orderId: order.id,
          startDate,
          endDate,
        },
        transaction,
      }
    );

    const activeReservedSum = Number(reserved) || 0;
    const availableQuantity = Number(product.quantity_on_hand) - activeReservedSum;

    if (availableQuantity < item.quantity) {
      throw new AppError(
        `Cannot confirm order: Product "${product.name}" is OUT OF STOCK for the selected dates (${startDate} to ${endDate}). Available: ${Math.max(0, availableQuantity)}, Requested: ${item.quantity}.`,
        400
      );
    }
  }
};

/**
 * Customer accepts quotation online (SENT -> CONFIRMED)
 */
const acceptCustomerQuotation = async (customerId, orderId) => {
  const order = await Order.findOne({
    where: { id: orderId, customer_id: customerId },
    include: [{ model: User, as: 'customer', attributes: ['id', 'name', 'email'] }],
  });

  if (!order) {
    throw new AppError('Quotation not found or access denied', 404);
  }

  if (order.status !== 'SENT' && order.status !== 'DRAFT') {
    throw new AppError(`Cannot accept quotation in current status: ${order.status}`, 400);
  }

  // Validate stock availability before confirming
  await validateStockAvailabilityForOrder(orderId);

  order.status = 'CONFIRMED';
  await order.save();

  // Dispatch confirmation email
  const emailService = require('./email.service');
  if (order.customer) {
    emailService.sendOrderConfirmationEmail(order, order.customer.email, order.customer.name).catch(console.error);
  }

  return await getOrderDetailsById(order.id);
};

/**
 * Customer rejects quotation online (SENT -> CANCELLED)
 */
const rejectCustomerQuotation = async (customerId, orderId) => {
  const order = await Order.findOne({
    where: { id: orderId, customer_id: customerId },
  });

  if (!order) {
    throw new AppError('Quotation not found or access denied', 404);
  }

  if (order.status !== 'SENT' && order.status !== 'DRAFT') {
    throw new AppError(`Cannot decline quotation in current status: ${order.status}`, 400);
  }

  order.status = 'CANCELLED';
  await order.save();

  return await getOrderDetailsById(order.id);
};

/**
 * Get all orders for Admin with optional filters
 */
const getAllOrdersForAdmin = async (filters = {}) => {
  const whereClause = {};

  if (filters.status) {
    whereClause.status = filters.status;
  }
  if (filters.customer_id) {
    whereClause.customer_id = filters.customer_id;
  }
  if (filters.start_date) {
    whereClause.start_date = { [Op.gte]: filters.start_date };
  }
  if (filters.end_date) {
    whereClause.end_date = { [Op.lte]: filters.end_date };
  }

  const itemInclude = {
    model: OrderItem,
    as: 'items',
    include: [
      {
        model: Product,
        as: 'product',
      },
    ],
  };

  if (filters.vendor_id) {
    itemInclude.include[0].where = { vendor_id: filters.vendor_id };
    itemInclude.include[0].required = true;
    itemInclude.required = true;
  }

  const orders = await Order.findAll({
    where: whereClause,
    include: [
      itemInclude,
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: RentalPickup,
        as: 'pickup',
      },
      {
        model: RentalReturn,
        as: 'return',
      },
      {
        model: SecurityDeposit,
        as: 'security_deposit',
      },
    ],
    order: [['created_at', 'DESC']],
  });

  return orders.map((o) => o.toJSON());
};

/**
 * Update order status for Admin & Vendor
 */
const updateOrderStatus = async (orderId, newStatus) => {
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const validStatuses = [
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
    'CANCELLED',
  ];

  if (!validStatuses.includes(newStatus)) {
    throw new AppError('Invalid order status', 400);
  }

  // If transitioning to CONFIRMED or ACTIVE, validate stock availability first
  if (['CONFIRMED', 'READY_FOR_PICKUP', 'PICKED_UP', 'ACTIVE'].includes(newStatus) && !['CONFIRMED', 'READY_FOR_PICKUP', 'PICKED_UP', 'ACTIVE'].includes(order.status)) {
    await validateStockAvailabilityForOrder(orderId);
  }

  order.status = newStatus;
  await order.save();

  return await getOrderDetailsById(order.id);
};

module.exports = {
  createOrderFromCart,
  getOrderDetailsById,
  getCustomerOrders,
  getCustomerOrderById,
  cancelOrder,
  acceptCustomerQuotation,
  rejectCustomerQuotation,
  getAllOrdersForAdmin,
  updateOrderStatus,
  validateStockAvailabilityForOrder,
};
