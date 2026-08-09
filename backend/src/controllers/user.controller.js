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
    const { name, profile_image, address, business_name, gst_number, phone } = req.body;

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
      phone,
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

/**
 * PUT /api/users/:id/approval
 * Toggle or set vendor approval status (SuperAdmin / Admin action)
 */
const toggleApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;
    const { User } = require('../models');

    const targetUser = await User.findByPk(id);
    if (!targetUser) {
      throw new AppError('User not found', 404);
    }

    targetUser.is_approved = is_approved !== undefined ? Boolean(is_approved) : !targetUser.is_approved;
    await targetUser.save();

    return successResponse(res, 200, `Vendor authorization updated to ${targetUser.is_approved ? 'APPROVED' : 'PENDING'} successfully`, targetUser);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/kyc
 * Customer submits government ID details and document photo for KYC verification
 */
const submitKyc = async (req, res, next) => {
  try {
    const { kyc_id_type, kyc_id_number, kyc_document_url } = req.body;
    const { User } = require('../models');

    if (!kyc_id_type || !kyc_id_number || !kyc_document_url) {
      throw new AppError('Identity document type, ID number, and document photo are required for KYC submission', 400);
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.kyc_id_type = kyc_id_type;
    user.kyc_id_number = kyc_id_number;
    user.kyc_document_url = kyc_document_url;
    user.kyc_status = 'PENDING';
    await user.save();

    return successResponse(res, 200, 'KYC document submitted successfully. Your identity verification is under review.', user);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id/kyc-status
 * Admin / SuperAdmin approves or rejects customer KYC document
 */
const updateKycStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { kyc_status } = req.body;
    const { User } = require('../models');

    if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(kyc_status)) {
      throw new AppError('Invalid KYC status. Must be VERIFIED, REJECTED, or PENDING', 400);
    }

    const targetUser = await User.findByPk(id);
    if (!targetUser) {
      throw new AppError('User not found', 404);
    }

    targetUser.kyc_status = kyc_status;
    await targetUser.save();

    return successResponse(res, 200, `User KYC status updated to ${kyc_status} successfully`, targetUser);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  getAllUsers,
  updateProfile,
  updateRole,
  toggleApproval,
  submitKyc,
  updateKycStatus,
};
