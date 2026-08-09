"use client";

import React, { useState, useEffect } from 'react';
import { walletApi } from '@/lib/api';
import { Wallet, ArrowDownRight, ArrowUpRight, PlusCircle, RefreshCw, ShieldCheck, History, Loader2, DollarSign } from 'lucide-react';

export default function WalletPage() {
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [processingTopUp, setProcessingTopUp] = useState(false);

  const fetchWallet = async () => {
    setLoading(true);
    const res = await walletApi.getWallet();
    if (res.success && res.data) {
      setWalletData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(topUpAmount);
    if (!num || num <= 0) {
      alert('Please enter a valid top-up amount.');
      return;
    }

    setProcessingTopUp(true);
    const res = await walletApi.topUpWallet(num);
    if (res.success) {
      alert(`₹${num} successfully added to your rental wallet!`);
      setTopUpAmount('');
      setShowTopUpModal(false);
      fetchWallet();
    } else {
      alert(res.message || 'Top-up failed');
    }
    setProcessingTopUp(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center flex items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#CD2C58] mr-2" /> Loading Digital Wallet...
      </div>
    );
  }

  const balance = Number(walletData?.wallet_balance || 0);
  const transactions = walletData?.transactions || [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Wallet className="w-8 h-8 text-[#CD2C58]" /> Digital Rental Wallet
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Seamless deposit refunds, quick rental payments, and real-time transaction ledger.
          </p>
        </div>
        
        <button
          onClick={() => setShowTopUpModal(true)}
          className="px-5 py-3 bg-[#CD2C58] text-white font-bold rounded-xl shadow-lg shadow-[#CD2C58]/30 hover:bg-[#b02248] transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <PlusCircle className="w-5 h-5" /> Top Up Wallet
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-[#CD2C58]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <span className="text-xs uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Available Balance
          </span>
          <div className="text-5xl font-black text-white tracking-tight">
            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-400 pt-1">
            Instantly usable for all security deposits & equipment rentals.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 min-w-[120px]">
            <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Total Credits</span>
            <span className="text-lg font-black text-emerald-400">
              +₹{transactions.filter((t: any) => t.type === 'CREDIT').reduce((sum: number, t: any) => sum + Number(t.amount), 0).toFixed(2)}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 min-w-[120px]">
            <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Total Debits</span>
            <span className="text-lg font-black text-red-400">
              -₹{transactions.filter((t: any) => t.type === 'DEBIT').reduce((sum: number, t: any) => sum + Number(t.amount), 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-500" /> Transaction Ledger
          </h2>
          <button 
            onClick={fetchWallet}
            className="text-xs text-gray-500 hover:text-[#CD2C58] flex items-center gap-1 font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No transactions found yet. Deposit refunds & top-ups will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 font-bold">Type</th>
                  <th className="pb-3 font-bold">Category</th>
                  <th className="pb-3 font-bold">Description</th>
                  <th className="pb-3 font-bold text-right">Amount</th>
                  <th className="pb-3 font-bold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${tx.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {tx.type === 'CREDIT' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-4 font-bold text-gray-800 text-xs">
                      {tx.category}
                    </td>
                    <td className="py-4 text-gray-600 max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className={`py-4 text-right font-black ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-4 text-right text-xs text-gray-400">
                      {new Date(tx.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top-up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900">Top Up Wallet</h3>
            <form onSubmit={handleTopUpSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select or Enter Amount (₹)</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt.toString())}
                      className="py-2 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-[#CD2C58] hover:text-white transition-colors"
                    >
                      +₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="Enter custom amount e.g. 2000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg font-bold text-gray-900 focus:ring-2 focus:ring-[#CD2C58] focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingTopUp}
                  className="flex-1 py-3 bg-[#CD2C58] text-white font-bold rounded-xl hover:bg-[#b02248] transition-colors flex items-center justify-center gap-2"
                >
                  {processingTopUp ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Top-Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
