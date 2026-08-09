const walletService = require('../services/wallet.service');

const getWallet = async (req, res, next) => {
  try {
    const result = await walletService.getWalletDetails(req.user.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const topUpWallet = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const result = await walletService.creditWallet(
      req.user.id,
      amount,
      'TOP_UP',
      `Manual Wallet Top-up (+₹${amount})`
    );

    res.status(200).json({
      success: true,
      message: `Successfully topped up ₹${amount} into your wallet!`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWallet,
  topUpWallet,
};
