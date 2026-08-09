const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const rentalPeriodRoutes = require('./routes/rental_period.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const adminOrderRoutes = require('./routes/admin_order.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const quotationTemplateRoutes = require('./routes/quotation_template.routes');
const pricelistRoutes = require('./routes/pricelist.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const contactRoutes = require('./routes/contact.routes');
const { customErrorHandler, globalFallbackErrorHandler } = require('./middleware/error.middleware');
const AppError = require('./utils/errors');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Serve static HTML/CSS files for cURL & Postman explorer dashboard
app.use(express.static(path.join(__dirname, '../public')));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Rental Management API is running smoothly',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/rental-periods', rentalPeriodRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/invoices', invoiceRoutes);
app.use('/api/admin/quotation-templates', quotationTemplateRoutes);
app.use('/api/admin/pricelists', pricelistRoutes);
app.use('/api/admin', adminOrderRoutes);

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Handle Unhandled Routes (404)
app.use('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// Centralized Error Handling Middlewares (Chained)
// 1st Error Handler: Handles custom AppError, Sequelize, and JWT errors
app.use(customErrorHandler);

// 2nd Error Handler: Fallback handler for unhandled 500 errors (called via next(err) if 1st handler returns false)
app.use(globalFallbackErrorHandler);

module.exports = app;
