"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, ChevronRight, Check, Heart, X, Loader2, ShoppingBag, AlertTriangle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { catalogApi, cartApi } from "@/lib/api";

function CatalogContent() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(5000);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q')?.toLowerCase() || '';
  const categoryParam = searchParams.get('category');

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }
  }, [categoryParam]);

  useEffect(() => {
    // Mandatory auth guard
    const token = localStorage.getItem('token');
    if (!token && typeof window !== 'undefined') {
      router.push('/login');
      return;
    }

    const loadProducts = async () => {
      setLoading(true);
      const res = await catalogApi.getProducts();
      setLoading(false);
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.base_price) || 1500,
          period: 'day',
          img: p.image_url || '',
          variants: ['Standard'],
          stock: p.status === 'ACTIVE' && p.is_active !== false,
          status: p.status || (p.is_active !== false ? 'ACTIVE' : 'INACTIVE'),
          category: p.category || 'Furniture',
          description: p.description || '',
        }));
        setProducts(mapped);
      }
    };
    loadProducts();

    // Sync initial wishlist
    try {
      const list = JSON.parse(localStorage.getItem('wishlist') || '[]');
      if (Array.isArray(list)) {
        setWishlistIds(list.map((item: any) => item.id));
      }
    } catch (e) {}
  }, []);

  const toggleWishlist = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let list: any[] = [];
    try {
      list = JSON.parse(localStorage.getItem('wishlist') || '[]');
      if (!Array.isArray(list)) list = [];
    } catch (err) {
      list = [];
    }

    const exists = list.some((item) => item.id === product.id);
    let updated = [];
    if (exists) {
      updated = list.filter((item) => item.id !== product.id);
    } else {
      updated = [...list, product];
    }

    localStorage.setItem('wishlist', JSON.stringify(updated));
    setWishlistIds(updated.map((item) => item.id));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const handleQuickAdd = async (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.stock) return;

    const res = await cartApi.addItem({
      product_id: product.id,
      quantity: 1,
    });

    if (!res.success) {
      try {
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = localCart.find((i: any) => i.id === product.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          localCart.push({ ...product, quantity: 1 });
        }
        localStorage.setItem('cart', JSON.stringify(localCart));
      } catch (err) {}
    }

    window.dispatchEvent(new Event('cartUpdated'));
    router.push('/cart');
  };

  const toggleCategory = (category: string) => setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  const toggleBrand = (brand: string) => setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedDurations([]);
    setHideOutOfStock(false);
    setMinPrice(0);
    setMaxPrice(5000);
    if (query || categoryParam) {
      router.push('/');
    }
  };

  const categoriesList = ['Furniture', 'Electronics', 'Photography', 'Office', 'Vehicles'];

  const matchCategory = (prodCat: string, filterCat: string) => {
    if (!prodCat) return false;
    const pCat = prodCat.toLowerCase();
    const fCat = filterCat.toLowerCase();
    if (pCat === fCat) return true;
    if (fCat === 'photography' && (pCat === 'cameras' || pCat === 'camera' || pCat === 'photography')) return true;
    if (fCat === 'electronics' && (pCat === 'electronics' || pCat === 'gadgets')) return true;
    return false;
  };

  const filteredProducts = products.filter(p => {
    if (query && !p.name.toLowerCase().includes(query)) return false;
    if (selectedCategories.length > 0 && !selectedCategories.some(cat => matchCategory(p.category, cat))) return false;
    if (selectedBrands.length > 0 && !selectedBrands.some(b => p.name.includes(b))) return false;
    if (p.price < minPrice || p.price > maxPrice) return false;
    if (hideOutOfStock && !p.stock) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-[#CD2C58]">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Rental Catalog</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
              <button 
                onClick={clearAllFilters}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 h-8 px-3 text-gray-500"
              >
                <X className="w-4 h-4 mr-1.5" />
                Clear all
              </button>
            </div>
            
            {/* Category Filter */}
            <div className="border-t border-gray-200 py-6">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {categoriesList.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  const count = products.filter(p => matchCategory(p.category, cat)).length;

                  return (
                    <label key={cat} className="flex items-center justify-between cursor-pointer group" onClick={(e) => { e.preventDefault(); toggleCategory(cat); }}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#CD2C58] border-[#CD2C58]' : 'border-gray-300 group-hover:border-[#CD2C58]'}`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`text-sm ${isSelected ? 'font-bold text-[#CD2C58]' : 'text-gray-700 group-hover:text-gray-900'}`}>{cat}</span>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">({count})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Price Filter */}
            <div className="border-t border-gray-200 py-6">
              <h3 className="font-semibold text-gray-900 mb-4">Max Base Price (₹)</h3>
              <div className="px-2">
                <Slider 
                  defaultValue={[5000]}
                  value={[maxPrice]}
                  max={5000}
                  step={50}
                  onValueChange={(val) => setMaxPrice(val[0])}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>₹0</span>
                  <span className="font-bold text-gray-900">₹{maxPrice}</span>
                </div>
              </div>
            </div>
            
            {/* Hide Out of Stock Toggle */}
            <div className="border-t border-gray-200 py-6">
              <label className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.preventDefault(); setHideOutOfStock(!hideOutOfStock); }}>
                 <div className={`w-10 h-6 rounded-full relative transition-colors ${hideOutOfStock ? 'bg-[#CD2C58]' : 'bg-gray-200 group-hover:bg-gray-300'}`}>
                   <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${hideOutOfStock ? 'translate-x-4' : ''}`}></div>
                 </div>
                 <span className="text-sm font-medium text-gray-900">Hide Out of Stock</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Product Catalog Display */}
        <main className="flex-1">
          {loading ? (
            <div className="py-20 text-center text-gray-500 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#CD2C58] mb-2" />
              Loading equipment catalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center bg-gray-50 rounded-2xl border border-gray-200 p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
              <p className="text-sm text-gray-500 mb-4">Try clearing category or price filters.</p>
              <button onClick={clearAllFilters} className="px-4 py-2 bg-[#CD2C58] text-white rounded-lg text-sm font-bold">
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const isWishlisted = wishlistIds.includes(product.id);
                const isAvailable = product.stock;

                return (
                  <Link 
                    key={product.id} 
                    href={`/product/${product.id}`}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group flex flex-col justify-between cursor-pointer"
                  >
                      <div className="relative h-56 bg-gray-100 overflow-hidden">
                        {product.img ? (
                          <img 
                            src={product.img} 
                            alt={product.name} 
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!isAvailable ? 'grayscale opacity-75' : ''}`}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                            <span className="text-xs font-medium text-gray-400">No Image</span>
                          </div>
                        )}
                      
                      {/* Wishlist Button */}
                      <button 
                        onClick={(e) => toggleWishlist(product, e)}
                        className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all z-10 ${isWishlisted ? 'bg-[#CD2C58] text-white' : 'bg-white/90 text-gray-700 hover:text-[#CD2C58]'}`}
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                      </button>

                      {/* Category Badge */}
                      <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {product.category}
                      </span>

                      {/* Out of Stock Overlay Badge */}
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-md uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base group-hover:text-[#CD2C58] transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description || 'Premium rental equipment'}</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-400 block font-medium">Daily Price</span>
                          <span className="text-xl font-black text-[#CD2C58]">₹{product.price}</span>
                          <span className="text-xs text-gray-500">/day</span>
                        </div>

                        {isAvailable ? (
                          <span className="px-4 py-2 bg-[#CD2C58] text-white text-xs font-bold rounded-xl group-hover:bg-[#b02248] transition-colors shadow-sm flex items-center gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5" /> Rent & Select Dates
                          </span>
                        ) : (
                          <span className="px-3 py-2 bg-gray-200 text-gray-500 text-xs font-bold rounded-xl cursor-not-allowed">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading catalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
