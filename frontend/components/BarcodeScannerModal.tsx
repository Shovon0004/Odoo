"use client";

import React, { useState } from 'react';
import { QrCode, X, Search, CheckCircle2, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (code: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScanSuccess }: BarcodeScannerModalProps) {
  const router = useRouter();
  const [manualCode, setManualCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateScan = (codeToScan: string) => {
    const code = codeToScan.trim();
    if (!code) return;

    setStatusMessage(`Scanned Tag/Order ID: #${code}`);

    if (onScanSuccess) {
      onScanSuccess(code);
    } else {
      setTimeout(() => {
        onClose();
        router.push(`/admin/orders?search=${encodeURIComponent(code)}`);
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#CD2C58]/10 text-[#CD2C58] rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">QR / Barcode Scanner</h3>
              <p className="text-xs text-gray-500">Scan pickup/return tag or order barcode</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Camera Viewfinder Simulation */}
        <div className="relative w-full h-44 bg-gray-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center text-white mb-4 border-2 border-dashed border-[#CD2C58]/40">
          <div className="absolute inset-4 border-2 border-[#CD2C58] rounded-xl opacity-75 animate-pulse" />
          <Camera className="w-10 h-10 text-[#CD2C58] mb-2 animate-bounce" />
          <span className="text-xs font-bold tracking-wider uppercase text-gray-300">Aim Camera at Equipment Barcode</span>
          <span className="text-[10px] text-gray-400 mt-1">Live Optical Scanner Active</span>
        </div>

        {statusMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Manual Barcode Input */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Simulate / Manual Barcode Scan</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. ORD-1001 or Product Barcode"
              className="flex-1 text-xs border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CD2C58]/20 focus:border-[#CD2C58] outline-none"
            />
            <button
              onClick={() => handleSimulateScan(manualCode)}
              className="px-4 py-2 bg-[#CD2C58] text-white font-bold text-xs rounded-xl hover:bg-[#b02248] transition-colors"
            >
              Scan
            </button>
          </div>

          <div className="pt-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Quick Test Barcodes:</span>
            <div className="flex flex-wrap gap-1.5">
              {['ORD-1001', 'ORD-1002', 'EQUIP-PRO-01', 'RETURN-CHECKIN'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleSimulateScan(tag)}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px] rounded-lg transition-colors"
                >
                  🏷️ {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
