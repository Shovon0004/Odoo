const paymentService = require('../services/payment.service');
const securityDepositService = require('../services/securityDeposit.service');
const { successResponse } = require('../utils/response');
const { validatePaymentInitiation } = require('../utils/validation');

/**
 * GET /api/orders/:orderId/payment-summary
 * Authenticated CUSTOMER only
 */
const getPaymentSummary = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { orderId } = req.params;

    const summary = await paymentService.getPaymentSummary(customerId, orderId);

    return successResponse(res, 200, 'Payment summary calculated successfully', summary);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:orderId/payment
 * Authenticated CUSTOMER only
 */
const initiatePayment = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { orderId } = req.params;
    const { payment_method, simulate_failure } = req.body;

    validatePaymentInitiation({ payment_method });

    const result = await paymentService.initiatePayment(customerId, orderId, {
      payment_method,
      simulate_failure,
    });

    const statusCode = result.success ? 200 : 400;
    return successResponse(res, statusCode, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:orderId/payments
 * CUSTOMER (own order) or ADMIN (all orders)
 */
const getPaymentsByOrderId = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user.role === 'ADMIN' ? null : req.user.id;

    const payments = await paymentService.getPaymentsByOrderId(customerId, orderId);

    return successResponse(res, 200, 'Order payments retrieved successfully', payments);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:orderId/security-deposit
 * CUSTOMER (own order) or ADMIN (all orders)
 */
const getSecurityDeposit = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user.role === 'ADMIN' ? null : req.user.id;

    const deposit = await securityDepositService.getDepositByOrderId(customerId, orderId);

    return successResponse(res, 200, 'Order security deposit retrieved successfully', deposit);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/payments
 * Authenticated ADMIN only
 */
const getAllAdminPayments = async (req, res, next) => {
  try {
    const { status, customer_id, payment_method } = req.query;

    const payments = await paymentService.getAllPaymentsForAdmin({
      status,
      customer_id,
      payment_method,
    });

    return successResponse(res, 200, 'All system payments retrieved successfully', payments);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/security-deposits
 * Authenticated ADMIN only
 */
const getAllAdminSecurityDeposits = async (req, res, next) => {
  try {
    const { status, customer_id } = req.query;

    const deposits = await securityDepositService.getAllDepositsForAdmin({
      status,
      customer_id,
    });

    return successResponse(res, 200, 'All system security deposits retrieved successfully', deposits);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:orderId/razorpay-order
 * Authenticated CUSTOMER only
 */
const createRazorpayOrder = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { orderId } = req.params;

    const rzpOrder = await paymentService.createRazorpayOrder(customerId, orderId);

    return successResponse(res, 201, 'Razorpay order created successfully', rzpOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:orderId/verify-razorpay
 * Authenticated CUSTOMER only
 */
const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { orderId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const result = await paymentService.verifyRazorpayPayment(customerId, orderId, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    return successResponse(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPaymentSummary,
  initiatePayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentsByOrderId,
  getSecurityDeposit,
  getAllAdminPayments,
  getAllAdminSecurityDeposits,
};
