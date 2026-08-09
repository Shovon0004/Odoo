"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Heart, ShoppingCart, User, ChevronDown } from "lucide-react";
import { cartApi, authApi } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [cartCount, setCartCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/vendor-register" || pathname === "/forgot-password";
  const isAdminPage = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAuthPage || isAdminPage) return;

    const syncUser = async () => {
      try {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          setUserProfile(JSON.parse(localUser));
        }
        const res = await authApi.getProfile();
        if (res.success && res.data) {
          setUserProfile(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        }
      } catch (err) {}
    };

    syncUser();

    const syncCounts = async () => {
      // Cart count
      let cCount = 0;
      const res = await cartApi.getCart();
      if (res.success && res.data) {
        const items = res.data.CartItems || res.data.items || [];
        cCount = items.length;
      }
      
      try {
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (Array.isArray(localCart)) {
          cCount = Math.max(cCount, localCart.length);
        }
      } catch (e) {}

      setCartCount(cCount);

      // Wishlist count
      try {
        const localWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setWishlistCount(Array.isArray(localWishlist) ? localWishlist.length : 0);
      } catch (e) {
        setWishlistCount(0);
      }
    };

    syncCounts();

    const handleStorageChange = () => {
      syncCounts();
      syncUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wishlistUpdated', handleStorageChange);
    window.addEventListener('cartUpdated', handleStorageChange);
    window.addEventListener('userUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wishlistUpdated', handleStorageChange);
      window.removeEventListener('cartUpdated', handleStorageChange);
      window.removeEventListener('userUpdated', handleStorageChange);
    };
  }, [pathname, isAuthPage, isAdminPage]);

  if (isAuthPage || isAdminPage) {
    return null;
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
      router.push(`/?q=${e.currentTarget.value.trim()}`);
    } else if (e.key === 'Enter') {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo and Left Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <img src="/image.png" alt="Odoo Rentals Logo" className="h-10 w-auto object-contain rounded-lg" />
            <span className="text-xl font-black text-[#CD2C58] tracking-tight hidden sm:inline">Odoo Rentals</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-600 hover:text-[#CD2C58] font-medium transition-colors">Products</Link>
            <Link href="/terms" className="text-gray-600 hover:text-[#CD2C58] font-medium transition-colors">Terms & Condition</Link>
            <Link href="/about" className="text-gray-600 hover:text-[#CD2C58] font-medium transition-colors">About us</Link>
            <Link href="/contact" className="text-gray-600 hover:text-[#CD2C58] font-medium transition-colors">Contact Us</Link>
          </nav>
        </div>

        {/* Middle Search */}
        <div className="flex-1 max-w-md mx-8 hidden lg:block">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search products, cameras, drones..." 
              onKeyDown={handleSearch}
              className="w-full bg-gray-100 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E06B80] focus:bg-white transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#CD2C58]" />
          </div>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-6">
          <Link href="/wishlist" className="text-gray-600 hover:text-[#CD2C58] transition-colors relative" title="Wishlist">
            <Heart className="w-6 h-6" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-[#CD2C58] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="text-gray-600 hover:text-[#CD2C58] transition-colors relative" title="Shopping Cart">
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-[#CD2C58] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <div className="relative group cursor-pointer">
            <div className="flex items-center gap-2 text-gray-700 hover:text-[#CD2C58] font-medium transition-colors">
              <div className="w-9 h-9 rounded-full bg-[#FFE6D4] text-[#CD2C58] flex items-center justify-center overflow-hidden border border-pink-200 shrink-0">
                {userProfile?.profile_image ? (
                  <img src={userProfile.profile_image} alt={userProfile.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <span className="hidden sm:inline font-semibold">{userProfile?.name ? userProfile.name.split(' ')[0] : 'My Account'}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 text-xs">
                <span className="font-bold text-gray-900 block">{userProfile?.name || 'Account'}</span>
                <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider">{userProfile?.role || 'CUSTOMER'}</span>
              </div>

              {(userProfile?.role === 'VENDOR' || userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPERADMIN') && (
                <>
                  <Link href="/admin" className="px-4 py-2 text-sm font-bold text-[#CD2C58] bg-pink-50/50 hover:bg-pink-100/60">
                    ⚙️ Vendor Dashboard
                  </Link>
                  <Link href="/admin/products" className="px-4 py-2 text-sm font-bold text-purple-700 bg-purple-50/50 hover:bg-purple-100/60">
                    📦 Product Inventory
                  </Link>
                </>
              )}

              <Link 
                href={(userProfile?.role === 'VENDOR' || userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPERADMIN') ? "/admin/profile" : "/profile"} 
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#CD2C58]"
              >
                My Profile
              </Link>
              <Link href="/wallet" className="px-4 py-2 text-sm text-gray-700 font-semibold hover:bg-gray-50 hover:text-[#CD2C58]">💳 Digital Wallet</Link>
              <Link href="/orders" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#CD2C58]">My Orders & Quotations</Link>
              <Link href="/settings" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#CD2C58]">Settings</Link>
              <div className="h-px bg-gray-100 my-2"></div>
              <Link href="/login" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); }} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
