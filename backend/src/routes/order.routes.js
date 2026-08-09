const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const paymentController = require('../controllers/payment.controller');
const pickupController = require('../controllers/pickup.controller');
const returnController = require('../controllers/return.controller');
const lateFeeController = require('../controllers/late_fee.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Order lifecycle & Quotation routes
router.post('/', orderController.createOrder);
router.get('/', orderController.getCustomerOrders);
router.get('/:id', orderController.getCustomerOrderById);
router.post('/:id/cancel', orderController.cancelOrder);
router.put('/:id/accept-quotation', orderController.acceptQuotation);
router.put('/:id/reject-quotation', orderController.rejectQuotation);

// Payment & Security Deposit routes
router.get('/:orderId/payment-summary', paymentController.getPaymentSummary);
router.post('/:orderId/payment', paymentController.initiatePayment);
router.post('/:orderId/razorpay-order', paymentController.createRazorpayOrder);
router.post('/:orderId/verify-razorpay', paymentController.verifyRazorpayPayment);
router.get('/:orderId/payments', paymentController.getPaymentsByOrderId);
router.get('/:orderId/security-deposit', paymentController.getSecurityDeposit);

// Pickup & Return Customer View routes
router.get('/:orderId/pickup', pickupController.getCustomerPickup);
router.get('/:orderId/return', returnController.getCustomerReturn);

// Late Fee Customer View route
router.get('/:orderId/late-fee', lateFeeController.getCustomerLateFee);

module.exports = router;
