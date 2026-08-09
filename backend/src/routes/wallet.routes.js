const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/', walletController.getWallet);
router.post('/top-up', walletController.topUpWallet);

module.exports = router;
