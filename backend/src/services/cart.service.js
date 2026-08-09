const { Cart, CartItem, Product, ProductVariant, RentalPeriod } = require('../models');
const pricingService = require('./pricing.service');
const AppError = require('../utils/errors');

/**
 * Get or create the customer's active cart
 */
const getOrCreateActiveCart = async (customerId) => {
  let cart = await Cart.findOne({
    where: { customer_id: customerId, status: 'ACTIVE' },
  });

  if (!cart) {
    cart = await Cart.create({
      customer_id: customerId,
      status: 'ACTIVE',
    });
  }

  return cart;
};

/**
 * Get active cart details with items and subtotal
 */
const getActiveCartDetails = async (customerId) => {
  const cart = await getOrCreateActiveCart(customerId);

  const fullCart = await Cart.findByPk(cart.id, {
    include: [
      {
        model: CartItem,
        as: 'items',
        include: [
          { model: Product, as: 'product', attributes: ['id', 'name', 'category', 'base_price', 'status', 'image_url'] },
          { model: ProductVariant, as: 'variant', attributes: ['id', 'brand', 'manufacturer', 'color', 'size', 'status'] },
          { model: RentalPeriod, as: 'rental_period', attributes: ['id', 'name', 'duration', 'unit', 'status'] },
        ],
      },
    ],
  });

  const cartData = fullCart.toJSON();
  const subtotal = cartData.items.reduce((sum, item) => sum + Number(item.price || 0), 0);

  return {
    cart_id: cartData.id,
    customer_id: cartData.customer_id,
    status: cartData.status,
    items: cartData.items,
    subtotal: Number(subtotal.toFixed(2)),
  };
};

/**
 * Add product/variant to customer's active cart
 */
const addItemToCart = async (customerId, { product_id, variant_id, product_variant_id, rental_period_id, start_date, end_date, quantity = 1 }) => {
  const targetProductId = product_id || product_variant_id;
  
  // 1. Verify Product exists
  const product = await Product.findByPk(targetProductId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // 2. Verify Variant if provided
  let variant = null;
  const targetVariantId = variant_id || null;
  if (targetVariantId) {
    variant = await ProductVariant.findByPk(targetVariantId);
  }

  // 3. Fallback RentalPeriod if not provided or invalid
  let rentalPeriod = null;
  if (!rental_period_id || rental_period_id === 'default') {
    rentalPeriod = await RentalPeriod.findOne({ where: { status: 'ACTIVE' } });
    if (!rentalPeriod) {
      rentalPeriod = await RentalPeriod.create({
        name: 'Daily Rental',
        duration: 1,
        unit: 'DAY',
        status: 'ACTIVE'
      });
    }
    rental_period_id = rentalPeriod.id;
  } else {
    rentalPeriod = await RentalPeriod.findByPk(rental_period_id);
    if (!rentalPeriod) {
      rentalPeriod = await RentalPeriod.findOne({ where: { status: 'ACTIVE' } });
      if (rentalPeriod) rental_period_id = rentalPeriod.id;
    }
  }

  // 4. Default start_date and end_date if missing
  if (!start_date || !end_date) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + (rentalPeriod ? (rentalPeriod.duration || 1) : 1));
    start_date = today.toISOString().split('T')[0];
    end_date = tomorrow.toISOString().split('T')[0];
  }

  // 5. Calculate price on SERVER
  const priceResult = pricingService.calculateRentalPrice({
    basePrice: product.base_price,
    startDate: start_date,
    endDate: end_date,
    rentalPeriod,
    quantity: Number(quantity),
  });

  // 6. Get active cart
  const cart = await getOrCreateActiveCart(customerId);

  // 7. Check if exact item exists in cart
  const existingItem = await CartItem.findOne({
    where: {
      cart_id: cart.id,
      product_id: targetProductId,
      variant_id: targetVariantId || null,
      rental_period_id,
    },
  });

  if (existingItem) {
    const newQty = existingItem.quantity + Number(quantity);
    const updatedPriceResult = pricingService.calculateRentalPrice({
      basePrice: product.base_price,
      startDate: start_date,
      endDate: end_date,
      rentalPeriod,
      quantity: newQty,
    });
    existingItem.quantity = newQty;
    existingItem.price = updatedPriceResult.totalPrice;
    await existingItem.save();
  } else {
    await CartItem.create({
      cart_id: cart.id,
      product_id: targetProductId,
      variant_id: targetVariantId || null,
      rental_period_id,
      start_date,
      end_date,
      quantity: Number(quantity),
      price: priceResult.totalPrice,
    });
  }

  return await getActiveCartDetails(customerId);
};

/**
 * Update an existing cart item
 */
const updateCartItem = async (customerId, itemId, { product_id, variant_id, rental_period_id, start_date, end_date, quantity }) => {
  const cart = await getOrCreateActiveCart(customerId);

  const cartItem = await CartItem.findOne({
    where: { id: itemId, cart_id: cart.id },
  });

  if (!cartItem) {
    throw new AppError('Cart item not found in your active cart', 404);
  }

  const targetProductId = product_id || cartItem.product_id;
  const targetVariantId = variant_id !== undefined ? variant_id : cartItem.variant_id;
  const targetRentalPeriodId = rental_period_id || cartItem.rental_period_id;
  const targetStartDate = start_date || cartItem.start_date;
  const targetEndDate = end_date || cartItem.end_date;
  const targetQuantity = quantity !== undefined ? Number(quantity) : cartItem.quantity;

  if (targetQuantity < 1) {
    throw new AppError('Quantity must be at least 1', 400);
  }

  const product = await Product.findByPk(targetProductId);
  if (!product) {
    throw new AppError('Product not found', 400);
  }

  const rentalPeriod = await RentalPeriod.findByPk(targetRentalPeriodId);

  const priceResult = pricingService.calculateRentalPrice({
    basePrice: product.base_price,
    startDate: targetStartDate,
    endDate: targetEndDate,
    rentalPeriod: rentalPeriod || { duration: 1 },
    quantity: targetQuantity,
  });

  cartItem.product_id = targetProductId;
  cartItem.variant_id = targetVariantId || null;
  cartItem.rental_period_id = targetRentalPeriodId;
  cartItem.start_date = targetStartDate;
  cartItem.end_date = targetEndDate;
  cartItem.quantity = targetQuantity;
  cartItem.price = priceResult.totalPrice;

  await cartItem.save();

  return await getActiveCartDetails(customerId);
};

/**
 * Remove an item from the customer's active cart
 */
const removeCartItem = async (customerId, itemId) => {
  const cart = await getOrCreateActiveCart(customerId);

  const cartItem = await CartItem.findOne({
    where: { id: itemId, cart_id: cart.id },
  });

  if (!cartItem) {
    throw new AppError('Cart item not found in your active cart', 404);
  }

  await cartItem.destroy();

  return await getActiveCartDetails(customerId);
};

/**
 * Clear all items from the customer's active cart
 */
const clearCart = async (customerId) => {
  const cart = await getOrCreateActiveCart(customerId);

  await CartItem.destroy({
    where: { cart_id: cart.id },
  });

  return await getActiveCartDetails(customerId);
};

module.exports = {
  getOrCreateActiveCart,
  getActiveCartDetails,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
