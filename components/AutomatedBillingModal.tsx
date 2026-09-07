'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Loader2, CheckCircle, AlertCircle, X, Sparkles } from 'lucide-react';

interface AutomatedBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export default function AutomatedBillingModal({
  isOpen,
  onClose,
  onSuccess
}: AutomatedBillingModalProps) {
  const [billingPeriod, setBillingPeriod] = useState(
    new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  );
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunBatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BATCH_MONTHLY_BILLING',
          billingPeriod,
          dueDate,
          discountPercent
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Batch billing run failed');
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Billing run failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-base">Monthly Billing Engine</h3>
              <p className="text-xs text-slate-400">Automated Rent & Mess Invoicing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1 text-slate-700">
            <p className="font-bold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Idempotent Batch Engine
            </p>
            <p className="text-[11px] leading-relaxed">
              Generates individual itemized invoices (Rent + Mess + Electricity + Prior Arrears) for all active residents. Residents who already have an invoice for this period will be safely skipped.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Billing Cycle / Period Name
            </label>
            <input
              type="text"
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
              placeholder="e.g. October 2024"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Payment Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Hostel Anniversary / Festive Discount (%)
            </label>
            <input
              type="number"
              min={0}
              max={50}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-slate-400">Optional flat discount applied to all generated invoices</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleRunBatch}
              className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Run Automated Invoicing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
