/**
 * Unified API Client for Frontend <-> Backend Communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Helper to fetch with JWT authorization token from localStorage
 */
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message: data.message || `Request failed with status ${res.status}`,
        error: data,
      };
    }

    return {
      success: true,
      status: res.status,
      data: data.data !== undefined ? data.data : data,
      message: data.message || 'Success',
    };
  } catch (err: any) {
    return {
      success: false,
      status: 500,
      message: err.message || 'Network connection error',
    };
  }
}

// Auth APIs
export const authApi = {
  login: (emailOrCreds: any, password?: string) => {
    const payload = typeof emailOrCreds === 'object' ? emailOrCreds : { email: emailOrCreds, password };
    return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
  },
  register: (userData: any) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getProfile: () => apiFetch('/auth/me'),
  updateProfile: (data: any) =>
    apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getUsers: () => apiFetch('/users'),
  forgotPassword: (email: string) =>
    apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, newPassword: string) =>
    apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  updateUserRole: (userId: string, role: string) =>
    apiFetch(`/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
};

// Product APIs
export const productApi = {
  getAll: (status?: string) => apiFetch(`/products${status ? `?status=${status}` : ''}`),
  getProducts: (status?: string) => apiFetch(`/products${status ? `?status=${status}` : ''}`),
  getProductById: (id: string) => apiFetch(`/products/${id}`),
  getById: (id: string) => apiFetch(`/products/${id}`),
  create: (data: any) => apiFetch('/products', { method: 'POST', body: JSON.stringify(data) }),
  createProduct: (data: any) => apiFetch('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) =>
    apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string, permanent?: boolean) => apiFetch(`/products/${id}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' }),
  deleteProduct: (id: string, permanent?: boolean) => apiFetch(`/products/${id}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' }),
  checkAvailability: (id: string, startDate: string, endDate: string) =>
    apiFetch(`/products/${id}/availability?start_date=${startDate}&end_date=${endDate}`),
  getRentalPeriods: () => apiFetch('/rental-periods'),
  createRentalPeriod: (data: any) => apiFetch('/rental-periods', { method: 'POST', body: JSON.stringify(data) }),
  updateRentalPeriod: (id: string, data: any) => apiFetch(`/rental-periods/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRentalPeriod: (id: string) => apiFetch(`/rental-periods/${id}`, { method: 'DELETE' }),
};

export const rentalPeriodApi = {
  getAll: () => apiFetch('/rental-periods'),
  create: (data: any) => apiFetch('/rental-periods', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch(`/rental-periods/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/rental-periods/${id}`, { method: 'DELETE' }),
};

export const catalogApi = productApi;

// Variant APIs
export const variantApi = {
  create: (productId: string, data: any) =>
    apiFetch(`/products/${productId}/variants`, { method: 'POST', body: JSON.stringify(data) }),
  update: (productId: string, variantId: string, data: any) =>
    apiFetch(`/products/${productId}/variants/${variantId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (productId: string, variantId: string) =>
    apiFetch(`/products/${productId}/variants/${variantId}`, { method: 'DELETE' }),
};

// Cart APIs
export const cartApi = {
  getCart: () => apiFetch('/cart'),
  addItem: (itemData: { product_id?: string; variant_id?: string; product_variant_id?: string; rental_period_id?: string; start_date?: string; end_date?: string; quantity?: number; [key: string]: any }) =>
    apiFetch('/cart/items', { method: 'POST', body: JSON.stringify(itemData) }),
  updateItem: (itemId: string, itemData: any) =>
    apiFetch(`/cart/items/${itemId}`, { method: 'PUT', body: JSON.stringify(itemData) }),
  removeItem: (itemId: string) =>
    apiFetch(`/cart/items/${itemId}`, { method: 'DELETE' }),
  clearCart: () => apiFetch('/cart', { method: 'DELETE' }),
};

// Order & Payment APIs
export const orderApi = {
  createOrder: (orderData: { delivery_method?: string; fulfillment_type?: string; shipping_address?: string; delivery_address?: string; notes?: string; [key: string]: any }) =>
    apiFetch('/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  getOrders: () => apiFetch('/orders'),
  getOrderById: (orderId: string) => apiFetch(`/orders/${orderId}`),
  getPaymentSummary: (orderId: string) => apiFetch(`/orders/${orderId}/payment-summary`),
  payOrder: (orderId: string, payment_method: string = 'ONLINE') =>
    apiFetch(`/orders/${orderId}/payment`, { method: 'POST', body: JSON.stringify({ payment_method }) }),
  createRazorpayOrder: (orderId: string) =>
    apiFetch(`/orders/${orderId}/razorpay-order`, { method: 'POST' }),
  verifyRazorpayPayment: (orderId: string, data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    apiFetch(`/orders/${orderId}/verify-razorpay`, { method: 'POST', body: JSON.stringify(data) }),
  acceptQuotation: (orderId: string) =>
    apiFetch(`/orders/${orderId}/accept-quotation`, { method: 'PUT' }),
  rejectQuotation: (orderId: string) =>
    apiFetch(`/orders/${orderId}/reject-quotation`, { method: 'PUT' }),
};

// Admin Operations & Dashboard APIs
export const adminApi = {
  getAllOrders: () => apiFetch('/admin/orders'),
  getSchedule: (month?: string) => apiFetch(`/admin/schedule${month ? `?month=${month}` : ''}`),
  updateOrderStatus: (orderId: string, status: string) =>
    apiFetch(`/admin/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  sendQuotation: (orderId: string) =>
    apiFetch(`/admin/orders/${orderId}/send`, { method: 'PUT' }),
  confirmOrder: (orderId: string) =>
    apiFetch(`/admin/orders/${orderId}/confirm`, { method: 'PUT' }),
  createInvoice: (orderId: string) =>
    apiFetch(`/admin/orders/${orderId}/create-invoice`, { method: 'POST' }),
  getDashboardOverview: () => apiFetch('/admin/dashboard/overview'),
  getActiveRentals: () => apiFetch('/admin/dashboard/active-rentals'),
  getDueToday: () => apiFetch('/admin/dashboard/due-today'),
  getUpcomingPickups: (days: number = 7) => apiFetch(`/admin/dashboard/upcoming-pickups?days=${days}`),
  getUpcomingReturns: (days: number = 7) => apiFetch(`/admin/dashboard/upcoming-returns?days=${days}`),
  getOverdueRentals: () => apiFetch('/admin/dashboard/overdue-rentals'),
  getRevenue: (from?: string, to?: string) => {
    let query = '';
    if (from || to) {
      const q = new URLSearchParams();
      if (from) q.append('from', from);
      if (to) q.append('to', to);
      query = `?${q.toString()}`;
    }
    return apiFetch(`/admin/dashboard/revenue${query}`);
  },
  getPriorities: () => apiFetch('/admin/dashboard/priorities'),
  getRentalStatusSummary: () => apiFetch('/admin/dashboard/rental-status'),
  getRevenueSummary: (period: string = 'monthly') => apiFetch(`/admin/dashboard/revenue-summary?period=${period}`),
  getTopRentedProducts: (limit: number = 5) => apiFetch(`/admin/dashboard/top-products?limit=${limit}`),
};

// Invoice APIs
export const invoiceApi = {
  getInvoices: (status?: string) =>
    apiFetch(`/admin/invoices${status ? `?status=${status}` : ''}`),
  getInvoiceById: (id: string) => apiFetch(`/admin/invoices/${id}`),
  postInvoice: (id: string) => apiFetch(`/admin/invoices/${id}/post`, { method: 'PUT' }),
  updateInvoiceStatus: (id: string, data: { status?: string; payment_status?: string }) =>
    apiFetch(`/admin/invoices/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  registerPayment: (id: string, paymentAmount: number, paymentMethod: string = 'ONLINE') =>
    apiFetch(`/admin/invoices/${id}/register-payment`, { method: 'POST', body: JSON.stringify({ paymentAmount, paymentMethod }) }),
  refundDeposit: (orderId: string, refundAmount: number, note?: string) =>
    apiFetch(`/admin/orders/${orderId}/refund-deposit`, { method: 'POST', body: JSON.stringify({ refundAmount, note }) }),
};

// Quotation Template APIs
export const quotationTemplateApi = {
  getTemplates: () => apiFetch('/admin/quotation-templates'),
  getTemplateById: (id: string) => apiFetch(`/admin/quotation-templates/${id}`),
  createTemplate: (data: any) =>
    apiFetch('/admin/quotation-templates', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplate: (id: string, data: any) =>
    apiFetch(`/admin/quotation-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTemplate: (id: string) =>
    apiFetch(`/admin/quotation-templates/${id}`, { method: 'DELETE' }),
};

// Pricelist APIs
export const pricelistApi = {
  getPricelists: () => apiFetch('/admin/pricelists'),
  getPricelistById: (id: string) => apiFetch(`/admin/pricelists/${id}`),
  createPricelist: (data: any) =>
    apiFetch('/admin/pricelists', { method: 'POST', body: JSON.stringify(data) }),
  updatePricelist: (id: string, data: any) =>
    apiFetch(`/admin/pricelists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePricelist: (id: string) =>
    apiFetch(`/admin/pricelists/${id}`, { method: 'DELETE' }),
  addRule: (pricelistId: string, ruleData: any) =>
    apiFetch(`/admin/pricelists/${pricelistId}/rules`, { method: 'POST', body: JSON.stringify(ruleData) }),
  deleteRule: (pricelistId: string, ruleId: string) =>
    apiFetch(`/admin/pricelists/${pricelistId}/rules/${ruleId}`, { method: 'DELETE' }),
  calculatePrice: (data: { productId: string; quantity: number; basePrice: number; pricelistId?: string }) =>
    apiFetch('/admin/pricelists/calculate-price', { method: 'POST', body: JSON.stringify(data) }),
};

// Contact API
export const contactApi = {
  submitInquiry: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    category?: string;
    subject: string;
    message: string;
  }) => apiFetch('/contact', { method: 'POST', body: JSON.stringify(data) }),
};

