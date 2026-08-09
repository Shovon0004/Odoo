const { User, WalletTransaction } = require('../models');
const AppError = require('../utils/errors');
const { sequelize } = require('../config/db');

/**
 * Get user wallet balance and transaction ledger
 */
const getWalletDetails = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'name', 'email', 'role', 'wallet_balance'],
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const transactions = await WalletTransaction.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit: 50,
  });

  return {
    wallet_balance: Number(user.wallet_balance || 0),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    transactions,
  };
};

/**
 * Credit money to user wallet
 */
const creditWallet = async (userId, amount, category = 'TOP_UP', description = '', referenceId = null) => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new AppError('Amount must be a positive number', 400);
  }

  const t = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const currentBalance = Number(user.wallet_balance || 0);
    const newBalance = currentBalance + numericAmount;

    user.wallet_balance = newBalance;
    await user.save({ transaction: t });

    const transaction = await WalletTransaction.create(
      {
        user_id: userId,
        amount: numericAmount,
        type: 'CREDIT',
        category,
        description: description || `Wallet Credited (+₹${numericAmount})`,
        reference_id: referenceId,
      },
      { transaction: t }
    );

    await t.commit();
    return {
      wallet_balance: newBalance,
      transaction,
    };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/**
 * Debit money from user wallet
 */
const debitWallet = async (userId, amount, category = 'RENTAL_PAYMENT', description = '', referenceId = null) => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new AppError('Amount must be a positive number', 400);
  }

  const t = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const currentBalance = Number(user.wallet_balance || 0);
    if (currentBalance < numericAmount) {
      throw new AppError(`Insufficient wallet balance. Available: ₹${currentBalance.toFixed(2)}, Required: ₹${numericAmount.toFixed(2)}`, 400);
    }

    const newBalance = currentBalance - numericAmount;
    user.wallet_balance = newBalance;
    await user.save({ transaction: t });

    const transaction = await WalletTransaction.create(
      {
        user_id: userId,
        amount: numericAmount,
        type: 'DEBIT',
        category,
        description: description || `Wallet Debited (-₹${numericAmount})`,
        reference_id: referenceId,
      },
      { transaction: t }
    );

    await t.commit();
    return {
      wallet_balance: newBalance,
      transaction,
    };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

module.exports = {
  getWalletDetails,
  creditWallet,
  debitWallet,
};
