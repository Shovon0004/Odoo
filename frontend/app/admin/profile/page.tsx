"use client";

import React, { useState, useEffect } from 'react';
import { User as UserIcon, Camera, Save, CheckCircle2, AlertCircle, Shield, Building, Mail, MapPin, Phone, FileText, Store } from 'lucide-react';
import { authApi, uploadApi } from '@/lib/api';

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Please select an image under 10MB.');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await uploadApi.uploadImage(base64, 'profiles');
        if (res.success && res.data?.url) {
          setProfileImage(res.data.url);
        } else {
          setProfileImage(base64);
        }
      } catch (err) {
        setProfileImage(base64);
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const res = await authApi.getProfile();
      setLoading(false);

      if (res.success && res.data) {
        setProfile(res.data);
        setName(res.data.name || '');
        setBusinessName(res.data.business_name || '');
        setPhone(res.data.phone || '');
        setGstNumber(res.data.gst_number || '');
        setProfileImage(res.data.profile_image || '');
        setAddress(res.data.address || '');
      }
    };

    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const res = await authApi.updateProfile({
      name: name.trim(),
      business_name: businessName.trim(),
      phone: phone.trim(),
      gst_number: gstNumber.trim(),
      profile_image: profileImage.trim(),
      address: address.trim(),
    });

    setSaving(false);

    if (res.success && res.data) {
      setProfile(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('userUpdated'));
      setMessage({ type: 'success', text: 'Store & Vendor profile credentials updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to update profile.' });
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 text-sm">
        Loading admin profile details...
      </div>
    );
  }

  const isVendor = profile?.role === 'VENDOR';
  const isStoreComplete = Boolean((businessName.trim() || name.trim()) && phone.trim() && address.trim());

  return (
    <div className="p-6 max-w-[1200px] mx-auto min-h-[calc(100vh-3.5rem)] space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isVendor ? 'Vendor Partner Profile & Organization' : 'Admin Profile & System Credentials'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your administrative contact details, business credentials, and avatar within the Odoo Workspace.
          </p>
        </div>

        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
          profile?.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
          profile?.role === 'VENDOR' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
          'bg-emerald-100 text-emerald-800 border border-emerald-300'
        }`}>
          Role: {profile?.role || 'ADMIN'}
        </span>
      </div>

      {/* Vendor Store Completion Status Banner */}
      {isVendor && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between gap-4 ${
          isStoreComplete 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <Store className={`w-5 h-5 flex-shrink-0 ${isStoreComplete ? 'text-emerald-600' : 'text-amber-600'}`} />
            <div>
              <span className="font-bold block">
                {isStoreComplete ? '✅ Store Profile Complete' : '⚠️ Store Profile Incomplete'}
              </span>
              <span className="text-xs font-normal">
                {isStoreComplete 
                  ? 'Your store profile details (Store Name, Phone, and Address) are complete. You are verified to create and list rental products.' 
                  : 'You must fill in your Store / Business Name, Contact Phone Number, and Store Address below before adding products.'}
              </span>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase shrink-0 ${
            isStoreComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'
          }`}>
            {isStoreComplete ? 'Active Publisher' : 'Action Required'}
          </span>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Profile Form Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-8 flex flex-col md:flex-row gap-10 items-start">
        
        {/* Profile Avatar Upload */}
        <div className="flex flex-col items-center shrink-0 w-full md:w-56 space-y-4">
          <label className="relative group cursor-pointer">
            <div className="w-40 h-40 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl flex items-center justify-center text-[#CD2C58] font-bold text-4xl shadow-md overflow-hidden border-4 border-white group-hover:shadow-lg transition-all">
              {profileImage ? (
                <img src={profileImage} alt={name} className="w-full h-full object-cover" />
              ) : name ? (
                name.charAt(0).toUpperCase()
              ) : (
                <UserIcon className="w-12 h-12 text-[#CD2C58]" />
              )}

              <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-xs font-bold">
                <Camera className="w-6 h-6 text-white" />
                <span>Change Image</span>
              </div>
            </div>

            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              disabled={uploadingImage}
              onChange={handleImageUpload}
            />
          </label>

          <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 cursor-pointer transition-all flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#CD2C58]" /> {uploadingImage ? 'Uploading to Cloudinary...' : 'Upload Photo / Logo'}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              disabled={uploadingImage}
              onChange={handleImageUpload}
            />
          </label>

          {profileImage && (
            <button
              type="button"
              onClick={() => setProfileImage('')}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Remove Image
            </button>
          )}
        </div>

        {/* Form Details */}
        <form onSubmit={handleSave} className="flex-1 space-y-6 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Account Manager Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#CD2C58] text-gray-900 font-bold text-sm" 
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Store / Business Name {isVendor && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input 
                  type="text" 
                  value={businessName} 
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Equipment Rentals"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CD2C58] text-gray-900 font-bold text-sm" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Store Phone Number {isVendor && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210" 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CD2C58] text-gray-900 font-bold text-sm" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                GST / Tax Registration Number (Optional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input 
                  type="text" 
                  value={gstNumber} 
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CD2C58] text-gray-900 font-bold text-sm" 
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Email Address (Login ID)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
              <input 
                type="email" 
                value={profile?.email || ''} 
                disabled 
                className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 text-gray-600 rounded-xl font-bold text-sm" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              {isVendor ? 'Store & Dispatch Warehouse Address' : 'Administrative Office Address'} {isVendor && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
              <textarea 
                rows={3}
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, City, Zipcode..." 
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CD2C58] font-medium" 
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#CD2C58] text-white font-bold text-sm rounded-xl shadow-xs hover:bg-[#b02248] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> Save Profile Credentials
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
