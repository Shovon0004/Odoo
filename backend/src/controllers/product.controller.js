const productService = require('../services/product.service');
const { validateProduct } = require('../utils/validation');
const { successResponse } = require('../utils/response');
const AppError = require('../utils/errors');

/**
 * POST /api/products
 * Create a product (Admin only)
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, base_price, status, image_url,
      product_type, quantity_on_hand, cost_price, is_published,
      periodicity, pickup_time, return_time, padding_time, late_fees,
      security_deposit, attributes } = req.body;

    if (req.user?.role === 'VENDOR') {
      const { User } = require('../models');
      const currentUser = await User.findByPk(req.user.id);
      if (!currentUser || !currentUser.is_approved) {
        throw new AppError('Vendor Authorization Required: Your store account must be approved by SuperAdmin before you can list products.', 403);
      }
    }

    const vendorId = req.user?.role === 'VENDOR' ? req.user.id : (req.body.vendor_id || null);

    const newProduct = await productService.createProduct({
      name, description, category, base_price, status,
      vendor_id: vendorId,
      image_url: image_url || null,
      product_type, quantity_on_hand, cost_price, is_published,
      periodicity, pickup_time, return_time, padding_time, late_fees,
      security_deposit, attributes,
    });

    return successResponse(res, 201, 'Product created successfully', newProduct);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products
 * Get all products (Optional filter: ?status=ACTIVE)
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { status, vendor_id } = req.query;
    let vendorIdFilter = vendor_id || null;

    if (req.user && req.user.role === 'VENDOR') {
      vendorIdFilter = req.user.id;
    }

    const products = await productService.getAllProducts(status, vendorIdFilter);
    return successResponse(res, 200, 'Products retrieved successfully', products);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id
 * Get a single product including its variants
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return successResponse(res, 200, 'Product retrieved successfully', product);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:id
 * Update product information (Admin & Vendor)
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name, description, category, base_price, status, image_url,
      product_type, quantity_on_hand, cost_price, is_published,
      periodicity, pickup_time, return_time, padding_time,
      late_fees, security_deposit, attributes
    } = req.body;

    if (base_price !== undefined && (isNaN(base_price) || Number(base_price) < 0)) {
      throw new AppError('Base price must be a non-negative number', 400);
    }
    if (status && !['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new AppError('Status must be ACTIVE or INACTIVE', 400);
    }

    const updatedProduct = await productService.updateProduct(id, {
      name, description, category, base_price, status, image_url,
      product_type, quantity_on_hand, cost_price, is_published,
      periodicity, pickup_time, return_time, padding_time,
      late_fees, security_deposit, attributes
    }, req.user);

    if (!updatedProduct) {
      throw new AppError('Product not found', 404);
    }

    return successResponse(res, 200, 'Product updated successfully', updatedProduct);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id
 * Soft-delete ACTIVE products, or PERMANENTLY delete INACTIVE products
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    const result = await productService.deleteProduct(id, req.user, permanent === 'true');

    if (!result) {
      throw new AppError('Product not found', 404);
    }

    const message = result.isDeleted 
      ? 'Product permanently deleted successfully' 
      : 'Product deactivated successfully';

    return successResponse(res, 200, message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id/availability?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 * Check availability for a specific product and rental period
 */
const checkAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    const result = await productService.checkProductAvailability(id, start_date, end_date);
    return successResponse(res, 200, result.reason, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  checkAvailability,
};
