"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Loader2, CheckCircle2, AlertCircle, Camera, MapPin, Mail, Save, Phone } from 'lucide-react';
import { authApi, uploadApi } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [kycIdType, setKycIdType] = useState('Aadhaar Card');
  const [kycIdNumber, setKycIdNumber] = useState('');
  const [kycDocumentUrl, setKycDocumentUrl] = useState('');
  const [uploadingKycDoc, setUploadingKycDoc] = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);

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
    const fetchProfile = async () => {
      setLoading(true);
      const res = await authApi.getProfile();
      setLoading(false);

      if (res.success && res.data) {
        if (res.data.role === 'VENDOR' || res.data.role === 'ADMIN' || res.data.role === 'SUPERADMIN') {
          router.replace('/admin/profile');
          return;
        }
        setProfile(res.data);
        setName(res.data.name || '');
        setProfileImage(res.data.profile_image || '');
        setAddress(res.data.address || '');
        setPhone(res.data.phone || '');
        if (res.data.kyc_id_type) setKycIdType(res.data.kyc_id_type);
        if (res.data.kyc_id_number) setKycIdNumber(res.data.kyc_id_number);
        if (res.data.kyc_document_url) setKycDocumentUrl(res.data.kyc_document_url);
      } else {
        // Fallback to localStorage user if available
        const localUser = localStorage.getItem('user');
        if (localUser) {
          try {
            const parsed = JSON.parse(localUser);
            if (parsed.role === 'VENDOR' || parsed.role === 'ADMIN' || parsed.role === 'SUPERADMIN') {
              router.replace('/admin/profile');
              return;
            }
            setProfile(parsed);
            setName(parsed.name || '');
            setProfileImage(parsed.profile_image || '');
            setAddress(parsed.address || '');
            setPhone(parsed.phone || '');
          } catch (e) {}
        }
      }
    };

    fetchProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const res = await authApi.updateProfile({
      name: name.trim(),
      profile_image: profileImage.trim(),
      address: address.trim(),
      phone: phone.trim(),
    });

    setSaving(false);

    if (res.success && res.data) {
      setProfile(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('userUpdated'));
      setMessage({ type: 'success', text: 'Profile & avatar image updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to update profile image.' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500 min-h-[calc(100vh-5rem)]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#CD2C58]" />
        Loading your profile details...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 min-h-[calc(100vh-5rem)]">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">My Profile & Account Settings</h1>
      
      {(profile?.role === 'VENDOR' || profile?.role === 'ADMIN' || profile?.role === 'SUPERADMIN') && (
        <div className="mb-8 p-5 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-4">
          <div>
            <span className="font-bold text-purple-900 text-sm block">⚙️ Administrative Workspace Account</span>
            <span className="text-xs text-purple-700">You are signed in with partner vendor privileges ({profile?.role}).</span>
          </div>
          <a
            href="/admin"
            className="px-4 py-2 bg-[#CD2C58] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#b02248] transition-colors"
          >
            Go to Admin Dashboard
          </a>
        </div>
      )}

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 sm:p-10 flex flex-col md:flex-row gap-10 items-start">
        
        {/* Interactive Avatar Upload Section */}
        <div className="flex flex-col items-center shrink-0 w-full md:w-48 space-y-3">
          <label className="relative group cursor-pointer">
            <div className="w-36 h-36 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center text-[#CD2C58] font-bold text-4xl shadow-md overflow-hidden border-4 border-white group-hover:shadow-lg transition-all">
              {profileImage ? (
                <img src={profileImage} alt={name} className="w-full h-full object-cover" />
              ) : name ? (
                name.charAt(0).toUpperCase()
              ) : (
                <UserIcon className="w-12 h-12 text-[#CD2C58]" />
              )}

              {/* Hover Camera Overlay */}
              <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-xs font-bold">
                <Camera className="w-6 h-6 text-white" />
                <span>Change Avatar</span>
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

          {/* Clean Upload Button */}
          <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer transition-all flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#CD2C58]" /> {uploadingImage ? 'Uploading to Cloudinary...' : 'Upload Image'}
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
              className="text-[11px] font-bold text-red-500 hover:underline"
            >
              Remove Photo
            </button>
          )}

          <div className="text-center pt-2">
            <span className="inline-block text-[10px] font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-800 uppercase tracking-wider">
              {profile?.role || 'CUSTOMER'}
            </span>
          </div>
        </div>
        
        {/* Form Details */}
        <form onSubmit={handleSave} className="flex-1 space-y-6 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#CD2C58] text-gray-900 font-medium text-sm" 
                placeholder="e.g. Shovon Halder"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Account Role</label>
              <input 
                type="text" 
                value={profile?.role || 'CUSTOMER'} 
                disabled 
                className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-xl py-3 px-4 font-bold text-sm" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Phone Number <span className="text-red-500">*</span></label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210" 
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CD2C58] text-gray-900 font-medium" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Shipping & Delivery Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
              <textarea 
                rows={3}
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street name, City, Zipcode..." 
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CD2C58]" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="email" 
                value={profile?.email || ''} 
                disabled 
                className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl text-sm" 
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={saving}
            className="bg-[#CD2C58] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#b02248] transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-[#CD2C58]/20 text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
          </button>
        </form>
      </div>

      {/* Identity & KYC Verification Suite */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🛡️ Customer Identity & KYC Verification
            </h2>
            <p className="text-xs text-gray-500 mt-1">Upload government identity proof to verify your account for high-value equipment rentals.</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
            profile?.kyc_status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
            profile?.kyc_status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
            profile?.kyc_status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-300' :
            'bg-gray-100 text-gray-700 border border-gray-300'
          }`}>
            {profile?.kyc_status === 'VERIFIED' ? '✓ VERIFIED' :
             profile?.kyc_status === 'PENDING' ? '⏳ PENDING REVIEW' :
             profile?.kyc_status === 'REJECTED' ? '❌ REJECTED' : '⚠️ NOT SUBMITTED'}
          </span>
        </div>

        {profile?.kyc_status === 'VERIFIED' ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4 text-emerald-900 text-xs font-bold">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              Your identity has been verified! You have full rental privileges for all equipment categories.
              <div className="text-[11px] font-normal text-emerald-700 mt-0.5">Verified Document: {profile.kyc_id_type} ({profile.kyc_id_number})</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Government ID Type</label>
                <select
                  value={kycIdType}
                  onChange={(e) => setKycIdType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#CD2C58]"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ID Number</label>
                <input
                  type="text"
                  value={kycIdNumber}
                  onChange={(e) => setKycIdNumber(e.target.value)}
                  placeholder="e.g. 1234 5678 9012"
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#CD2C58]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Upload ID Document Photo</label>
              <div className="h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#CD2C58] transition-colors cursor-pointer">
                {uploadingKycDoc ? (
                  <div className="flex items-center gap-2 text-[#CD2C58] font-bold">
                    <Loader2 className="w-5 h-5 animate-spin" /> Uploading Document...
                  </div>
                ) : kycDocumentUrl ? (
                  <img src={kycDocumentUrl} alt="KYC Document" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-3 text-gray-400">
                    <Camera className="w-6 h-6 mx-auto mb-1 group-hover:text-[#CD2C58]" />
                    <span className="font-bold text-gray-700 block text-xs">Click to upload ID photo</span>
                    <span className="text-[10px] text-gray-400">Clear photo of Aadhaar / Passport / License</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingKycDoc(true);
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const base64 = reader.result as string;
                      const res = await uploadApi.uploadImage(base64, 'kyc');
                      if (res.success && res.data?.url) {
                        setKycDocumentUrl(res.data.url);
                      } else {
                        setKycDocumentUrl(base64);
                      }
                      setUploadingKycDoc(false);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <button
                onClick={async () => {
                  if (!kycIdNumber.trim() || !kycDocumentUrl) {
                    alert('Please provide ID Number and upload Document Photo');
                    return;
                  }
                  setSubmittingKyc(true);
                  const res = await authApi.submitKyc({
                    kyc_id_type: kycIdType,
                    kyc_id_number: kycIdNumber,
                    kyc_document_url: kycDocumentUrl,
                  });
                  setSubmittingKyc(false);
                  if (res.success) {
                    setMessage({ type: 'success', text: 'KYC Document submitted successfully! Identity under review.' });
                    setProfile({ ...profile, kyc_status: 'PENDING' });
                  } else {
                    setMessage({ type: 'error', text: res.message || 'KYC submission failed' });
                  }
                }}
                disabled={submittingKyc || uploadingKycDoc}
                className="w-full py-3 bg-[#CD2C58] text-white font-bold text-xs rounded-xl hover:bg-[#b02248] transition-colors disabled:opacity-50"
              >
                {submittingKyc ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit KYC Document for Review'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
