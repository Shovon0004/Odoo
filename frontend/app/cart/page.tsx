"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { cartApi } from '@/lib/api';

export default function Cart() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    setLoading(true);
    let items: any[] = [];
    
    // 1. Fetch from backend API
    const res = await cartApi.getCart();
    if (res.success && res.data) {
      const backendItems = res.data.CartItems || res.data.items || [];
      items = [...backendItems];
    }

    // 2. Fetch local storage cart (for guest fallback)
    try {
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (Array.isArray(localCart) && localCart.length > 0) {
        localCart.forEach((lItem: any) => {
          const exists = items.some((bItem) => (bItem.product_id === lItem.id || bItem.id === lItem.id));
          if (!exists) {
            items.push(lItem);
          }
        });
      }
    } catch (e) {}

    setCartItems(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();

    const handleCartUpdate = () => fetchCart();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    
    await cartApi.updateItem(itemId, newQty);
    
    // Update local cart if present
    try {
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (Array.isArray(localCart)) {
        const target = localCart.find((i: any) => i.id === itemId);
        if (target) {
          target.quantity = newQty;
          localStorage.setItem('cart', JSON.stringify(localCart));
        }
      }
    } catch (e) {}

    fetchCart();
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleRemove = async (itemId: string) => {
    await cartApi.removeItem(itemId);

    // Remove from local cart if present
    try {
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (Array.isArray(localCart)) {
        const updated = localCart.filter((i: any) => i.id !== itemId);
        localStorage.setItem('cart', JSON.stringify(updated));
      }
    } catch (e) {}

    fetchCart();
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const p = Number(item.price || item.unit_price || item.product?.base_price || item.base_price || 0);
    return acc + (p * (item.quantity || 1));
  }, 0);

  const deliveryFee = subtotal > 0 ? 500 : 0;
  const deposit = subtotal > 0 ? 1000 : 0;
  const total = subtotal + deliveryFee + deposit;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500 min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#CD2C58] mr-2" /> Loading your rental cart...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 min-h-[calc(100vh-5rem)]">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart ({cartItems.length})</h1>
      
      {cartItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-6">Browse our live rental catalog to add equipment.</p>
          <Link href="/" className="px-6 py-3 bg-[#CD2C58] text-white font-bold rounded-xl hover:bg-[#b02248] transition-colors inline-block">
            Browse Rentals
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            {cartItems.map((item) => {
              const itemPrice = Number(item.price || item.unit_price || item.product?.base_price || item.base_price || 0);
              const imgUrl = item.product?.image_url || item.img || item.image_url || item.ProductVariant?.Product?.image_url || '';
              const name = item.product?.name || item.name || item.product_name || item.ProductVariant?.Product?.name || 'Rental Equipment';

              return (
                <div key={item.id} className="flex gap-4 pb-6 border-b border-gray-100 last:border-0 last:pb-0 items-center">
                  <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-gray-50 border border-gray-200 shrink-0 flex items-center justify-center">
                    {imgUrl ? (
                      <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-base">{name}</h3>
                    
                    {/* Dynamic Rental Period & Dates Display */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-50 border border-pink-100 text-[#CD2C58] rounded-lg text-xs font-semibold my-1.5">
                      <span className="font-bold">Rental Term:</span>
                      {item.start_date && item.end_date ? (
                        <span>{item.start_date} to {item.end_date}</span>
                      ) : (
                        <span>{item.rental_period || item.period || '1 Day Rental Period'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button 
                          onClick={() => handleUpdateQty(item.id, (item.quantity || 1) - 1)}
                          className="px-2.5 py-1 text-sm font-bold text-gray-600 hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-sm font-bold text-gray-900">{item.quantity || 1}</span>
                        <button 
                          onClick={() => handleUpdateQty(item.id, (item.quantity || 1) + 1)}
                          className="px-2.5 py-1 text-sm font-bold text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col justify-between h-full">
                    <div className="font-black text-[#CD2C58] text-lg">₹{itemPrice * (item.quantity || 1)}</div>
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1 self-end mt-4"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 text-sm border-b border-gray-100 pb-4">
              <div className="flex justify-between text-gray-600">
                <span>Rental Subtotal</span>
                <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className="font-medium text-gray-900">₹{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Refundable Deposit</span>
                <span className="font-medium text-gray-900">₹{deposit.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex justify-between text-lg font-black text-gray-900 pt-2">
              <span>Total Amount</span>
              <span className="text-[#CD2C58]">₹{total.toFixed(2)}</span>
            </div>

            <Link 
              href="/checkout" 
              className="w-full mt-6 bg-[#CD2C58] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#b02248] transition-colors shadow-lg shadow-[#CD2C58]/30"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
