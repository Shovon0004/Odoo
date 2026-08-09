const orderService = require('../services/order.service');
const { successResponse } = require('../utils/response');

/**
 * GET /api/admin/orders
 * Admin & Vendor view all orders with optional filters (status, customer_id, start_date, end_date)
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { status, customer_id, start_date, end_date } = req.query;
    const vendor_id = req.user?.role === 'VENDOR' ? req.user.id : null;

    const orders = await orderService.getAllOrdersForAdmin({
      status,
      customer_id,
      start_date,
      end_date,
      vendor_id,
    });

    return successResponse(res, 200, 'All orders retrieved successfully', orders);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/orders/:id/status
 * Admin & Vendor update order status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await orderService.updateOrderStatus(id, status);

    return successResponse(res, 200, `Order status updated to ${status} successfully`, updatedOrder);
  } catch (error) {
    next(error);
  }
};

const emailService = require('../services/email.service');

/**
 * PUT /api/admin/orders/:id/send
 * Transition status from DRAFT -> SENT
 */
const sendQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedOrder = await orderService.updateOrderStatus(id, 'SENT');

    // Trigger email notification
    if (updatedOrder && updatedOrder.customer) {
      emailService.sendQuotationEmail(updatedOrder, updatedOrder.customer.email, updatedOrder.customer.name).catch(console.error);
    }

    return successResponse(res, 200, 'Quotation sent successfully', updatedOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/orders/:id/confirm
 * Transition status -> CONFIRMED (Sale Order)
 */
const confirmOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedOrder = await orderService.updateOrderStatus(id, 'CONFIRMED');

    // Trigger email notification
    if (updatedOrder && updatedOrder.customer) {
      emailService.sendOrderConfirmationEmail(updatedOrder, updatedOrder.customer.email, updatedOrder.customer.name).catch(console.error);
    }

    return successResponse(res, 200, 'Order confirmed as Sale Order successfully', updatedOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/schedule
 * Fetch products, orders, and conflict alerts for schedule matrix
 */
const getRentalSchedule = async (req, res, next) => {
  try {
    const { Product, Order, OrderItem, User } = require('../models');
    const { Op } = require('sequelize');

    const vendorId = req.user?.role === 'VENDOR' ? req.user.id : null;

    const monthParam = req.query.month || new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const [year, month] = monthParam.split('-').map(Number);

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const firstDayStr = firstDay.toISOString().slice(0, 10);
    const lastDayStr = lastDay.toISOString().slice(0, 10);

    const productWhere = {};
    if (vendorId) {
      productWhere.vendor_id = vendorId;
    }

    const products = await Product.findAll({
      where: productWhere,
      order: [['name', 'ASC']],
    });

    const orderWhere = {
      status: { [Op.ne]: 'CANCELLED' },
      [Op.or]: [
        {
          start_date: { [Op.between]: [firstDayStr, lastDayStr] },
        },
        {
          end_date: { [Op.between]: [firstDayStr, lastDayStr] },
        },
        {
          [Op.and]: [
            { start_date: { [Op.lte]: firstDayStr } },
            { end_date: { [Op.gte]: lastDayStr } },
          ],
        },
      ],
    };

    if (vendorId) {
      const dashboardService = require('../services/dashboard.service');
      const vendorOrderIds = await dashboardService.getVendorOrderIds(vendorId);
      orderWhere.id = { [Op.in]: vendorOrderIds };
    }

    const orders = await Order.findAll({
      where: orderWhere,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'base_price', 'vendor_id'] }],
        },
      ],
      order: [['start_date', 'ASC']],
    });

    // Conflict Detection Algorithm
    const conflicts = [];
    const daysInMonth = lastDay.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDateStr = new Date(year, month - 1, day).toISOString().slice(0, 10);

      for (const prod of products) {
        let totalBooked = 0;
        const conflictingOrders = [];

        for (const ord of orders) {
          if (ord.start_date <= currentDateStr && ord.end_date >= currentDateStr) {
            const item = ord.items?.find((i) => i.product_id === prod.id || i.product?.id === prod.id);
            if (item) {
              totalBooked += Number(item.quantity || 1);
              conflictingOrders.push(ord.order_number);
            }
          }
        }

        if (totalBooked > Number(prod.quantity_on_hand || 1)) {
          conflicts.push({
            date: currentDateStr,
            day,
            product_id: prod.id,
            product_name: prod.name,
            booked_qty: totalBooked,
            quantity_on_hand: Number(prod.quantity_on_hand),
            order_numbers: conflictingOrders,
          });
        }
      }
    }

    return successResponse(res, 200, 'Rental schedule matrix and conflicts retrieved', {
      year,
      month,
      monthStr: monthParam,
      daysInMonth,
      products,
      orders,
      conflicts,
    });
  } catch (error) {
    next(error);
  }
};

