"use client";

import React, { useState, useEffect } from 'react';
import { Search, Loader2, ShieldCheck, ShieldAlert, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import { authApi, adminApi } from '@/lib/api';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await authApi.getUsers();
    setLoading(false);

    if (res.success && Array.isArray(res.data)) {
      setUsers(res.data);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleApproval = async (userId: string, currentStatus: boolean, name: string) => {
    const nextStatus = !currentStatus;
    const confirmMsg = nextStatus
      ? `Are you sure you want to AUTHORIZE vendor "${name}" to list and sell products on the platform?`
      : `Are you sure you want to REVOKE listing authorization for vendor "${name}"?`;

    if (!confirm(confirmMsg)) return;

    const res = await adminApi.toggleVendorApproval(userId, nextStatus);
    if (res.success) {
      setActionMessage(`Vendor "${name}" authorization updated to ${nextStatus ? 'APPROVED' : 'PENDING'}.`);
      fetchUsers();
      setTimeout(() => setActionMessage(null), 3500);
    } else {
      alert(res.message || 'Failed to update vendor authorization status');
    }
  };

  const handleUpdateKyc = async (userId: string, newKycStatus: string, name: string) => {
    if (!confirm(`Are you sure you want to set KYC status of "${name}" to ${newKycStatus}?`)) return;

    const res = await adminApi.updateKycStatus(userId, newKycStatus);
    if (res.success) {
      setActionMessage(`Customer "${name}" KYC status updated to ${newKycStatus}.`);
      fetchUsers();
      setTimeout(() => setActionMessage(null), 3500);
    } else {
      alert(res.message || 'Failed to update KYC status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 max-w-[1500px] mx-auto min-h-[calc(100vh-3.5rem)]">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Users, Vendors & Identity KYC</h1>
          <p className="text-sm text-gray-500 mt-1">Manage user accounts, vendor listing permissions, and customer identity KYC verification.</p>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search system users, vendors or emails..." 
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#CD2C58]"
          />
        </div>
      </div>

      <div className="bg-white rounded-b-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#CD2C58] mb-2" />
            Loading system users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No system users found matching search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">User / Store Name</th>
                  <th className="px-6 py-4">Contact Details</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Vendor Authorization</th>
                  <th className="px-6 py-4">Identity KYC Status</th>
                  <th className="px-6 py-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#FFE6D4] text-[#CD2C58] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-pink-200">
                          {user.profile_image ? (
                            <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name ? user.name.charAt(0).toUpperCase() : 'U'
                          )}
                        </div>
                        <div>
                          <span className="block font-bold text-gray-900">{user.name || 'User'}</span>
                          {user.business_name && (
                            <span className="block text-xs font-semibold text-purple-700">🏪 {user.business_name}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      <div>{user.email}</div>
                      {user.phone && <div className="text-gray-500">📞 {user.phone}</div>}
                      {user.gst_number && <div className="text-gray-500 font-mono">GST: {user.gst_number}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        user.role === 'SUPERADMIN' ? 'bg-black text-white' :
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'VENDOR' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {user.role || 'CUSTOMER'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'VENDOR' ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          user.is_approved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {user.is_approved ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
                          {user.is_approved ? 'APPROVED TO LIST' : 'PENDING AUTHORIZATION'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">N/A ({user.role})</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase w-fit ${
                          user.kyc_status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          user.kyc_status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          user.kyc_status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-300' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {user.kyc_status || 'NOT_SUBMITTED'}
                        </span>
                        {user.kyc_id_type && (
                          <div className="text-[11px] text-gray-600 font-medium flex items-center gap-1">
                            <span>📄 {user.kyc_id_type} ({user.kyc_id_number})</span>
                            {user.kyc_document_url && (
                              <a href={user.kyc_document_url} target="_blank" rel="noreferrer" className="text-[#CD2C58] font-bold hover:underline inline-flex items-center">
                                View <ExternalLink className="w-3 h-3 ml-0.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role === 'VENDOR' ? (
                        <button
                          onClick={() => handleToggleApproval(user.id, user.is_approved, user.name || user.business_name)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
                            user.is_approved
                              ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {user.is_approved ? 'Revoke Authorization' : 'Authorize Vendor'}
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {user.kyc_status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdateKyc(user.id, 'VERIFIED', user.name)}
                                className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                              >
                                Approve KYC
                              </button>
                              <button
                                onClick={() => handleUpdateKyc(user.id, 'REJECTED', user.name)}
                                className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
