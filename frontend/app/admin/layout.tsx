"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, LayoutGrid, ChevronDown, User, Settings, LogOut, CheckCircle, AlertTriangle, Clock, X, AlertCircle } from 'lucide-react';
import { authApi, adminApi } from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);

  useEffect(() => {
    const getAdminProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token && typeof window !== 'undefined') {
        router.push('/login?redirect=/admin');
        return;
      }

      const res = await authApi.getProfile();
      let userObj = null;

      if (res.success && res.data) {
        userObj = res.data;
        setProfile(res.data);
      } else {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          try {
            userObj = JSON.parse(localUser);
            setProfile(userObj);
          } catch (e) {}
        }
      }

      // Role Protection Check: Block CUSTOMER accounts from /admin routes
      if (userObj && userObj.role === 'CUSTOMER' && typeof window !== 'undefined') {
        router.push('/');
      }
    };
    getAdminProfile();
  }, []);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    const res = await adminApi.getPriorities();
    setLoadingNotifications(false);

    if (res.success && res.data) {
      const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setNotifications(items);
    } else {
      setNotifications([]);
    }
  };

  const toggleNotifications = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const initial = profile?.name ? profile.name.charAt(0).toUpperCase() : 'A';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Header Navbar */}
      <header className="bg-[#CD2C58] text-white sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <img src="/image.png" alt="Logo" className="h-8 w-auto object-contain rounded bg-white/10 p-0.5" />
              <span className="font-bold text-lg tracking-tight">
                {profile?.role === 'VENDOR' ? 'Odoo Vendor' : 'Odoo Admin'}
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-1">
              
              {/* Dashboard Overview */}
              <Link href="/admin" className="px-3 py-2 text-sm font-bold rounded-md hover:bg-white/10 transition-colors">
                Dashboard
              </Link>
              
              {/* Super Admin Control link */}
              {profile?.role === 'SUPERADMIN' && (
                <Link href="/admin/super" className="px-3 py-2 text-sm font-bold bg-purple-900/50 text-yellow-300 border border-yellow-400/30 rounded-md hover:bg-purple-900 transition-colors flex items-center gap-1.5">
                  ★ Super Admin
                </Link>
              )}
              
              {/* Order Dropdown */}
              <div className="relative group">
                <Link href="/admin/orders" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer">
                  Order <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </Link>
                <div className="absolute left-0 top-full pt-1 hidden group-hover:block w-40">
                  <div className="bg-white rounded-md shadow-lg py-1 border border-gray-200">
                    <Link href="/admin/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">All Orders</Link>
                    <Link href="/admin/invoices" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Invoices</Link>
                    <Link href="/admin/customers" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Customers</Link>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <Link href="/admin/schedule" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors">
                Schedule
              </Link>
              
              {/* Product Dropdown */}
              <div className="relative group">
                <Link href="/admin/products" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer">
                  Product <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </Link>
                <div className="absolute left-0 top-full pt-1 hidden group-hover:block w-40">
                  <div className="bg-white rounded-md shadow-lg py-1 border border-gray-200">
                    <Link href="/admin/products" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Products</Link>
                    <Link href="/admin/pricelists" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Price List</Link>
                    <Link href="/admin/attributes" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Attributes</Link>
                    <Link href="/admin/rental-periods" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Rental Periods</Link>
                  </div>
                </div>
              </div>
              
              {/* Configuration Dropdown */}
              <div className="relative group">
                <Link href="/admin/settings" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer">
                  Configuration <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </Link>
                <div className="absolute left-0 top-full pt-1 hidden group-hover:block w-48">
                  <div className="bg-white rounded-md shadow-lg py-1 border border-gray-200">
                    <Link href="/admin/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                    <Link href="/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Users</Link>
                    <Link href="/admin/quotation-templates" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Templates</Link>
                  </div>
                </div>
              </div>
              
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-white/10 border-transparent text-white placeholder-white/60 text-sm rounded-full pl-9 pr-4 py-1.5 focus:bg-white/20 focus:outline-none transition-all w-48"
              />
            </div>
            
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={toggleNotifications}
                className="text-white/80 hover:text-white transition-colors relative p-1.5 rounded-full hover:bg-white/10"
                title="System Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border-2 border-[#CD2C58] animate-pulse"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  <div className="bg-[#CD2C58] text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      <span className="font-bold text-sm">Rental & Operational Alerts</span>
                    </div>
                    <button onClick={() => setShowNotifications(false)} className="hover:bg-white/20 p-1 rounded-full">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {loadingNotifications ? (
                      <div className="p-6 text-center text-sm text-gray-500">Loading alerts...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">No pending operational alerts.</div>
                    ) : (
                      notifications.map((n, idx) => {
                        const isHigh = n.priority === 'HIGH' || n.type === 'OVERDUE_RENTAL';
                        const title = n.type ? n.type.replace(/_/g, ' ') : (n.title || 'Rental Action Required');
                        return (
                          <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-3">
                            <div className={`p-2 rounded-full mt-0.5 ${isHigh ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                              {isHigh ? <AlertCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-xs text-gray-900 uppercase tracking-wide">{title}</span>
                                {n.order_number && (
                                  <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                                    {n.order_number}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {n.message || `Action required for order ${n.order_number || ''}`}
                              </p>
                              {n.customer_name && (
                                <p className="text-[11px] text-gray-400 mt-1">Customer: {n.customer_name}</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-2 bg-gray-50 text-center border-t border-gray-100">
                    <Link href="/admin/orders" onClick={() => setShowNotifications(false)} className="text-xs font-bold text-[#CD2C58] hover:underline">
                      View Operational Dashboard →
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* User Profile Avatar Dropdown */}
            <div className="relative group">
              <button className="w-8 h-8 rounded-full bg-white text-[#CD2C58] flex items-center justify-center text-sm font-bold shadow-sm border border-gray-200 hover:ring-2 hover:ring-white/50 transition-all">
                {initial}
              </button>
              
              <div className="absolute right-0 top-full pt-1 hidden group-hover:block w-52 z-50">
                <div className="bg-white rounded-xl shadow-xl py-2 border border-gray-200 divide-y divide-gray-100">
                  <div className="px-4 py-2">
                    <p className="text-xs text-gray-400 font-medium uppercase">Signed in as</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{profile?.name || 'Administrator'}</p>
                    <p className="text-xs text-gray-500 truncate">{profile?.email || 'admin@odoo.local'}</p>
                  </div>

                  <div className="py-1">
                    <Link href="/admin/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                      <User className="w-4 h-4 text-gray-400" /> Admin Profile
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                      <Settings className="w-4 h-4 text-gray-400" /> Admin Settings
                    </Link>
                  </div>

                  <div className="py-1">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                    >
                      <LogOut className="w-4 h-4 text-red-500" /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
