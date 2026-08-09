"use client";

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, RefreshCw, Loader2, ChevronLeft, ChevronRight, AlertTriangle, Filter, Eye, X, CheckCircle2, QrCode, Package, ArrowUpRight, ArrowDownLeft, ShieldCheck, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { adminApi, orderApi } from '@/lib/api';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 1)); // Default Aug 2026
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [activeView, setActiveView] = useState<'gantt' | 'pickups_returns'>('gantt');
  const [showScanner, setShowScanner] = useState(false);

  // Return Inspection & Deposit Settlement State
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [condition, setCondition] = useState<'EXCELLENT' | 'MINOR_SCRATCH' | 'DAMAGED' | 'MISSING_PARTS'>('EXCELLENT');
  const [damageCharge, setDamageCharge] = useState('0');
  const [lateFeeCharge, setLateFeeCharge] = useState('0');
  const [processingReturn, setProcessingReturn] = useState(false);
  const [returnMessage, setReturnMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSchedule(monthStr);
      if (res.success && res.data) {
        setScheduleData(res.data);
      }
    } catch (e) {
      console.error('Failed to load schedule timeline', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [monthStr]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const handleProcessReturn = async () => {
    if (!selectedOrder) return;
    setProcessingReturn(true);
    setReturnMessage(null);

    const dmg = parseFloat(damageCharge) || 0;
    const late = parseFloat(lateFeeCharge) || 0;
    const deposit = Number(selectedOrder.security_deposit || selectedOrder.security_deposit_amount || 100);
    const refundAmount = Math.max(0, deposit - dmg - late);

    try {
      const res = await orderApi.refundDeposit(selectedOrder.id, refundAmount, `Condition: ${condition}. Damage: ₹${dmg}, Late: ₹${late}. Note: ${inspectionNotes}`);
      if (res.success) {
        setReturnMessage({ type: 'success', text: `Return processed & Security deposit refund of ₹${refundAmount.toFixed(2)} recorded successfully!` });
        fetchSchedule();
      } else {
        setReturnMessage({ type: 'error', text: res.message || 'Failed to process return settlement' });
      }
    } catch (err: any) {
      setReturnMessage({ type: 'error', text: err.message || 'Error executing return settlement' });
    } finally {
      setProcessingReturn(false);
    }
  };

  const products = scheduleData?.products || [];
  const orders = scheduleData?.orders || [];
  const conflicts = scheduleData?.conflicts || [];
  const daysInMonth = scheduleData?.daysInMonth || 31;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const categories = ['ALL', ...Array.from(new Set(products.map((p: any) => p.category).filter(Boolean))) as string[]];

  const filteredProducts = selectedCategory === 'ALL' 
    ? products 
    : products.filter((p: any) => p.category === selectedCategory);

  const getOrderForProductAndDay = (productId: string, day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const targetDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    for (const order of orders) {
      if (order.status === 'CANCELLED') continue;

      const items = order.items || [];
      const isProductInOrder = items.some((it: any) => it.product_id === productId || it.product?.id === productId);

      if (isProductInOrder) {
        if (order.start_date <= targetDateStr && order.end_date >= targetDateStr) {
          const isStartDay = order.start_date === targetDateStr;
          const isEndDay = order.end_date === targetDateStr;

          return {
            order,
            isStartDay,
            isEndDay,
            status: order.status,
            orderNumber: order.order_number || order.id.slice(0, 8),
            customerName: order.customer?.name || 'Customer',
          };
        }
      }
    }
    return null;
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-[calc(100vh-3.5rem)] space-y-6">
      <BarcodeScannerModal 
        isOpen={showScanner} 
        onClose={() => setShowScanner(false)} 
        onScanSuccess={(code) => {
          setShowScanner(false);
          const found = orders.find((o: any) => (o.order_number && o.order_number.includes(code)) || o.id.includes(code));
          if (found) {
            setSelectedOrder(found);
          } else if (orders.length > 0) {
            setSelectedOrder(orders[0]);
          }
        }}
      />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#CD2C58]" /> Pickup & Return Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage daily equipment pickups, return inspections, deposit refunds, and overbooking matrices.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold">
            <button
              onClick={() => setActiveView('gantt')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeView === 'gantt' ? 'bg-white text-[#CD2C58] shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Gantt Matrix
            </button>
            <button
              onClick={() => setActiveView('pickups_returns')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeView === 'pickups_returns' ? 'bg-white text-[#CD2C58] shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Package className="w-3.5 h-3.5" /> Pickups & Returns
            </button>
          </div>

          <button
            onClick={() => setShowScanner(true)}
            className="px-3.5 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-gray-800 flex items-center gap-1.5 transition-colors"
          >
            <QrCode className="w-4 h-4 text-emerald-400" /> Scan QR / Barcode
          </button>

          <button 
            onClick={fetchSchedule}
            className="px-3 py-2 bg-[#CD2C58] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#b02248] flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Conflict Warnings Banner */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm mb-2 text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            Overbooking Conflict Detected ({conflicts.length} incidents in {monthName})
          </div>
          <div className="flex flex-wrap gap-2">
            {conflicts.slice(0, 5).map((c: any, idx: number) => (
              <span key={idx} className="bg-white border border-amber-300 text-xs px-2.5 py-1 rounded-lg font-semibold shadow-2xs">
                📅 {c.date}: <strong>{c.product_name}</strong> ({c.booked_qty} booked / {c.quantity_on_hand} in stock)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 1: GANTT MATRIX TIMELINE */}
      {activeView === 'gantt' && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden flex flex-col h-[650px]">
          {/* Toolbar & Filter */}
          <div className="bg-gray-50/70 p-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-2xs overflow-hidden text-xs">
                <button onClick={handlePrevMonth} className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-700 border-r border-gray-200">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1.5 font-bold text-gray-900 min-w-[120px] text-center">{monthName}</span>
                <button onClick={handleNextMonth} className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-700 border-l border-gray-200">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#CD2C58] bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat === 'ALL' ? 'All Equipment Categories' : cat}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-gray-500 font-medium hidden sm:block">
              {filteredProducts.length} Equipment Products • {orders.length} Active Orders
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#CD2C58] mb-2" />
              Calculating rental schedule matrix...
            </div>
          ) : (
            <div className="flex-1 overflow-auto bg-gray-50">
              <div className="min-w-max">
                {/* Header Row (Days) */}
                <div className="flex border-b border-gray-200 sticky top-0 bg-white z-20 shadow-2xs">
                  <div className="w-64 shrink-0 border-r border-gray-200 p-4 font-bold text-gray-700 flex items-center bg-gray-50 text-xs uppercase tracking-wider">
                    Equipment Item
                  </div>
                  <div className="flex">
                    {daysArray.map(day => {
                      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                      return (
                        <div 
                          key={day} 
                          className={`w-12 shrink-0 border-r border-gray-200 py-2 flex flex-col items-center justify-center ${isWeekend ? 'bg-gray-100/70' : 'bg-white'}`}
                        >
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{dayOfWeek}</span>
                          <span className="text-xs font-bold text-gray-900">{day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Product Rows */}
                {filteredProducts.map((product: any) => (
                  <div key={product.id} className="flex border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
                    <div className="w-64 shrink-0 border-r border-gray-200 p-3 font-medium text-gray-800 text-xs bg-white sticky left-0 z-10 flex flex-col justify-center shadow-2xs">
                      <span className="font-bold text-gray-900 truncate">{product.name}</span>
                      <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span className="text-[#CD2C58] font-bold">₹{product.base_price}/day</span>
                        <span className="text-gray-500 font-semibold bg-gray-100 px-1.5 py-0.5 rounded">Stock: {product.quantity_on_hand}</span>
                      </div>
                    </div>

                    <div className="flex relative">
                      {daysArray.map(day => {
                        const cell = getOrderForProductAndDay(product.id, day);
                        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                        return (
                          <div 
                            key={day} 
                            className={`w-12 shrink-0 border-r border-gray-200 h-14 relative flex items-center justify-center p-0.5 ${isWeekend ? 'bg-gray-100/40' : 'bg-white'}`}
                          >
                            {cell ? (
                              <div 
                                onClick={() => {
                                  setSelectedOrder(cell.order);
                                  setDamageCharge('0');
                                  setLateFeeCharge('0');
                                  setReturnMessage(null);
                                }}
                                className={`w-full h-9 cursor-pointer transition-transform hover:scale-105 rounded text-[9px] font-bold text-white flex flex-col items-center justify-center p-0.5 leading-tight truncate shadow-2xs ${
                                  cell.status === 'CONFIRMED' ? 'bg-[#CD2C58]' :
                                  cell.status === 'PICKED_UP' || cell.status === 'ACTIVE' ? 'bg-blue-600' :
                                  cell.status === 'RETURNED' || cell.status === 'COMPLETED' ? 'bg-emerald-600' :
                                  'bg-amber-600'
                                }`}
                              >
                                <span className="truncate">#{cell.orderNumber}</span>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="p-3 border-t border-gray-200 bg-white flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-gray-700">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-xs bg-[#CD2C58]" /> Confirmed Order</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-xs bg-blue-600" /> Active Rental / Picked Up</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-xs bg-emerald-600" /> Returned & Settled</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-xs bg-amber-600" /> Draft / Quotation</div>
          </div>
        </div>
      )}

      {/* VIEW 2: DAILY PICKUPS & RETURNS CHECKLIST */}
      {activeView === 'pickups_returns' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Pickups Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Scheduled Equipment Pickups</h3>
                  <p className="text-xs text-gray-500">Orders ready for customer pickup or store dispatch</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                {orders.filter((o: any) => o.status === 'CONFIRMED').length} Pending Pickups
              </span>
            </div>

            {orders.filter((o: any) => o.status === 'CONFIRMED').length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">
                No scheduled pickups due today.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {orders.filter((o: any) => o.status === 'CONFIRMED').map((ord: any) => (
                  <div key={ord.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex justify-between items-center gap-4">
                    <div>
                      <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>Order #{ord.order_number || ord.id.slice(0, 8)}</span>
                        <span className="text-xs font-normal text-gray-500">({ord.customer?.name || 'Customer'})</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1 flex items-center gap-3">
                        <span>📅 Pickup: <strong>{ord.start_date}</strong></span>
                        <span>📞 <strong>{ord.customer?.phone || ord.phone || 'N/A'}</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setDamageCharge('0');
                        setLateFeeCharge('0');
                        setReturnMessage(null);
                      }}
                      className="px-3.5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-2xs"
                    >
                      Confirm Pickup
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Returns & Inspection Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Scheduled Returns & Inspection</h3>
                  <p className="text-xs text-gray-500">Equipment returns, condition inspection, & deposit refunds</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                {orders.filter((o: any) => o.status === 'PICKED_UP' || o.status === 'ACTIVE').length} Active Returns
              </span>
            </div>

            {orders.filter((o: any) => o.status === 'PICKED_UP' || o.status === 'ACTIVE').length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">
                No active equipment returns pending.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {orders.filter((o: any) => o.status === 'PICKED_UP' || o.status === 'ACTIVE').map((ord: any) => (
                  <div key={ord.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex justify-between items-center gap-4">
                    <div>
                      <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>Order #{ord.order_number || ord.id.slice(0, 8)}</span>
                        <span className="text-xs font-normal text-gray-500">({ord.customer?.name || 'Customer'})</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1 flex items-center gap-3">
                        <span>📅 Due Return: <strong>{ord.end_date}</strong></span>
                        <span className="text-emerald-700 font-bold">🔒 Deposit: ₹{ord.security_deposit || 100}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setDamageCharge('0');
                        setLateFeeCharge('0');
                        setReturnMessage(null);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-2xs"
                    >
                      Inspect & Settle Return
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order & Return Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Order #{selectedOrder.order_number || selectedOrder.id.slice(0, 8)}</h3>
                <p className="text-xs text-gray-500">Customer: {selectedOrder.customer?.name || 'Guest User'}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {returnMessage && (
              <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${returnMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {returnMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                <span>{returnMessage.text}</span>
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-[11px] text-gray-500 font-bold uppercase block">Rental Start</span>
                  <span className="font-bold text-gray-900 text-xs">{selectedOrder.start_date}</span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 font-bold uppercase block">Rental End (Scheduled Return)</span>
                  <span className="font-bold text-gray-900 text-xs">{selectedOrder.end_date}</span>
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 text-xs space-y-1">
                <div className="font-bold text-purple-900">👤 {selectedOrder.customer?.name || 'Customer'}</div>
                {selectedOrder.customer?.phone && <div>📞 <a href={`tel:${selectedOrder.customer.phone}`} className="underline hover:text-purple-700">{selectedOrder.customer.phone}</a></div>}
                {(selectedOrder.delivery_address || selectedOrder.customer?.address) && (
                  <div className="text-gray-700">📍 {selectedOrder.delivery_address || selectedOrder.customer?.address}</div>
                )}
              </div>

              {/* AI Damage Inspector & 3-Photo Inspection Suite */}
              <div className="bg-gradient-to-br from-[#CD2C58]/5 to-purple-50 p-4 rounded-2xl border border-pink-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#CD2C58]" /> 3-Photo Handover & AI Visual Inspection
                  </h4>
                  <button
                    onClick={async () => {
                      if (!selectedOrder) return;
                      setProcessingReturn(true);
                      const res = await adminApi.runAiDamageInspect(selectedOrder.id);
                      if (res.success && res.data?.assessment) {
                        const asm = res.data.assessment;
                        setDamageCharge(asm.recommendedFee.toString());
                        setReturnMessage({
                          type: 'success',
                          text: `🤖 AI Damage Inspection Completed (${asm.confidenceScore} Confidence)! Score: ${asm.damageScore}%. ${asm.detectedFlaws.join(' ')}`
                        });
                      } else {
                        setReturnMessage({ type: 'error', text: res.message || 'AI Inspection Failed' });
                      }
                      setProcessingReturn(false);
                    }}
                    disabled={processingReturn}
                    className="px-3 py-1.5 bg-[#CD2C58] text-white text-xs font-bold rounded-xl hover:bg-[#b02248] transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                  >
                    🤖 Run AI Damage Detection Engine
                  </button>
                </div>

                {/* Pre & Post Photo Comparison Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                    <span className="font-bold text-gray-700 block">Pre-Rental Handover (3 Photos)</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[0, 1, 2].map((idx) => {
                        const url = selectedOrder.pre_rental_images?.[idx];
                        return (
                          <div key={idx} className="h-14 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center text-[10px] text-gray-400">
                            {url ? <img src={url} alt="Pre" className="w-full h-full object-cover" /> : `Slot ${idx + 1}`}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                    <span className="font-bold text-gray-700 block">Post-Rental Return (3 Photos)</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[0, 1, 2].map((idx) => {
                        const url = selectedOrder.post_rental_images?.[idx];
                        return (
                          <div key={idx} className="h-14 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center text-[10px] text-gray-400">
                            {url ? <img src={url} alt="Post" className="w-full h-full object-cover" /> : `Slot ${idx + 1}`}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Condition & Penalty Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Equipment Condition</label>
                    <select
                      value={condition}
                      onChange={(e: any) => setCondition(e.target.value)}
                      className="w-full text-xs p-2 border border-gray-300 rounded-xl bg-white focus:ring-1 focus:ring-[#CD2C58]"
                    >
                      <option value="EXCELLENT">Good / Excellent (Full Refund)</option>
                      <option value="MINOR_SCRATCH">Minor Scratch (Normal Wear)</option>
                      <option value="DAMAGED">Damaged Equipment (Deduct Fee)</option>
                      <option value="MISSING_PARTS">Missing Parts / Accessories</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">AI Recommended Damage Fee (₹)</label>
                    <input
                      type="number"
                      value={damageCharge}
                      onChange={(e) => setDamageCharge(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-xs p-2 border border-gray-300 rounded-xl bg-white focus:ring-1 focus:ring-[#CD2C58] font-bold text-[#CD2C58]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Late Return Fee (₹)</label>
                    <input
                      type="number"
                      value={lateFeeCharge}
                      onChange={(e) => setLateFeeCharge(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-xs p-2 border border-gray-300 rounded-xl bg-white focus:ring-1 focus:ring-[#CD2C58]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Held Security Deposit</label>
                    <div className="text-sm font-bold text-emerald-700 p-2 bg-white rounded-xl border border-gray-200">
                      ₹{Number(selectedOrder.security_deposit || selectedOrder.security_deposit_amount || 100).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-pink-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-700">Calculated Net Refund Credited to Customer Wallet:</span>
                  <span className="font-black text-sm text-emerald-700">
                    ₹{Math.max(0, Number(selectedOrder.security_deposit || 100) - parseFloat(damageCharge || '0') - parseFloat(lateFeeCharge || '0')).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button 
                onClick={async () => {
                  if (!selectedOrder) return;
                  setProcessingReturn(true);
                  const netRefund = Math.max(0, Number(selectedOrder.security_deposit || 100) - parseFloat(damageCharge || '0') - parseFloat(lateFeeCharge || '0'));
                  const res = await adminApi.settleDepositToWallet(selectedOrder.id, {
                    refund_amount: netRefund,
                    damage_deduction: parseFloat(damageCharge || '0') + parseFloat(lateFeeCharge || '0'),
                    notes: `Security deposit refund for Order #${selectedOrder.order_number}`
                  });

                  if (res.success) {
                    setReturnMessage({ type: 'success', text: `Success! ₹${netRefund.toFixed(2)} credited into customer's digital wallet balance!` });
                    setTimeout(() => {
                      setSelectedOrder(null);
                      fetchSchedule();
                    }, 1500);
                  } else {
                    setReturnMessage({ type: 'error', text: res.message || 'Settlement failed' });
                  }
                  setProcessingReturn(false);
                }}
                disabled={processingReturn}
                className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {processingReturn ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Settle & Credit Refund to Customer Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
