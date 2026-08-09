"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Trash2, ShoppingBag, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { cartApi } from '@/lib/api';

export default function WishlistPage() {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchWishlist = () => {
    setLoading(true);
    try {
      const items = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlistItems(Array.isArray(items) ? items : []);
    } catch (e) {
      setWishlistItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWishlist();
    const handleWishlistUpdate = () => fetchWishlist();
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
  }, []);

  const handleRemove = (id: string) => {
    const updated = wishlistItems.filter((item) => item.id !== id);
    setWishlistItems(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const handleAddToCart = async (item: any) => {
    const res = await cartApi.addItem({
      product_id: item.id,
      quantity: 1,
    });

    if (!res.success) {
      // Local storage cart fallback for guest mode
      try {
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = localCart.find((i: any) => i.id === item.id);
        if (existing) {
          existing.quantity = (existing.quantity || 1) + 1;
        } else {
          localCart.push({
            id: item.id,
            name: item.name,
            price: item.price || item.base_price,
            img: item.img || item.image_url,
            quantity: 1,
          });
        }
        localStorage.setItem('cart', JSON.stringify(localCart));
      } catch (err) {}
    }

    window.dispatchEvent(new Event('cartUpdated'));
    setMessage(`"${item.name}" added to cart! Redirecting to cart...`);
    handleRemove(item.id);
    setTimeout(() => {
      setMessage(null);
      router.push('/cart');
    }, 800);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500 min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#CD2C58] mr-2" /> Loading your wishlist...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 min-h-[calc(100vh-5rem)]">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-8 h-8 text-[#CD2C58] fill-[#CD2C58]" />
        <h1 className="text-3xl font-bold text-gray-900">My Wishlist ({wishlistItems.length})</h1>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <span>{message}</span>
        </div>
      )}

      {wishlistItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 text-sm mb-6">Explore our equipment catalog and save your favorite gear for later.</p>
          <Link href="/" className="px-6 py-3 bg-[#CD2C58] text-white font-bold rounded-xl hover:bg-[#b02248] transition-colors inline-block">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => {
            const price = Number(item.price || item.base_price || 0);
            const imgUrl = item.img || item.image_url || '';

            return (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="h-48 bg-gray-50 relative p-4 flex items-center justify-center">
                  {imgUrl ? (
                    <img src={imgUrl} alt={item.name} className="max-h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      <span className="text-xs font-medium text-gray-400">No Image</span>
                    </div>
                  )}
                  <button 
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-3 right-3 p-2 bg-white/80 rounded-full text-gray-400 hover:text-red-600 transition-colors shadow-sm"
                    title="Remove from Wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base mb-1">{item.name}</h3>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{item.description || 'Verified rental equipment'}</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-black text-[#CD2C58] text-xl">₹{price}</span>
                      <span className="text-xs text-gray-500 font-medium">/ day</span>
                    </div>

                    <button 
                      onClick={() => handleAddToCart(item)}
                      className="w-full py-2.5 bg-[#CD2C58] text-white rounded-lg font-bold text-sm hover:bg-[#b02248] transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" /> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
