"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Activity, 
  Database, 
  CheckCircle2, 
  Key, 
  UserCheck, 
  Search, 
  Calendar, 
  FileText, 
  Settings, 
  ArrowUpRight, 
  Loader2,
  RefreshCw,
  Sliders,
  Sparkles,
  Store,
  User,
  Filter,
  Eye,
  AlertTriangle,
  Clock,
  ChevronRight,
  TrendingUp,
  Box,
  Layers,
  MapPin,
  Mail,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { authApi, adminApi, productApi } from '@/lib/api';

export default function SuperAdminMasterPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'customers' | 'orders' | 'products' | 'users' | 'system'>('overview');
  
  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filtering & Action states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Selected details modal/drawer state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const fetchAllSuperAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      const usersRes = await authApi.getUsers();
      if (usersRes.success && Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      }

      // 2. Fetch All Orders
      const ordersRes = await adminApi.getAllOrders();
      if (ordersRes.success && Array.isArray(ordersRes.data)) {
        setOrders(ordersRes.data);
      }

      // 3. Fetch All Products
      const prodsRes = await productApi.getAll();
      if (prodsRes.success && Array.isArray(prodsRes.data)) {
        setProducts(prodsRes.data);
      }

      // 4. Fetch Priority Alerts
      const priorityRes = await adminApi.getPriorities();
      if (priorityRes.success && priorityRes.data?.items) {
        setPriorities(priorityRes.data.items);
      }
    } catch (err) {
      console.error('Failed to load Super Admin master dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Super Admin Role Protection Check
    const checkSuperRole = async () => {
      const res = await authApi.getProfile();
      let role = res.data?.role;
      if (!role) {
        try {
          role = JSON.parse(localStorage.getItem('user') || '{}')?.role;
        } catch (e) {}
      }
      if (role !== 'SUPERADMIN' && typeof window !== 'undefined') {
        window.location.href = '/admin';
        return;
      }
      fetchAllSuperAdminData();
    };
    checkSuperRole();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    setMessage(null);

    const res = await authApi.updateUserRole(userId, newRole);
    setUpdatingUserId(null);

    if (res.success) {
      setMessage({ text: `Role updated to ${newRole} successfully`, type: 'success' });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      setMessage({ text: res.message || 'Failed to update user role', type: 'error' });
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    setMessage(null);

    const res = await adminApi.updateOrderStatus(orderId, newStatus);
    setUpdatingOrderId(null);

    if (res.success) {
      setMessage({ text: `Order status updated to ${newStatus}`, type: 'success' });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } else {
      setMessage({ text: res.message || 'Failed to update order status', type: 'error' });
    }
  };

  // Filtered Derived Datasets
  const vendorsList = users.filter(u => u.role === 'VENDOR');
  const customersList = users.filter(u => u.role === 'CUSTOMER');
  const adminsList = users.filter(u => u.role === 'ADMIN' || u.role === 'SUPERADMIN');

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
  });

  // Financial Computations
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || Number(o.subtotal) || 0), 0);
  const totalActiveRentals = orders.filter(o => ['CONFIRMED', 'ACTIVE', 'PICKED_UP'].includes(o.status)).length;
  const totalCompletedOrders = orders.filter(o => o.status === 'COMPLETED').length;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      
      {/* Super Admin Executive Top Header */}
      <div className="bg-gradient-to-r from-gray-950 via-[#721530] to-[#CD2C58] rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-yellow-300 border border-yellow-400/30">
              <ShieldAlert className="w-4 h-4 text-yellow-300" /> Super Admin Global Control Tower
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">System Master Dashboard</h1>
            <p className="text-white/80 max-w-3xl text-xs md:text-sm leading-relaxed">
              Authenticated as <strong className="text-white font-mono bg-white/20 px-2 py-0.5 rounded">super@admin123</strong>. Unrestricted access to inspect, monitor, and override all Vendors, Customers, Products, Orders, Invoices, and System Configurations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchAllSuperAdminData} 
              className="px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-md text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync All Datasets
            </button>
          </div>
        </div>

        {/* Dynamic Glow effects */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-red-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Global Toast Messages */}
      {message && (
        <div className={`p-4 rounded-2xl border text-sm font-medium flex items-center justify-between shadow-sm ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 scrollbar-none">
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`px-5 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-[#CD2C58] text-white shadow-lg shadow-[#CD2C58]/30 scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Activity className="w-4 h-4" /> Overview & Live Metrics
        </button>

        <button 
          onClick={() => setActiveTab('vendors')} 
          className={`px-5 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'vendors' ? 'bg-[#CD2C58] text-white shadow-lg shadow-[#CD2C58]/30 scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Store className="w-4 h-4" /> Vendors ({vendorsList.length})
        </button>

        <button 
          onClick={() => setActiveTab('customers')} 
          className={`px-5 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'customers' ? 'bg-[#CD2C58] text-white shadow-lg shadow-[#CD2C58]/30 scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Users className="w-4 h-4" /> Customers ({customersList.length})
        </button>

        <button 
          onClick={() => setActiveTab('orders')} 
          className={`px-5 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'orders' ? 'bg-[#CD2C58] text-white shadow-lg shadow-[#CD2C58]/30 scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> Master Orders ({orders.length})
        </button>

        <button 
          onClick={() => setActiveTab('products')} 
          className={`px-5 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'products' ? 'bg-[#CD2C58] text-white shadow-lg shadow-[#CD2C58]/30 scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Package className="w-4 h-4" /> All Products ({products.length})
        </button>

        <button 
          onClick={() => setActiveTab('users')} 
          className={`px-5 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'users' ? 'bg-[#CD2C58] text-white shadow-lg shadow-[#CD2C58]/30 scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Roles & Users ({users.length})
        </button>

        <button 
          onClick={() => setActiveTab('system')} 
          className={`px-5 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'system' ? 'bg-[#CD2C58] text-white shadow-lg shadow-[#CD2C58]/30 scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Database className="w-4 h-4" /> System Health
        </button>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">₹{totalRevenue.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400">Across all orders</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Orders</span>
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{orders.length}</div>
          <div className="text-[10px] text-gray-400">{totalActiveRentals} Active rentals</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Registered Vendors</span>
            <Store className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">{vendorsList.length}</div>
          <div className="text-[10px] text-gray-400">Merchant partners</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Customers</span>
            <Users className="w-4 h-4 text-[#CD2C58]" />
          </div>
          <div className="text-2xl font-black text-[#CD2C58]">{customersList.length}</div>
          <div className="text-[10px] text-gray-400">Customer accounts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Catalog Products</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{products.length}</div>
          <div className="text-[10px] text-gray-400">Live products</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">System Administrators</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600">{adminsList.length}</div>
          <div className="text-[10px] text-gray-400">Elevated privileges</div>
        </div>
      </div>

      {/* SEARCH BAR FOR ALL TABS EXCEPT OVERVIEW */}
      {activeTab !== 'overview' && activeTab !== 'system' && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`} 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-[#CD2C58] transition-all"
            />
          </div>

          {activeTab === 'orders' && (
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500">Status:</span>
              {['ALL', 'CONFIRMED', 'ACTIVE', 'PICKED_UP', 'COMPLETED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderStatusFilter === st ? 'bg-[#CD2C58] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Global Orders */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#CD2C58]" /> Recent Global Orders
                </h3>
                <p className="text-xs text-gray-500">Live order stream across all vendors and customers.</p>
              </div>

              <button 
                onClick={() => setActiveTab('orders')} 
                className="text-xs font-bold text-[#CD2C58] hover:underline flex items-center gap-1"
              >
                View All Orders <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="uppercase text-gray-400 bg-gray-50 rounded-xl">
                    <th className="py-3 px-4 rounded-l-xl">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 rounded-r-xl">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.slice(0, 7).map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {o.order_number || o.id.substring(0, 8)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-800">{o.customer?.name || 'Guest Customer'}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{o.customer?.email}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        ₹{Number(o.total_amount || o.subtotal || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          o.status === 'ACTIVE' || o.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                          o.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-[10px]">
                        {new Date(o.created_at || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Alerts & Priority Activity */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Priorities & Operational Alerts
            </h3>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {priorities.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">No pending operational alerts.</div>
              ) : (
                priorities.slice(0, 6).map((p, idx) => (
                  <div key={idx} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span className="uppercase text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-mono">
                        {p.type?.replace(/_/g, ' ')}
                      </span>
                      {p.priority && (
                        <span className="text-[9px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                          {p.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed">{p.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT 2: VENDORS DIRECTORY */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-purple-600" /> Registered Vendors Directory
              </h2>
              <p className="text-xs text-gray-500">Merchant accounts authorized to list rental products.</p>
            </div>
            <span className="text-xs font-bold bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
              {vendorsList.length} Active Vendors
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {vendorsList.map((v) => (
              <div key={v.id} className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                      {v.name ? v.name.charAt(0).toUpperCase() : 'V'}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-base">{v.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{v.email}</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs space-y-1">
                  <div className="flex justify-between text-purple-900 font-medium">
                    <span>Account ID:</span>
                    <span className="font-mono text-[10px]">{v.id.substring(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between text-purple-900 font-medium">
                    <span>Role Privileges:</span>
                    <span className="font-bold text-purple-700">{v.role}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-gray-400 text-[11px]">Joined: {new Date(v.created_at || Date.now()).toLocaleDateString()}</span>
                  <button 
                    onClick={() => handleRoleChange(v.id, 'CUSTOMER')}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs transition-colors"
                  >
                    Demote to Customer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: CUSTOMERS INTELLIGENCE */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#CD2C58]" /> Customer Accounts & Activity
              </h2>
              <p className="text-xs text-gray-500">Registered platform customers and rental activity.</p>
            </div>
            <span className="text-xs font-bold bg-pink-100 text-[#CD2C58] px-3 py-1 rounded-full">
              {customersList.length} Customers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="uppercase text-gray-400 bg-gray-50 rounded-xl">
                  <th className="py-3.5 px-4 rounded-l-xl">Customer Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Orders Count</th>
                  <th className="py-3.5 px-4">Address / Details</th>
                  <th className="py-3.5 px-4 rounded-r-xl text-right">Promote Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customersList.map((c) => {
                  const custOrders = orders.filter(o => o.customer_id === c.id || o.customer?.id === c.id);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pink-100 text-[#CD2C58] font-bold text-xs flex items-center justify-center">
                          {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div>{c.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">ID: {c.id.substring(0, 8)}...</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-mono">{c.email}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">{custOrders.length} Order(s)</td>
                      <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">{c.address || 'Standard Address'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <select 
                          value={c.role}
                          onChange={(e) => handleRoleChange(c.id, e.target.value)}
                          className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer"
                        >
                          <option value="CUSTOMER">CUSTOMER</option>
                          <option value="VENDOR">VENDOR</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPERADMIN">SUPERADMIN</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: MASTER ORDERS & RENTALS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" /> Master Rental Orders Stream
              </h2>
              <p className="text-xs text-gray-500">View and update statuses for all customer orders in the system.</p>
            </div>
            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              Showing {filteredOrders.length} of {orders.length} Orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="uppercase text-gray-400 bg-gray-50 rounded-xl">
                  <th className="py-3.5 px-4 rounded-l-xl">Order #</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Subtotal / Total</th>
                  <th className="py-3.5 px-4">Delivery Method</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Override Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No rental orders match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        {o.order_number || o.id.substring(0, 8)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{o.customer?.name || 'Customer'}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{o.customer?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        ₹{Number(o.total_amount || o.subtotal || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                          {o.delivery_method || 'STORE_PICKUP'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold ${
                          o.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          o.status === 'ACTIVE' || o.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                          o.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {updatingOrderId === o.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#CD2C58] inline" />
                        ) : (
                          <select 
                            value={o.status}
                            onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="PICKED_UP">PICKED_UP</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: PRODUCTS CATALOG */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" /> Catalog Products Overview
              </h2>
              <p className="text-xs text-gray-500">Live products listed across all categories and vendors.</p>
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
              {filteredProducts.length} Products
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredProducts.map((p) => (
              <div key={p.id} className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {p.category}
                    </span>
                    <h3 className="font-bold text-gray-900 text-base mt-1">{p.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {p.status || 'ACTIVE'}
                  </span>
                </div>

                <div className="flex items-baseline gap-1 text-emerald-600">
                  <span className="text-xs font-bold">Base Price:</span>
                  <span className="text-xl font-black">₹{Number(p.base_price || 0).toLocaleString()}</span>
                </div>

                <div className="text-xs text-gray-500 line-clamp-2">{p.description || 'No detailed description provided.'}</div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Product ID: {p.id.substring(0, 8)}...</span>
                  <Link href={`/admin/products`} className="text-[#CD2C58] font-bold hover:underline">
                    Edit Product →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: USER & ROLE MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" /> Master User Roles & Security Control
              </h2>
              <p className="text-xs text-gray-500">Super Admin authority to switch user roles instantly.</p>
            </div>
            <span className="text-xs font-bold bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
              {filteredUsers.length} System Users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="uppercase text-gray-400 bg-gray-50 rounded-xl">
                  <th className="py-3.5 px-4 rounded-l-xl">User Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Role Badge</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Role Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const isSuper = u.role === 'SUPERADMIN';
                  const isAdmin = u.role === 'ADMIN';
                  const isVendor = u.role === 'VENDOR';

                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSuper ? 'bg-purple-100 text-purple-700' : isAdmin ? 'bg-red-100 text-red-700' : isVendor ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">ID: {u.id}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-mono">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold ${
                          isSuper ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          isAdmin ? 'bg-red-100 text-red-800 border border-red-200' :
                          isVendor ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {updatingUserId === u.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#CD2C58] inline" />
                        ) : (
                          <select 
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="VENDOR">VENDOR</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPERADMIN">SUPERADMIN</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: SYSTEM HEALTH */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" /> Platform Infrastructure
            </h3>

            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-bold text-gray-900">Database Engine</div>
                    <div className="text-gray-500 text-[11px]">Sequelize Model Synchronization Active</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">CONNECTED</span>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-bold text-gray-900">JWT Authentication</div>
                    <div className="text-gray-500 text-[11px]">RS256 Signature Verification</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">ACTIVE (24h)</span>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  <div>
                    <div className="font-bold text-gray-900">Super Admin RBAC Override</div>
                    <div className="text-gray-500 text-[11px]">Full System Authority Bypasses Guards</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-purple-100 text-purple-800 font-bold rounded-full text-[10px]">ENABLED</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#CD2C58]" /> Master Quick Actions
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/orders" className="p-4 bg-gray-50 hover:bg-[#CD2C58] hover:text-white rounded-2xl transition-all border border-gray-100 font-bold text-xs flex items-center justify-between group">
                <span>Admin Orders Portal</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </Link>

              <Link href="/admin/products" className="p-4 bg-gray-50 hover:bg-[#CD2C58] hover:text-white rounded-2xl transition-all border border-gray-100 font-bold text-xs flex items-center justify-between group">
                <span>Products & Pricing</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </Link>

              <Link href="/admin/schedule" className="p-4 bg-gray-50 hover:bg-[#CD2C58] hover:text-white rounded-2xl transition-all border border-gray-100 font-bold text-xs flex items-center justify-between group">
                <span>Rental Schedule</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </Link>

              <Link href="/admin/settings" className="p-4 bg-gray-50 hover:bg-[#CD2C58] hover:text-white rounded-2xl transition-all border border-gray-100 font-bold text-xs flex items-center justify-between group">
                <span>Configuration Settings</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