const aiDamageInspector = require('../services/aiDamageInspector.service');
const walletService = require('../services/wallet.service');
const { Order } = require('../models');
const AppError = require('../utils/errors');

/**
 * PUT /api/admin/orders/:id/pre-rental-handover
 * Vendor uploads 3 pre-rental handover photos upon customer pickup
 */
const uploadPreRentalHandover = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pre_rental_images } = req.body;

    if (!Array.isArray(pre_rental_images) || pre_rental_images.length < 3) {
      throw new AppError('Exactly 3 pre-rental handover photos are required before dispatching equipment.', 400);
    }

    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    order.pre_rental_images = pre_rental_images;
    order.status = 'PICKED_UP';
    await order.save();

    return successResponse(res, 200, 'Pre-rental handover photos saved & order marked PICKED_UP', order);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/orders/:id/post-rental-return
 * Vendor uploads 3 post-rental return photos upon equipment check-in
 */
const uploadPostRentalReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { post_rental_images } = req.body;

    if (!Array.isArray(post_rental_images) || post_rental_images.length < 3) {
      throw new AppError('Exactly 3 post-rental return photos are required upon equipment check-in.', 400);
    }

    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    order.post_rental_images = post_rental_images;
    order.status = 'RETURNED';
    await order.save();

    return successResponse(res, 200, 'Post-rental return photos saved & order marked RETURNED', order);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/orders/:id/ai-damage-inspect
 * Run AI damage comparison algorithm between pre-rental & post-rental photos
 */
const runAiDamageInspection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const assessment = aiDamageInspector.analyzeDamage(
      order.pre_rental_images || [],
      order.post_rental_images || [],
      order.subtotal || 1000,
      1000 // default deposit baseline
    );

    order.damage_score = assessment.damageScore;
    order.damage_assessment = assessment;
    await order.save();

    return successResponse(res, 200, 'AI Damage Inspection completed successfully', {
      order_id: order.id,
      damage_score: order.damage_score,
      assessment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/orders/:id/settle-refund
 * Settle deposit refund and credit net amount into customer's wallet
 */
const settleDepositToWallet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { refund_amount, damage_deduction, notes } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const refundNum = Number(refund_amount) || 0;
    let walletResult = null;

    if (refundNum > 0) {
      walletResult = await walletService.creditWallet(
        order.customer_id,
        refundNum,
        'DEPOSIT_REFUND',
        notes || `Security deposit refund for Order #${order.order_number} (Deductions: ₹${damage_deduction || 0})`,
        order.id
      );
    }

    order.status = 'COMPLETED';
    await order.save();

    return successResponse(res, 200, `Deposit settled successfully! ₹${refundNum} credited to customer wallet.`, {
      order,
      walletResult,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  updateOrderStatus,
  sendQuotation,
  confirmOrder,
  getRentalSchedule,
  uploadPreRentalHandover,
  uploadPostRentalReturn,
  runAiDamageInspection,
  settleDepositToWallet,
};
