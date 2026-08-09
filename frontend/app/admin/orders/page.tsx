"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, LayoutList, LayoutGrid, RefreshCw, Eye, CheckCircle2, AlertCircle, X, ChevronDown, Package } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function OrdersDashboard() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [activeRentals, setActiveRentals] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, allOrdersRes, activeRes] = await Promise.all([
        adminApi.getDashboardOverview(),
        adminApi.getAllOrders(),
        adminApi.getActiveRentals(),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      
      if (allOrdersRes.success && Array.isArray(allOrdersRes.data)) {
        setActiveRentals(allOrdersRes.data);
      } else if (activeRes.success && Array.isArray(activeRes.data)) {
        setActiveRentals(activeRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics from backend', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    setMessage(null);

    const res = await adminApi.updateOrderStatus(orderId, newStatus);
    setUpdatingId(null);

    if (res.success) {
      setMessage({ type: 'success', text: `Order status updated to ${newStatus} successfully.` });
      fetchDashboardData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to update order status.' });
    }
  };

  const filteredOrders = activeRentals.filter((order) => {
    const q = search.toLowerCase();
    const customerName = (order.customer?.name || order.Customer?.name || '').toLowerCase();
    const orderNum = (order.order_number || order.id || '').toLowerCase();
    const matchesSearch = customerName.includes(q) || orderNum.includes(q);
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { 
      label: 'Rental Revenue', 
      value: overview ? `₹${Number(overview.rental_revenue || 0).toLocaleString()}` : '₹0', 
      sub: 'Total successful' 
    },
    { 
      label: 'Active Rentals', 
      value: overview ? overview.active_rentals : activeRentals.length, 
      sub: 'Purchased & Active' 
    },
    { 
      label: 'Security Deposits Held', 
      value: overview ? `₹${Number(overview.security_deposits_held || 0).toLocaleString()}` : '₹0', 
      sub: 'In collateral trust' 
    },
    { 
      label: 'Overdue Rentals', 
      value: overview ? overview.overdue_rentals : 0, 
      sub: 'Action required', 
      isDanger: true 
    },
  ];

  const handleSendQuotation = async (orderId: string) => {
    setUpdatingId(orderId);
    setMessage(null);
    const res = await adminApi.sendQuotation(orderId);
    setUpdatingId(null);
    if (res.success) {
      setMessage({ type: 'success', text: 'Quotation sent successfully.' });
      fetchDashboardData();
      if (selectedOrder) setSelectedOrder({ ...selectedOrder, status: 'SENT' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to send quotation.' });
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    setUpdatingId(orderId);
    setMessage(null);
    const res = await adminApi.confirmOrder(orderId);
    setUpdatingId(null);
    if (res.success) {
      setMessage({ type: 'success', text: 'Order confirmed as Sale Order.' });
      fetchDashboardData();
      if (selectedOrder) setSelectedOrder({ ...selectedOrder, status: 'CONFIRMED' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to confirm order.' });
    }
  };

  const handleCreateInvoice = async (orderId: string) => {
    setUpdatingId(orderId);
    setMessage(null);
    const res = await adminApi.createInvoice(orderId);
    setUpdatingId(null);
    if (res.success) {
      setMessage({ type: 'success', text: 'Draft invoice created successfully! Redirecting...' });
      setTimeout(() => {
        window.location.href = '/admin/invoices';
      }, 1000);
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to create invoice.' });
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-[calc(100vh-3.5rem)]">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Rental Operations & Vendor Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time operational metrics & live customer order tracking.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={fetchDashboardData}
            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md shadow-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link href="/admin/products/new" className="px-4 py-2 bg-[#CD2C58] text-white text-sm font-medium rounded-md shadow-sm hover:bg-[#b02248] flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-black text-gray-900">{stat.value}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${stat.isDanger ? 'bg-red-50 text-red-600 font-bold' : 'bg-gray-100 text-gray-600'}`}>
                {stat.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3 rounded-t-xl border border-gray-200 border-b-0 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer orders or ID..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#CD2C58] focus:border-[#CD2C58]"
            />
          </div>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md text-sm px-3 py-2 bg-white focus:ring-1 focus:ring-[#CD2C58]"
          >
            <option value="ALL">All Statuses ({activeRentals.length})</option>
            <option value="DRAFT">DRAFT (Quotation)</option>
            <option value="SENT">SENT (Quotation Sent)</option>
            <option value="CONFIRMED">CONFIRMED (Sale Order)</option>
            <option value="PICKED_UP">PICKED_UP</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="RETURNED">RETURNED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 rounded-md flex items-center justify-center transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Table / Kanban View */}
      <div className="bg-white rounded-b-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            Loading customer rental orders from backend...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No customer orders found.
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Subtotal</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const customerName = order.customer?.name || order.Customer?.name || 'Customer';
                  const amount = Number(order.subtotal || order.total_amount || 0);
                  const orderDate = new Date(order.created_at || order.createdAt || Date.now()).toLocaleDateString();
                  const orderNum = order.order_number || (order.id ? order.id.slice(0, 8) : 'ORD');

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-[#CD2C58]">#{orderNum}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <div className="font-bold">{customerName}</div>
                          {(order.customer?.phone || order.phone) && (
                            <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                              📞 {order.customer?.phone || order.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">₹{amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          order.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'ACTIVE' || order.status === 'PICKED_UP' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'DRAFT' || order.status === 'SENT' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {orderDate}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            title="View Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <select 
                            disabled={updatingId === order.id}
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white font-bold focus:ring-1 focus:ring-[#CD2C58]"
                          >
                            <option value="DRAFT">DRAFT</option>
                            <option value="SENT">SENT</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="PICKED_UP">PICKED_UP</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="RETURNED">RETURNED</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 bg-gray-50 overflow-x-auto min-h-[400px]">
            <div className="flex gap-6 min-w-max">
              <div className="w-80 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">Customer Orders</h3>
                  <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                    {filteredOrders.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {filteredOrders.map((order) => {
                    const customerName = order.customer?.name || order.Customer?.name || 'Customer';
                    const amount = Number(order.subtotal || order.total_amount || 0);
                    const orderNum = order.order_number || (order.id ? order.id.slice(0, 8) : 'ORD');

                    return (
                      <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-[#CD2C58] text-sm">#{orderNum}</span>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{order.status}</span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">{customerName}</h4>
                        <div className="text-xs text-gray-500 font-semibold mb-3">Subtotal: ₹{amount.toFixed(2)}</div>
                        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="text-xs font-bold text-[#CD2C58] hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Odoo-style Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Rental Order #{selectedOrder.order_number || selectedOrder.id.slice(0, 8)}</h3>
                <span className="text-xs text-gray-500">Customer Details & Lifecycle Actions</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Odoo Progress Pipeline Bar */}
            <div className="mb-6 bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-1 overflow-x-auto text-xs font-bold">
              {['DRAFT', 'SENT', 'CONFIRMED', 'PICKED_UP', 'RETURNED'].map((step, idx) => {
                const stepLabels: Record<string, string> = {
                  DRAFT: '1. Draft Quotation',
                  SENT: '2. Quotation Sent',
                  CONFIRMED: '3. Sale Order',
                  PICKED_UP: '4. Picked Up',
                  RETURNED: '5. Returned',
                };

                const currentIdx = ['DRAFT', 'SENT', 'CONFIRMED', 'READY_FOR_PICKUP', 'PICKED_UP', 'ACTIVE', 'RETURN_PENDING', 'RETURNED', 'COMPLETED'].indexOf(selectedOrder.status);
                const stepIdx = ['DRAFT', 'SENT', 'CONFIRMED', 'PICKED_UP', 'RETURNED'].indexOf(step);
                const isActive = stepIdx <= (currentIdx >= 0 ? currentIdx : 0);

                return (
                  <div key={step} className={`px-3 py-1.5 rounded-lg flex-1 text-center whitespace-nowrap transition-all ${
                    isActive ? 'bg-[#CD2C58] text-white shadow-sm' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {stepLabels[step]}
                  </div>
                );
              })}
            </div>

            {/* Odoo Action Buttons Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-gray-100 pb-4">
              <button
                disabled={updatingId === selectedOrder.id}
                onClick={() => handleSendQuotation(selectedOrder.id)}
                className="px-3 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-purple-700 transition-colors"
              >
                ✉️ Send by Email
              </button>
              <button
                disabled={updatingId === selectedOrder.id}
                onClick={() => handleConfirmOrder(selectedOrder.id)}
                className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-700 transition-colors"
              >
                ✅ Confirm
              </button>
              <button
                disabled={updatingId === selectedOrder.id}
                onClick={() => handleCreateInvoice(selectedOrder.id)}
                className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
              >
                📄 Create Invoice
              </button>
              <button
                disabled={updatingId === selectedOrder.id}
                onClick={() => handleStatusChange(selectedOrder.id, 'PICKED_UP')}
                className="px-3 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-amber-700 transition-colors"
              >
                📦 Pickup
              </button>
              <button
                disabled={updatingId === selectedOrder.id}
                onClick={() => handleStatusChange(selectedOrder.id, 'RETURNED')}
                className="px-3 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-teal-700 transition-colors"
              >
                🔄 Return
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-200 transition-colors ml-auto"
              >
                🖨️ Print
              </button>
            </div>

            {/* Order Details Grid */}
            <div className="space-y-4 text-sm mb-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-gray-900 text-sm">
                    👤 {selectedOrder.customer?.name || selectedOrder.Customer?.name || 'Customer'}
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">
                    {selectedOrder.customer?.role || 'CUSTOMER'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                  {(selectedOrder.customer?.email || selectedOrder.Customer?.email) && (
                    <div className="flex items-center gap-1.5 font-medium">
                      ✉️ {selectedOrder.customer?.email || selectedOrder.Customer?.email}
                    </div>
                  )}

                  {(selectedOrder.customer?.phone || selectedOrder.phone) && (
                    <div className="flex items-center gap-1.5 font-bold text-gray-900">
                      📞 <a href={`tel:${selectedOrder.customer?.phone || selectedOrder.phone}`} className="hover:text-[#CD2C58] underline">
                        {selectedOrder.customer?.phone || selectedOrder.phone}
                      </a>
                    </div>
                  )}
                </div>

                {(selectedOrder.delivery_address || selectedOrder.customer?.address) && (
                  <div className="text-xs text-gray-700 pt-2 font-medium border-t border-gray-200/60 mt-1">
                    📍 <span className="font-bold text-gray-900">Delivery & Contact Address:</span>{' '}
                    {selectedOrder.delivery_address || selectedOrder.customer?.address}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-gray-700">
                <span>Fulfillment Method:</span>
                <span className="font-bold">{selectedOrder.delivery_method || 'Standard'}</span>
              </div>

              <div className="flex justify-between items-center text-gray-700">
                <span>Order Status:</span>
                <span className="font-bold text-[#CD2C58]">{selectedOrder.status}</span>
              </div>

              <div className="flex justify-between items-center text-gray-700">
                <span>Subtotal Amount:</span>
                <span className="font-black text-gray-900 text-lg">₹{Number(selectedOrder.subtotal || selectedOrder.total_amount || 0).toFixed(2)}</span>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <div className="font-bold text-gray-900 mb-2 text-xs uppercase tracking-wider">Rented Items ({selectedOrder.items.length})</div>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedOrder.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded">
                        <span className="font-semibold text-gray-800">{item.product_name || item.product?.name || 'Equipment Item'}</span>
                        <span className="font-bold text-gray-900">Qty: {item.quantity} | ₹{item.total_price || item.unit_price || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
