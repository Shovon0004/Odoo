"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function Register() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    const fullName = `${firstName} ${lastName}`.trim();
    const res = await authApi.register({
      name: fullName,
      email,
      password,
      role: 'CUSTOMER'
    });

    setLoading(false);

    if (res.success && res.data) {
      const token = res.data.token;
      const user = res.data.user || (res.data.id ? res.data : null);

      if (token) {
        localStorage.setItem('token', token);
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      window.dispatchEvent(new Event('userUpdated'));
      router.push('/');
    } else {
      setError(res.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-6 text-center md:text-left">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Customer Sign-up</h1>
            <p className="text-gray-500">Create an account to start renting premium equipment.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#CD2C58] focus:ring-1 focus:ring-[#CD2C58] focus:bg-white transition-all" 
                    placeholder="John" 
                    required 
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#CD2C58] focus:ring-1 focus:ring-[#CD2C58] focus:bg-white transition-all" 
                    placeholder="Doe" 
                    required 
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email ID</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 pl-10 text-sm focus:outline-none focus:border-[#CD2C58] focus:ring-1 focus:ring-[#CD2C58] focus:bg-white transition-all" 
                  placeholder="name@example.com" 
                  required 
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 pl-10 text-sm focus:outline-none focus:border-[#CD2C58] focus:ring-1 focus:ring-[#CD2C58] focus:bg-white transition-all" 
                  placeholder="••••••••" 
                  required 
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 pl-10 text-sm focus:outline-none focus:border-[#CD2C58] focus:ring-1 focus:ring-[#CD2C58] focus:bg-white transition-all" 
                  placeholder="••••••••" 
                  required 
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-[#CD2C58] text-white rounded-xl font-bold hover:bg-[#E06B80] transition-colors shadow-lg shadow-[#CD2C58]/30 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Registering Customer...
                </>
              ) : (
                <>
                  Register as Customer <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 flex flex-col gap-2">
            <div>
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-[#CD2C58] hover:underline">
                Sign in
              </Link>
            </div>
            <div>
              <Link href="/vendor-register" className="font-bold text-[#CD2C58] hover:underline text-xs bg-[#FFE6D4] px-3 py-1.5 rounded-lg inline-block">
                Want to list gear? Become a Vendor →
              </Link>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="w-full md:w-1/2 bg-[#FFE6D4] p-12 hidden md:flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <img src="/image.png" alt="Odoo Rentals Logo" className="h-10 w-auto object-contain rounded-lg shadow-sm" />
              <span className="text-2xl font-black text-[#CD2C58] tracking-tight">Odoo Rentals</span>
            </div>
            <h2 className="text-4xl font-black text-[#CD2C58] leading-tight mb-4">
              Premium Gear.<br/>Flexible Terms.
            </h2>
            <p className="text-[#E06B80] text-lg font-medium">
              Join thousands of professionals renting top-tier equipment seamlessly.
            </p>
          </div>

          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#FFC69D] rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-[#E06B80] rounded-full blur-3xl opacity-20"></div>
        </div>

      </div>
    </div>
  );
}
