'use client';

import React, { useState } from 'react';
import { Resident } from '@/lib/db/types';
import { LogOut, IndianRupee, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: Resident | null;
  onSuccess: (checkoutData: any) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  resident,
  onSuccess
}: CheckoutModalProps) {
  const [damageCharges, setDamageCharges] = useState<number>(0);
  const [damageNotes, setDamageNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !resident) return null;

  const deposit = resident.securityDeposit || 0;
  const pendingDues = resident.outstandingBalance || 0;
  const damage = Number(damageCharges) || 0;
  const totalDeductions = pendingDues + damage;
  const refundAmount = Math.max(0, deposit - totalDeductions);
  const amountDueFromResident = Math.max(0, totalDeductions - deposit);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId: resident.id,
          damageCharges: damage,
          damageNotes,
          processor: 'Ramesh Naidu (Manager)'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <LogOut className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-base">Process Resident Checkout</h3>
              <p className="text-xs text-slate-400">Sri Srinivasa Luxury Boys Hostel ERP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Resident Overview */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-900 text-sm">{resident.fullName}</span>
              <span className="font-mono text-slate-500">{resident.id}</span>
            </div>
            <div className="text-slate-600 flex gap-4">
              <span>Room {resident.roomNumber} - Bed {resident.bedNumber}</span>
              <span>Joined: {resident.joiningDate}</span>
            </div>
          </div>

          {/* Financial Settlement Breakdown */}
          <div className="space-y-2 p-4 bg-amber-50/50 rounded-xl border border-amber-200 text-xs">
            <h4 className="font-bold text-slate-900 text-xs mb-2">Deposit & Dues Settlement Breakdown</h4>
            
            <div className="flex justify-between">
              <span className="text-slate-600">Initial Security Deposit Paid:</span>
              <span className="font-bold text-slate-900">₹{deposit.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between text-rose-600 font-medium">
              <span>Pending Invoices / Arrears:</span>
              <span>- ₹{pendingDues.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between text-rose-600 font-medium">
              <span>Room Damage / Repair Deductions:</span>
              <span>- ₹{damage.toLocaleString('en-IN')}</span>
            </div>

            <div className="border-t border-amber-300 pt-2.5 mt-2 flex justify-between font-extrabold text-sm">
              {refundAmount > 0 ? (
                <>
                  <span className="text-emerald-800">Net Refund Payable to Resident:</span>
                  <span className="text-emerald-800">₹{refundAmount.toLocaleString('en-IN')}</span>
                </>
              ) : (
                <>
                  <span className="text-rose-800">Deficit Due from Resident:</span>
                  <span className="text-rose-800">₹{amountDueFromResident.toLocaleString('en-IN')}</span>
                </>
              )}
            </div>
          </div>

          {/* Damage Assessment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Damage / Loss Assessment Charge (₹)
            </label>
            <input
              type="number"
              min={0}
              value={damageCharges}
              onChange={(e) => setDamageCharges(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Room Inspection Notes
            </label>
            <textarea
              rows={2}
              value={damageNotes}
              onChange={(e) => setDamageNotes(e.target.value)}
              placeholder="e.g. Keys returned, cupboard cleaned, fan and switchboard verified in good condition."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
            <p className="font-semibold text-slate-800 mb-0.5">Automated Post-Checkout Actions:</p>
            <p>1. Bed {resident.roomNumber}-{resident.bedNumber} will be immediately freed to &apos;AVAILABLE&apos; status for new admissions.</p>
            <p>2. Resident status will transition to &apos;CHECKED_OUT&apos;.</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Checkout & Vacate Bed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
