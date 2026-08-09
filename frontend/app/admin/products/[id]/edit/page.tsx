"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Trash2, Plus, Info } from 'lucide-react';
import { catalogApi } from '@/lib/api';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [activeTab, setActiveTab] = useState<'general' | 'attributes' | 'sales'>('general');
  const [fetching, setFetching] = useState(true);
  
  // General Info
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [productType, setProductType] = useState<'Goods' | 'Service'>('Goods');
  const [quantityOnHand, setQuantityOnHand] = useState('100.00');
  const [salesPrice, setSalesPrice] = useState('25.00');
  const [costPrice, setCostPrice] = useState('15.00');
  const [isPublished, setIsPublished] = useState(true);
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Attributes & Variants
  const [attributes, setAttributes] = useState<Array<{ id: string; name: string; values: string }>>([]);

  // Sales & Rental Settings
  const [periodicity, setPeriodicity] = useState<'Hours' | 'Day' | 'Night' | 'Weekly'>('Day');
  const [pickupTime, setPickupTime] = useState('10:00 H');
  const [returnTime, setReturnTime] = useState('19:00 H');
  const [paddingTime, setPaddingTime] = useState('2:00 H');
  const [lateFees, setLateFees] = useState('150.00');
  const [securityDeposit, setSecurityDeposit] = useState('100.00');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!productId) return;
    const fetchProductDetails = async () => {
      setFetching(true);
      const res = await catalogApi.getProductById(productId);
      setFetching(false);

      if (res.success && res.data) {
        const prod = res.data;
        setName(prod.name || '');
        setImageUrl(prod.image_url || '');
        setProductType(prod.product_type || 'Goods');
        setQuantityOnHand(prod.quantity_on_hand?.toString() || '100');
        setSalesPrice(prod.base_price?.toString() || '25');
        setCostPrice(prod.cost_price?.toString() || '15');
        setIsPublished(prod.is_published !== false);
        setCategory(prod.category || 'Electronics');
        setDescription(prod.description || '');
        setStatus(prod.status || 'ACTIVE');

        if (Array.isArray(prod.attributes)) {
          setAttributes(prod.attributes.map((attr: any, idx: number) => ({
            id: attr.id || idx.toString(),
            name: attr.name || '',
            values: Array.isArray(attr.values) ? attr.values.join(', ') : (attr.values || ''),
          })));
        }

        setPeriodicity(prod.periodicity || 'Day');
        setPickupTime(prod.pickup_time || '10:00 H');
        setReturnTime(prod.return_time || '19:00 H');
        setPaddingTime(prod.padding_time || '2:00 H');
        setLateFees(prod.late_fees?.toString() || '150');
        setSecurityDeposit(prod.security_deposit?.toString() || '100');
      } else {
        setMessage({ type: 'error', text: res.message || 'Product not found' });
      }
    };

    fetchProductDetails();
  }, [productId]);

  const addAttributeLine = () => {
    setAttributes([
      ...attributes,
      { id: Date.now().toString(), name: '', values: '' },
    ]);
  };

  const removeAttributeLine = (id: string) => {
    setAttributes(attributes.filter((attr) => attr.id !== id));
  };

  const updateAttribute = (id: string, field: 'name' | 'values', val: string) => {
    setAttributes(attributes.map(attr => attr.id === id ? { ...attr, [field]: val } : attr));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size too large. Please select an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Product name is required.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await catalogApi.updateProduct(productId, {
      name,
      description,
      category,
      base_price: parseFloat(salesPrice) || 25,
      status,
      security_deposit: parseFloat(securityDeposit) || 100,
      image_url: imageUrl,
      product_type: productType,
      quantity_on_hand: parseFloat(quantityOnHand) || 100,
      cost_price: parseFloat(costPrice) || 15,
      is_published: isPublished,
      periodicity,
      pickup_time: pickupTime,
      return_time: returnTime,
      padding_time: paddingTime,
      late_fees: parseFloat(lateFees) || 150,
      attributes: attributes.filter(a => a.name.trim() !== ''),
    });

    setLoading(false);

    if (res.success) {
      setMessage({ type: 'success', text: `Product "${name}" updated successfully!` });
      setTimeout(() => {
        router.push('/admin/products');
      }, 1200);
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to update product.' });
    }
  };

  if (fetching) {
    return (
      <div className="p-12 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#CD2C58]" /> Loading product details...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-[calc(100vh-3.5rem)]">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/products" 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Product / {name || 'Loading...'}</h1>
            <p className="text-xs text-gray-500">Update product details, rental timing, pricing & attributes</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-[#CD2C58] text-white text-sm font-semibold rounded-md shadow-sm hover:bg-[#b02248] flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-xl text-sm flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Odoo Form View */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Upper Title & Image Header */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-6 bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sony FX3 Cinema Camera Bundle"
                className="w-full text-lg font-bold text-gray-900 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CD2C58]/20 focus:border-[#CD2C58]"
              />
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-[#CD2C58] focus:ring-[#CD2C58]"
                />
                Published (Can be rented)
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Status:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="border border-gray-300 rounded text-xs px-2 py-1 bg-white font-medium"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Image Preview & Input */}
          <div className="w-full md:w-64 flex flex-col items-center gap-2">
            <div className="relative w-full h-36 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center overflow-hidden bg-gray-50 hover:bg-gray-100/80 transition-colors">
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400 p-2 text-center">
                  <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                  <span className="text-[11px] font-medium">Upload Image or URL</span>
                </div>
              )}
            </div>

            <div className="w-full space-y-1">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste Image URL..."
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-[#CD2C58]"
              />
              <label className="block text-center text-[10px] text-gray-500 cursor-pointer hover:text-[#CD2C58]">
                <span>Or Upload File</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50/50 px-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'general'
                ? 'border-[#CD2C58] text-[#CD2C58] bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            General Information
          </button>
          <button
            onClick={() => setActiveTab('attributes')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'attributes'
                ? 'border-[#CD2C58] text-[#CD2C58] bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Attributes & Variants ({attributes.length})
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'sales'
                ? 'border-[#CD2C58] text-[#CD2C58] bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Sales & Rental Pricing
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Product Type</label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value as 'Goods' | 'Service')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#CD2C58]"
                  >
                    <option value="Goods">Goods (Physical Stock)</option>
                    <option value="Service">Service (Non-physical)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Computers, Cameras"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#CD2C58]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity On Hand</label>
                  <input
                    type="number"
                    value={quantityOnHand}
                    onChange={(e) => setQuantityOnHand(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#CD2C58]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Rental Base Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#CD2C58]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#CD2C58]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Internal Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Product specification details..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#CD2C58]"
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attributes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">Add custom attributes like Color, Storage, or Lens Type.</p>
                <button
                  type="button"
                  onClick={addAttributeLine}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Attribute
                </button>
              </div>

              {attributes.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                  No custom attributes configured for this product.
                </div>
              ) : (
                <div className="space-y-3">
                  {attributes.map((attr) => (
                    <div key={attr.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <input
                        type="text"
                        placeholder="Attribute Name (e.g. Color)"
                        value={attr.name}
                        onChange={(e) => updateAttribute(attr.id, 'name', e.target.value)}
                        className="w-1/3 border border-gray-300 rounded px-2.5 py-1.5 text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Values (comma separated e.g. Black, Silver)"
                        value={attr.values}
                        onChange={(e) => updateAttribute(attr.id, 'values', e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttributeLine(attr.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b pb-1">Rental Periodicity & Time</h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Periodicity</label>
                  <select
                    value={periodicity}
                    onChange={(e) => setPeriodicity(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#CD2C58]"
                  >
                    <option value="Hours">Hours</option>
                    <option value="Day">Day</option>
                    <option value="Night">Night</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Default Pickup Time</label>
                    <input
                      type="text"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#CD2C58]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Default Return Time</label>
                    <input
                      type="text"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#CD2C58]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b pb-1">Deposits & Penalties</h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#CD2C58]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Late Fee per Hour (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={lateFees}
                    onChange={(e) => setLateFees(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#CD2C58]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
