const express = require('express');
const router = express.Router();
const adminOrderController = require('../controllers/admin_order.controller');
const paymentController = require('../controllers/payment.controller');
const pickupController = require('../controllers/pickup.controller');
const returnController = require('../controllers/return.controller');
const lateFeeController = require('../controllers/late_fee.controller');
const invoiceController = require('../controllers/invoice.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateToken, authorizeRoles('ADMIN', 'VENDOR'));

// Admin Orders Inspection & Status Actions
router.get('/orders', adminOrderController.getAllOrders);
router.get('/schedule', adminOrderController.getRentalSchedule);
router.put('/orders/:id/status', adminOrderController.updateOrderStatus);
router.put('/orders/:id/send', adminOrderController.sendQuotation);
router.put('/orders/:id/confirm', adminOrderController.confirmOrder);
router.put('/orders/:id/pre-rental-handover', adminOrderController.uploadPreRentalHandover);
router.put('/orders/:id/post-rental-return', adminOrderController.uploadPostRentalReturn);
router.post('/orders/:id/ai-damage-inspect', adminOrderController.runAiDamageInspection);
router.post('/orders/:id/settle-refund', adminOrderController.settleDepositToWallet);
router.post('/orders/:orderId/create-invoice', invoiceController.createInvoice);
router.post('/orders/:orderId/refund-deposit', invoiceController.refundDeposit);

// Admin Invoicing & Payment Actions
router.get('/invoices', invoiceController.getAllInvoices);
router.get('/invoices/:id', invoiceController.getInvoiceById);
router.put('/invoices/:id/post', invoiceController.postInvoice);
router.post('/invoices/:id/register-payment', invoiceController.registerPayment);

// Admin Payments & Security Deposits Inspection
router.get('/payments', paymentController.getAllAdminPayments);
router.get('/security-deposits', paymentController.getAllAdminSecurityDeposits);

// Admin Pickup Management
router.get('/pickups', pickupController.getAdminPickups);
router.get('/pickups/code/:code', pickupController.getPickupByCode);
router.get('/pickups/:id', pickupController.getAdminPickupById);
router.post('/pickups/:id/confirm', pickupController.confirmPickup);

// Admin Return Management
router.get('/returns', returnController.getAdminReturns);
router.get('/returns/:id', returnController.getAdminReturnById);
router.post('/returns/:id/inspect', returnController.inspectReturn);
router.post('/returns/:id/confirm', returnController.confirmReturn);

// Admin Late Fee Configurations
router.post('/late-fee-configs', lateFeeController.createConfig);
router.get('/late-fee-configs', lateFeeController.getConfigs);
router.get('/late-fee-configs/:id', lateFeeController.getConfigById);
router.put('/late-fee-configs/:id', lateFeeController.updateConfig);
router.delete('/late-fee-configs/:id', lateFeeController.deactivateConfig);

// Admin Late Fee Calculations & Overdue Automation
router.post('/returns/:returnId/calculate-late-fee', lateFeeController.calculateLateFee);
router.get('/late-fees', lateFeeController.getLateFees);
router.get('/late-fees/outstanding', lateFeeController.getOutstandingLateFees);
router.post('/late-fees/:id/waive', lateFeeController.waiveLateFee);
router.post('/late-fees/process-overdue', lateFeeController.processOverdueRentals);

module.exports = router;
