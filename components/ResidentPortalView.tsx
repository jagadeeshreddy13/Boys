'use client';

import React, { useState } from 'react';
import { Resident, Invoice, Payment, Complaint, Announcement, Hostel } from '@/lib/db/types';
import { User, BedDouble, IndianRupee, Wrench, Bell, CreditCard, ShieldCheck, CheckCircle, AlertCircle, FileText, Utensils, Phone, Clock } from 'lucide-react';

interface ResidentPortalViewProps {
  resident: Resident;
  invoices: Invoice[];
  payments: Payment[];
  complaints: Complaint[];
  announcements: Announcement[];
  hostel: Hostel;
  currentTab?: 'OVERVIEW' | 'BILLS' | 'COMPLAINTS' | 'NOTICES' | 'MESS_MENU';
  onTabChange?: (tab: 'OVERVIEW' | 'BILLS' | 'COMPLAINTS' | 'NOTICES' | 'MESS_MENU') => void;
  onPayInvoice: (invoice: Invoice) => void;
  onFileComplaint: () => void;
  onRequestCheckout: () => void;
  onOpenReceipt: (payment: Payment) => void;
}

export default function ResidentPortalView({
  resident,
  invoices,
  payments,
  complaints,
  announcements,
  hostel,
  currentTab,
  onTabChange,
  onPayInvoice,
  onFileComplaint,
  onRequestCheckout,
  onOpenReceipt
}: ResidentPortalViewProps) {
  const [internalTab, setInternalTab] = useState<'OVERVIEW' | 'BILLS' | 'COMPLAINTS' | 'NOTICES' | 'MESS_MENU'>('OVERVIEW');
  const activeTab = currentTab || internalTab;

  const handleSelectTab = (tab: 'OVERVIEW' | 'BILLS' | 'COMPLAINTS' | 'NOTICES' | 'MESS_MENU') => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const pendingInvoices = invoices.filter(i => i.residentId === resident.id && i.outstandingBalance > 0);
  const residentComplaints = complaints.filter(c => c.residentId === resident.id);
  const residentPayments = payments.filter(p => p.residentId === resident.id);

  const messMenu = [
    { day: 'Monday', breakfast: 'Idli, Sambar, Coconut Chutney, Tea/Coffee', lunch: 'Rice, Sambar, Aloo Fry, Curd, Pickle', dinner: 'Chapati, Veg Kurma, Rice, Dal' },
    { day: 'Tuesday', breakfast: 'Puri Bhaji, Tea/Coffee', lunch: 'Rice, Tomato Dal, Tindora Fry, Curd', dinner: 'Veg Biryani, Mirchi Ka Salan, Raitha' },
    { day: 'Wednesday', breakfast: 'Upma, Ginger Chutney, Tea/Coffee', lunch: 'Rice, Drumstick Sambar, Cabbage Fry, Curd', dinner: 'Chapati, Egg Curry / Paneer Curry, Rice' },
    { day: 'Thursday', breakfast: 'Mysore Bonda, Chutney, Tea', lunch: 'Rice, Palak Dal, Raw Banana Fry, Curd', dinner: 'Chapati, Mixed Veg Curry, Rasam Rice' },
    { day: 'Friday', breakfast: 'Ghee Karam Dosa, Chutney, Coffee', lunch: 'Rice, Andhra Pappu, Gobi 65, Curd', dinner: 'South Indian Thali, Sweet (Gulab Jamun)' },
    { day: 'Saturday', breakfast: 'Poha / Pongal, Chutney, Tea', lunch: 'Rice, Lemon Rice, Potato Kurma, Curd', dinner: 'Chapati, Chana Masala, Jeera Rice' },
    { day: 'Sunday', breakfast: 'Uttapam / Vada, Sambar, Coffee', lunch: 'Hyderabadi Special Dum Biryani / Veg Biryani, Raitha, Gulab Jamun', dinner: 'Light Khichdi, Papad, Curd Rice' }
  ];

  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysMenu = messMenu.find(m => m.day === todayDayName) || messMenu[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 text-white shadow-xl border border-amber-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border-2 border-amber-400/60 overflow-hidden bg-slate-700 shrink-0">
              <img
                src={resident.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={resident.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">{resident.fullName}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {resident.status}
                </span>
              </div>
              <p className="text-xs text-amber-300/90 mt-0.5">
                Room {resident.roomNumber} - Bed {resident.bedNumber} • ID: {resident.id}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {resident.collegeOrCompany} • {resident.feePlanName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onFileComplaint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all backdrop-blur-xs"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              New Ticket
            </button>
            <button
              onClick={onRequestCheckout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl border border-rose-500/40 transition-all"
            >
              Vacate / Checkout Request
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => handleSelectTab('OVERVIEW')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'OVERVIEW'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Room & Overview
        </button>
        <button
          onClick={() => handleSelectTab('BILLS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'BILLS'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Fee Invoices & Receipts
        </button>
        <button
          onClick={() => handleSelectTab('COMPLAINTS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'COMPLAINTS'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Tickets ({residentComplaints.length > 0 ? residentComplaints.length : 1})
        </button>
        <button
          onClick={() => handleSelectTab('MESS_MENU')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'MESS_MENU'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Mess Menu (Weekly)
        </button>
        <button
          onClick={() => handleSelectTab('NOTICES')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'NOTICES'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Hostel Notices ({announcements.length > 0 ? announcements.length : 2})
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Room Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">Room Allocation</h3>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                Active Bed
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Hostel Branch:</span>
                <span className="font-semibold text-slate-800">Main Campus (Madhapur)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room Number:</span>
                <span className="font-bold text-slate-900">Room {resident.roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bed Allotment:</span>
                <span className="font-bold text-slate-900">Bed {resident.bedNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly Rent:</span>
                <span className="font-bold text-emerald-700">₹{resident.monthlyRent.toLocaleString('en-IN')} / mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security Deposit Paid:</span>
                <span className="font-bold text-slate-800">₹{resident.securityDeposit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Joining Date:</span>
                <span className="font-semibold text-slate-800">{resident.joiningDate}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Amenities Provided:</p>
              <p>• High-speed 300 Mbps Wi-Fi (SSID: Srinivasa_Hostel_5G)</p>
              <p>• Daily room sweeping and weekly mopping</p>
              <p>• 24x7 Geyser hot water and RO drinking water</p>
              <p>• 3 Times South & North Indian hygienic food</p>
            </div>
          </div>

          {/* Dues & Pay Quick Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Fee Invoices & Receipts</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                resident.outstandingBalance === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {resident.outstandingBalance === 0 ? 'All Settled' : 'Payment Pending'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 uppercase font-semibold">Current Invoice Balance</span>
              <p className={`text-2xl font-extrabold mt-1 ${
                resident.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                ₹{resident.outstandingBalance.toLocaleString('en-IN')}
              </p>
              {pendingInvoices.length > 0 && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Scheduled for {pendingInvoices[0].dueDate} ({pendingInvoices[0].billingPeriod})
                </p>
              )}
            </div>

            {pendingInvoices.length > 0 ? (
              <button
                onClick={() => onPayInvoice(pendingInvoices[0])}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Pay Pending Rent Online (UPI / Card)
              </button>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>All hostel fees are fully settled! Keep it up.</span>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => setActiveTab('BILLS')}
                className="text-xs text-amber-700 font-semibold hover:underline"
              >
                View all past receipts & tax invoices →
              </button>
            </div>
          </div>

          {/* Today's Mess Menu Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">Today&apos;s Mess Menu</h3>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">
                {todayDayName}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/60">
                <span className="font-bold text-amber-900 block text-[11px] mb-0.5">🍳 Breakfast (7:30 AM - 10:00 AM)</span>
                <p className="text-slate-700">{todaysMenu.breakfast}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block text-[11px] mb-0.5">🍛 Lunch (12:30 PM - 3:00 PM)</span>
                <p className="text-slate-700">{todaysMenu.lunch}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block text-[11px] mb-0.5">🍲 Dinner (7:30 PM - 10:00 PM)</span>
                <p className="text-slate-700">{todaysMenu.dinner}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('MESS_MENU')}
              className="w-full text-center text-xs text-amber-700 font-semibold hover:underline pt-1"
            >
              Check complete 7-day schedule →
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BILLS & INVOICES */}
      {activeTab === 'BILLS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 mb-4">My Invoices & Payment Schedule</h3>
            <div className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <div key={inv.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{inv.invoiceNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium">{inv.billingPeriod}</p>
                    <p className="text-[11px] text-slate-400">Due Date: {inv.dueDate}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Total: ₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                      {inv.outstandingBalance > 0 ? (
                        <span className="text-xs font-bold text-rose-600 block">
                          Balance Due: ₹{inv.outstandingBalance.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 block">Fully Paid</span>
                      )}
                    </div>

                    {inv.outstandingBalance > 0 && (
                      <button
                        onClick={() => onPayInvoice(inv)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                      >
                        Pay ₹{inv.outstandingBalance}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Receipts History */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 mb-4">Official Payment Receipts</h3>
            <div className="divide-y divide-slate-100">
              {residentPayments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-slate-900">{p.receiptNumber}</span>
                    <p className="text-xs text-slate-600 mt-0.5">Paid ₹{p.amount.toLocaleString('en-IN')} via {p.paymentMethod}</p>
                    <p className="text-[11px] text-slate-400">Date: {p.paymentDate} • Ref: {p.referenceNumber}</p>
                  </div>
                  <button
                    onClick={() => onOpenReceipt(p)}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Receipt
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: COMPLAINTS */}
      {activeTab === 'COMPLAINTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">My Service Tickets & Grievances</h3>
            <button
              onClick={onFileComplaint}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" /> Raise New Ticket
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {residentComplaints.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No tickets reported. Everything is running smoothly!
              </div>
            ) : (
              residentComplaints.map((c) => (
                <div key={c.id} className="py-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 uppercase">{c.category}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        c.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-700">{c.description}</p>
                  {c.assignedStaffName && (
                    <p className="text-[11px] text-slate-500">
                      Assigned to: <strong className="text-slate-700">{c.assignedStaffName}</strong>
                    </p>
                  )}
                  {c.workNotes && (
                    <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200/70">
                      Staff Update: {c.workNotes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: MESS MENU */}
      {activeTab === 'MESS_MENU' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">Weekly Mess Dining Schedule</h3>
            <p className="text-xs text-slate-500">Prepared fresh with pure oil and RO water. 3 meals daily included in fee plan.</p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">Breakfast (7:30 - 10:00 AM)</th>
                  <th className="px-4 py-3">Lunch (12:30 - 3:00 PM)</th>
                  <th className="px-4 py-3">Dinner (7:30 - 10:00 PM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {messMenu.map((m) => (
                  <tr
                    key={m.day}
                    className={`hover:bg-slate-50/50 ${
                      m.day === todayDayName ? 'bg-amber-50/60 font-medium' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-1.5">
                      {m.day} {m.day === todayDayName && <span className="text-[10px] text-amber-700 font-bold">(Today)</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{m.breakfast}</td>
                    <td className="px-4 py-3 text-slate-700">{m.lunch}</td>
                    <td className="px-4 py-3 text-slate-700">{m.dinner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: NOTICES */}
      {activeTab === 'NOTICES' && (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{a.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  a.priority === 'URGENT'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {a.priority} Notice
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{a.message}</p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex justify-between">
                <span>Posted by: {a.createdBy}</span>
                <span>Date: {a.startDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
