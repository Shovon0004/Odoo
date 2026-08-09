const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'VENDOR'), userController.getAllUsers);
router.put('/:id/role', authenticateToken, authorizeRoles('ADMIN', 'SUPERADMIN'), userController.updateRole);
router.put('/:id/approval', authenticateToken, authorizeRoles('ADMIN', 'SUPERADMIN'), userController.toggleApproval);
router.post('/kyc', authenticateToken, userController.submitKyc);
router.put('/:id/kyc-status', authenticateToken, authorizeRoles('ADMIN', 'SUPERADMIN'), userController.updateKycStatus);

module.exports = router;
