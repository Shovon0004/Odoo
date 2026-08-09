const userService = require('../services/user.service');
const { successResponse } = require('../utils/response');
const AppError = require('../utils/errors');

/**
 * GET /api/users/profile
 * Get authenticated user's profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userProfile = await userService.findUserById(req.user.id);
    if (!userProfile) {
      throw new AppError('User profile not found', 404);
    }
    return successResponse(res, 200, 'User profile retrieved successfully', userProfile);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users
 * Get all registered users (Admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const vendorId = req.user?.role === 'VENDOR' ? req.user.id : null;
    const users = await userService.findAllUsers(vendorId);
    return successResponse(res, 200, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile
 * Update authenticated user's profile (name, profile_image, address)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, profile_image, address, business_name, gst_number } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      throw new AppError('Name cannot be empty', 400);
    }

    // Validate GST number format (basic: 15 alphanumeric chars) if provided
    if (gst_number && !/^[0-9A-Z]{15}$/.test(gst_number.trim().toUpperCase())) {
      throw new AppError('GST number must be 15 alphanumeric characters (e.g. 22AAAAA0000A1Z5)', 400);
    }

    const updatedUser = await userService.updateUserProfile(req.user.id, {
      name,
      profile_image,
      address,
      business_name,
      gst_number,
    });

    if (!updatedUser) {
      throw new AppError('User profile not found', 404);
    }

    return successResponse(res, 200, 'User profile updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id/role
 * Update user role (Super Admin / Admin action)
 */
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['CUSTOMER', 'VENDOR', 'ADMIN', 'SUPERADMIN'].includes(role)) {
      throw new AppError('Valid role (CUSTOMER, VENDOR, ADMIN, SUPERADMIN) is required', 400);
    }

    const updatedUser = await userService.updateUserRole(id, role);
    if (!updatedUser) {
      throw new AppError('User not found or role update failed', 404);
    }

    return successResponse(res, 200, `User role updated to ${role} successfully`, updatedUser);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  getAllUsers,
  updateProfile,
  updateRole,
};
