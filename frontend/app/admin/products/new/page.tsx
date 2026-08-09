"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Trash2, Plus, Info } from 'lucide-react';
import { catalogApi } from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'attributes' | 'sales'>('general');
  
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

  // Attributes & Variants
  const [attributes, setAttributes] = useState<Array<{ id: string; name: string; values: string }>>([]);

  React.useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const key = user?.id ? `vendor_attributes_${user.id}` : 'vendor_attributes';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAttributes(parsed.map((a: any) => ({ id: a.id, name: a.name, values: a.values })));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sales & Rental Settings (Wireframe Image 3)
  const [periodicity, setPeriodicity] = useState<'Hours' | 'Day' | 'Night' | 'Weekly'>('Hours');
  const [pickupTime, setPickupTime] = useState('10:00 H');
  const [returnTime, setReturnTime] = useState('19:00 H');
  const [paddingTime, setPaddingTime] = useState('2:00 H');
  const [lateFees, setLateFees] = useState('150.00');
  const [securityDeposit, setSecurityDeposit] = useState('100.00');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Product name is required.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await catalogApi.createProduct({
      name,
      description: description || 'Premium rental equipment',
      category,
      base_price: parseFloat(salesPrice) || 25,
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
      is_active: isPublished,
    });

    setLoading(false);

    if (res.success) {
      setMessage({ type: 'success', text: 'Product created successfully!' });
      setTimeout(() => router.push('/admin/products'), 1200);
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to save product.' });
    }
  };

  return (
    <form onSubmit={handleSave} className="min-h-[calc(100vh-3.5rem)] bg-gray-50 flex flex-col font-sans p-6">
      
      {/* Top Action Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-purple-100 text-[#CD2C58] font-black rounded-full text-xs uppercase tracking-wider">
              New
            </span>
            <h1 className="text-xl font-bold text-gray-900">Product Specification</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Publish Switch (Admin Only) */}
          <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <div className="text-right">
              <span className="text-xs font-bold text-gray-700 block">Publish</span>
              <span className="text-[10px] text-gray-500 italic block">Only Admin should have the right to publish</span>
            </div>
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                isPublished ? 'bg-[#CD2C58]' : 'bg-gray-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isPublished ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <Link href="/admin/products" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm">
            Discard
          </Link>
          <button 
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-[#CD2C58] text-white font-bold rounded-xl shadow-sm hover:bg-[#b02248] flex items-center gap-2 transition-colors text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Product
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-5xl mx-auto w-full space-y-6">
        
        {/* Name and Image Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-36 h-36 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 shrink-0 overflow-hidden relative group cursor-pointer">
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8 mb-1 text-gray-400" />
                <span className="text-xs font-bold text-gray-400">Click to Upload</span>
              </>
            )}
            <input 
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImageUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Product Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Computers" 
                className="w-full text-2xl font-bold border-0 border-b-2 border-gray-200 focus:border-[#CD2C58] focus:ring-0 px-0 py-2 bg-transparent text-gray-900 placeholder-gray-300 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Image (URL or File Upload)</label>
              <div className="flex gap-2">
                <input 
                  type="url" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5 focus:ring-1 focus:ring-[#CD2C58] focus:border-[#CD2C58] outline-none"
                  placeholder="Paste Image URL or click box to upload file..."
                />
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Form Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Tabs Navigation (Wireframes 1, 2, 3) */}
          <div className="flex border-b border-gray-200 px-4 bg-gray-50/50">
            <button 
              type="button"
              onClick={() => setActiveTab('general')}
              className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'general' ? 'border-[#CD2C58] text-[#CD2C58]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              General Information
            </button>

            <button 
              type="button"
              onClick={() => setActiveTab('attributes')}
              className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'attributes' ? 'border-[#CD2C58] text-[#CD2C58]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Attributes & Variants
            </button>

            <button 
              type="button"
              onClick={() => setActiveTab('sales')}
              className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'sales' ? 'border-[#CD2C58] text-[#CD2C58]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Sales
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            
            {/* WIREFRAME IMAGE 1: General Information */}
            {activeTab === 'general' && (
              <div className="space-y-8">
                
                {/* Product Type (Goods vs Service) */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center gap-6">
                    <label className="text-sm font-bold text-gray-700">Product Type:</label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-900">
                      <input 
                        type="radio" 
                        name="productType" 
                        value="Goods" 
                        checked={productType === 'Goods'} 
                        onChange={() => setProductType('Goods')}
                        className="accent-[#CD2C58] w-4 h-4"
                      />
                      Goods
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-900">
                      <input 
                        type="radio" 
                        name="productType" 
                        value="Service" 
                        checked={productType === 'Service'} 
                        onChange={() => setProductType('Service')}
                        className="accent-[#CD2C58] w-4 h-4"
                      />
                      Service
                    </label>
                  </div>

                  <div className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#CD2C58] shrink-0 mt-0.5" />
                    <span>
                      If the vendor wants to add deposit or downpayment with the product then the vendor needs to create product (type Service) named deposit/downpayment and add it in the invoice. Same goes with the warranty.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Quantity on Hand</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={quantityOnHand}
                      onChange={(e) => setQuantityOnHand(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-bold text-gray-900 focus:ring-1 focus:ring-[#CD2C58] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-bold text-gray-900 focus:ring-1 focus:ring-[#CD2C58] outline-none bg-white"
                    >
                      <option value="Electronics">Electronics & Computers</option>
                      <option value="Cameras">Cameras & Photography</option>
                      <option value="Drones">Drones & AV Equipment</option>
                      <option value="Furniture">Office Furniture</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Sales Price ($ / ₹)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={salesPrice}
                      onChange={(e) => setSalesPrice(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-bold text-[#CD2C58] focus:ring-1 focus:ring-[#CD2C58] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Cost Price ($ / ₹)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-bold text-gray-700 focus:ring-1 focus:ring-[#CD2C58] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                  <textarea 
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Product specifications and rental features..."
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-[#CD2C58] outline-none"
                  ></textarea>
                </div>

              </div>
            )}

            {/* WIREFRAME IMAGE 2: Attributes & Variants */}
            {activeTab === 'attributes' && (
              <div className="space-y-6">
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 w-1/3">Attributes</th>
                        <th className="px-4 py-3 w-1/2">Values</th>
                        <th className="px-4 py-3 text-center">Configure</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {attributes.map((attr) => (
                        <tr key={attr.id} className="hover:bg-gray-50/50">
                          <td className="p-3">
                            <input 
                              type="text"
                              value={attr.name}
                              onChange={(e) => updateAttribute(attr.id, 'name', e.target.value)}
                              placeholder="Name of the Attributes (Brand, color, Size...)"
                              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 text-sm focus:ring-1 focus:ring-[#CD2C58] outline-none"
                            />
                          </td>
                          <td className="p-3">
                            <input 
                              type="text"
                              value={attr.values}
                              onChange={(e) => updateAttribute(attr.id, 'values', e.target.value)}
                              placeholder="List of possible values (e.g. Red, Green, Blue..)"
                              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 text-sm focus:ring-1 focus:ring-[#CD2C58] outline-none"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-xs text-[#CD2C58] underline font-bold cursor-pointer">Configure</span>
                          </td>
                          <td className="p-3 text-right">
                            <button 
                              type="button"
                              onClick={() => removeAttributeLine(attr.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                              title="Delete attribute row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={addAttributeLine}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl border border-gray-300 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add a line
                </button>
              </div>
            )}

            {/* WIREFRAME IMAGE 3: Sales (Rental & Deposit) */}
            {activeTab === 'sales' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Rental Configuration */}
                <div className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
                  <h3 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2">Rental</h3>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Periodicity</label>
                    <select 
                      value={periodicity}
                      onChange={(e) => setPeriodicity(e.target.value as any)}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-bold text-gray-900 focus:ring-1 focus:ring-[#CD2C58] bg-white outline-none"
                    >
                      <option value="Hours">Hours</option>
                      <option value="Day">Day</option>
                      <option value="Night">Night</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Pickup</label>
                      <input 
                        type="text"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        placeholder="10:00 H"
                        className="w-full border border-gray-300 rounded-xl p-2 text-sm font-bold text-gray-900 focus:ring-1 focus:ring-[#CD2C58] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Return</label>
                      <input 
                        type="text"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        placeholder="19:00 H"
                        className="w-full border border-gray-300 rounded-xl p-2 text-sm font-bold text-gray-900 focus:ring-1 focus:ring-[#CD2C58] outline-none"
                      />
                    </div>
                  </div>

                  {/* Padding time (Only in case of Hours) */}
                  {periodicity === 'Hours' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <label className="block text-xs font-bold text-amber-900 mb-1">Padding time 2:00 H (Only in case of Hours)</label>
                      <input 
                        type="text"
                        value={paddingTime}
                        onChange={(e) => setPaddingTime(e.target.value)}
                        placeholder="2:00 H"
                        className="w-full border border-amber-300 rounded-lg p-1.5 text-xs font-bold text-gray-900 outline-none bg-white"
                      />
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <label className="block text-xs font-bold text-gray-700">Late Fees ($ / ₹ per hour late)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={lateFees}
                      onChange={(e) => setLateFees(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-bold text-red-600 focus:ring-1 focus:ring-[#CD2C58] outline-none"
                    />
                    <span className="text-[11px] text-gray-500 block italic">
                      * This option is only visible when the Late Fees/Overdue Penalty option is check marked on setting page.
                    </span>
                  </div>
                </div>

                {/* Security Deposit Settings */}
                <div className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
                  <h3 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2">Rental Deposit</h3>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Security Deposit ($ / ₹)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-base font-black text-[#CD2C58] focus:ring-1 focus:ring-[#CD2C58] outline-none"
                    />
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>

    </form>
  );
}
