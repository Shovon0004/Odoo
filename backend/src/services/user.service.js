const { Op } = require('sequelize');
const User = require('../models/user.model');

/**
 * Find user by email (includes password hash)
 */
const findUserByEmail = async (email) => {
  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() },
  });
  return user ? user.toJSON() : null;
};

/**
 * Find user by ID (excludes password)
 */
const findUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] },
  });
  return user ? user.toJSON() : null;
};

/**
 * Find all users (excludes password)
 */
const findAllUsers = async (vendorId = null) => {
  if (vendorId) {
    const { Order, OrderItem, Product } = require('../models');
    const users = await User.findAll({
      attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] },
      include: [
        {
          model: Order,
          as: 'orders',
          required: true,
          include: [
            {
              model: OrderItem,
              as: 'items',
              required: true,
              include: [
                {
                  model: Product,
                  as: 'product',
                  where: { vendor_id: vendorId },
                  required: true,
                },
              ],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    return users.map(u => u.toJSON());
  }

  const users = await User.findAll({
    attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] },
    order: [['created_at', 'DESC']],
  });
  return users.map(u => u.toJSON());
};

/**
 * Create a new user with optional role (defaults to CUSTOMER)
 */
const createUser = async ({ name, email, hashedPassword, role = 'CUSTOMER' }) => {
  const validRoles = ['CUSTOMER', 'VENDOR', 'ADMIN', 'SUPERADMIN'];
  const userRole = validRoles.includes(role) ? role : 'CUSTOMER';

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: userRole,
  });

  const userData = user.toJSON();
  delete userData.password;
  return userData;
};

/**
 * Update user profile
 */
const updateUserProfile = async (id, { name, profile_image, address, business_name, gst_number, phone }) => {
  const user = await User.findByPk(id);
  if (!user) return null;

  if (name !== undefined) user.name = name.trim();
  if (profile_image !== undefined) user.profile_image = profile_image;
  if (address !== undefined) user.address = address;
  if (phone !== undefined) user.phone = phone ? phone.trim() : null;
  if (business_name !== undefined) user.business_name = business_name ? business_name.trim() : null;
  if (gst_number !== undefined) user.gst_number = gst_number ? gst_number.trim().toUpperCase() : null;

  await user.save();

  const updatedUserData = user.toJSON();
  delete updatedUserData.password;
  delete updatedUserData.reset_password_token;
  delete updatedUserData.reset_password_expires;
  return updatedUserData;
};

/**
 * Save password reset token and expiration
 */
const setResetPasswordToken = async (email, resetToken, expiresAt) => {
  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user) return null;

  user.reset_password_token = resetToken;
  user.reset_password_expires = expiresAt;
  await user.save();

  return user.toJSON();
};

/**
 * Find user by valid reset token
 */
const findUserByResetToken = async (resetToken) => {
  const user = await User.findOne({
    where: {
      reset_password_token: resetToken,
      reset_password_expires: {
        [Op.gt]: new Date(),
      },
    },
  });
  return user ? user : null;
};

/**
 * Update user password and clear reset token
 */
const resetUserPassword = async (userInstance, newHashedPassword) => {
  userInstance.password = newHashedPassword;
  userInstance.reset_password_token = null;
  userInstance.reset_password_expires = null;
  await userInstance.save();

  const updatedUser = userInstance.toJSON();
  delete updatedUser.password;
  return updatedUser;
};

/**
 * Seed or verify Super Admin user
 */
const seedSuperAdmin = async () => {
  const bcrypt = require('bcryptjs');
  try {
    const superAdminEmail = 'super@admin123';
    const hashedPassword = await bcrypt.hash('pass1234', 10);
    const existing = await User.findOne({ where: { email: superAdminEmail } });

    if (!existing) {
      await User.create({
        name: 'Super Admin',
        email: superAdminEmail,
        password: hashedPassword,
        role: 'SUPERADMIN',
      });
      console.log('[SEED] Super Admin account initialized.');
    } else {
      existing.role = 'SUPERADMIN';
      existing.password = hashedPassword;
      await existing.save();
      console.log('[SEED] Super Admin account verified.');
    }
  } catch (err) {
    console.error('[SEED] Error seeding Super Admin:', err.message);
  }
};

/**
 * Update user role (Super Admin action)
 */
const updateUserRole = async (userId, newRole) => {
  const validRoles = ['CUSTOMER', 'VENDOR', 'ADMIN', 'SUPERADMIN'];
  if (!validRoles.includes(newRole)) return null;

  const user = await User.findByPk(userId);
  if (!user) return null;

  user.role = newRole;
  await user.save();

  const updated = user.toJSON();
  delete updated.password;
  return updated;
};

module.exports = {
  findUserByEmail,
  findUserById,
  findAllUsers,
  createUser,
  updateUserProfile,
  setResetPasswordToken,
  findUserByResetToken,
  resetUserPassword,
  seedSuperAdmin,
  updateUserRole,
};
