"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await authApi.login(email, password);
    setLoading(false);

    if (res.success && res.data) {
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      window.dispatchEvent(new Event('userUpdated'));

      // Redirect based on user role
      if (res.data.user?.role === 'SUPERADMIN') {
        router.push('/admin/super');
      } else if (res.data.user?.role === 'ADMIN' || res.data.user?.role === 'VENDOR') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } else {
      setError(res.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome Back!</h1>
            <p className="text-gray-500">Sign in to manage your rentals and orders.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 pl-12 text-sm focus:outline-none focus:border-[#CD2C58] focus:ring-1 focus:ring-[#CD2C58] focus:bg-white transition-all" 
                  placeholder="name@example.com" 
                  required 
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <a href="/forgot-password" className="text-xs font-medium text-[#CD2C58] hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 pl-12 text-sm focus:outline-none focus:border-[#CD2C58] focus:ring-1 focus:ring-[#CD2C58] focus:bg-white transition-all" 
                  placeholder="••••••••" 
                  required 
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-[#CD2C58] text-white rounded-xl font-bold hover:bg-[#E06B80] transition-colors shadow-lg shadow-[#CD2C58]/30 flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Don&#39;t have an account?{' '}
            <Link href="/register" className="font-bold text-[#CD2C58] hover:underline">
              Sign up
            </Link>
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
