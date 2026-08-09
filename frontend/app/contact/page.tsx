"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  Headphones, 
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { contactApi } from '@/lib/api';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [ticketId, setTicketId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    category: 'General Inquiry',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await contactApi.submitInquiry(formData);
    setLoading(false);

    if (res.success) {
      setTicketId(res.data?.ticketId || `TKT-${Math.floor(100000 + Math.random() * 900000)}`);
      setSubmitted(true);
    } else {
      setError(res.message || 'Failed to send inquiry. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-20 space-y-12">
      
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-gray-950 via-[#721530] to-[#CD2C58] text-white py-16 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-yellow-300 border border-white/20">
            <Headphones className="w-4 h-4 text-yellow-300" /> Dedicated Customer & Technical Support
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">How Can We Help You Today?</h1>
          <p className="text-white/80 text-sm sm:text-base max-w-2xl mx-auto">
            Have a question about an active rental, deposit refund, or equipment reservation? Our technical team responds within 15 minutes.
          </p>
        </div>

        {/* Glow */}
        <div className="absolute top-[-30%] right-[-10%] w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Main Grid: Form + Info Cards */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Contact Cards */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-[#CD2C58]" /> Direct Channels
            </h2>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                <div className="p-2.5 bg-pink-100 text-[#CD2C58] rounded-xl flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Phone Support</div>
                  <div className="text-gray-500 font-mono">+1 (800) 555-ODOO</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Toll-Free • 24/7 Hotline</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Support Email</div>
                  <div className="text-gray-500 font-mono">support@odoorentals.com</div>
                  <div className="text-[10px] text-purple-600 font-bold mt-0.5">Avg response: 15 mins</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Headquarters Hub</div>
                  <div className="text-gray-500">100 Technology Parkway, Suite 400</div>
                  <div className="text-[10px] text-gray-400">San Francisco, CA 94107</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Operating Hours</div>
                  <div className="text-gray-500">Mon - Sat: 8:00 AM - 9:00 PM EST</div>
                  <div className="text-gray-400">Sun: 10:00 AM - 6:00 PM EST</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-[#CD2C58] to-purple-800 rounded-3xl text-white space-y-3 shadow-lg">
            <div className="font-bold text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-yellow-300" /> Active Rental Emergency?
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Need immediate hardware replacement or troubleshooting during an active shoot? Call our express line for instant technician dispatch.
            </p>
          </div>

        </div>

        {/* Right Column: Interactive Form */}
        <div className="lg:col-span-2 bg-white p-8 sm:p-12 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          {submitted ? (
            <div className="py-16 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-900">Inquiry Ticket Created!</h2>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Thank you, <strong className="text-gray-900">{formData.firstName}</strong>. We have logged your request under ticket reference:
                </p>
                <div className="inline-block bg-gray-100 px-4 py-2 rounded-xl text-base font-mono font-bold text-[#CD2C58] border border-gray-200">
                  {ticketId}
                </div>
              </div>

              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                A confirmation has been sent to <strong>{formData.email}</strong>. One of our support specialists will respond shortly.
              </p>

              <button 
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ firstName: '', lastName: '', email: '', phone: '', category: 'General Inquiry', subject: '', message: '' });
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition-all"
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Send Us a Message</h2>
                <p className="text-xs text-gray-500">Fill out the form below and we will route your request directly to the appropriate department.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">First Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#CD2C58] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Last Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#CD2C58] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address *</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#CD2C58] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone Number (Optional)</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#CD2C58] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Support Category *</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#CD2C58] cursor-pointer"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Active Rental Assistance">Active Rental Assistance</option>
                    <option value="Security Deposit & Billing">Security Deposit & Billing</option>
                    <option value="Vendor Onboarding">Vendor Onboarding</option>
                    <option value="Technical Support">Technical Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Subject *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Order extension request / Question" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#CD2C58] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Detailed Message *</label>
                <textarea 
                  rows={5}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your inquiry or order details..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#CD2C58] transition-all"
                ></textarea>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#CD2C58] hover:bg-[#b02248] text-white font-bold rounded-2xl shadow-lg shadow-[#CD2C58]/30 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending Email Notification...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Inquiry Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
