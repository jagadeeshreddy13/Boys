'use client';

import React, { useState } from 'react';
import { Hostel } from '@/lib/db/types';
import {
  QrCode,
  X,
  Check,
  Copy,
  AlertCircle,
  Loader2,
  Building2,
  CreditCard,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface ChangeUpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostel: Hostel;
  currentUpiId?: string;
  onSuccess: (updatedHostel: Hostel, newUpiId: string) => void;
}

const COMMON_UPI_PROVIDERS = [
  { label: '@okaxis', desc: 'Google Pay (Axis)' },
  { label: '@okhdfcbank', desc: 'Google Pay (HDFC)' },
  { label: '@okicici', desc: 'Google Pay (ICICI)' },
  { label: '@oksbi', desc: 'Google Pay (SBI)' },
  { label: '@paytm', desc: 'Paytm Payments' },
  { label: '@ybl', desc: 'PhonePe (Yes Bank)' },
  { label: '@ibl', desc: 'PhonePe (IndusInd)' }
];

export default function ChangeUpiModal({
  isOpen,
  onClose,
  hostel,
  currentUpiId,
  onSuccess
}: ChangeUpiModalProps) {
  const [upiId, setUpiId] = useState(currentUpiId || hostel.bankDetails?.upiId || 'srisrinivasahostel@okaxis');
  const [accountName, setAccountName] = useState(hostel.bankDetails?.accountName || hostel.name);
  const [accountNumber, setAccountNumber] = useState(hostel.bankDetails?.accountNumber || '50200049281928');
  const [ifsc, setIfsc] = useState(hostel.bankDetails?.ifsc || 'HDFC0001234');
  const [bankName, setBankName] = useState(hostel.bankDetails?.bankName || 'HDFC Bank, Madhapur Branch');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setError(null);
    setCopied(false);
    onClose();
  };

  const handleCopyCurrent = () => {
    const toCopy = currentUpiId || hostel.bankDetails?.upiId || '';
    if (toCopy) {
      navigator.clipboard.writeText(toCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleApplyProvider = (suffix: string) => {
    const currentHandle = upiId.includes('@') ? upiId.split('@')[0] : upiId;
    setUpiId(`${currentHandle || 'srisrinivasahostel'}${suffix}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUpi = upiId.trim();
    if (!cleanUpi || !cleanUpi.includes('@') || cleanUpi.endsWith('@') || cleanUpi.startsWith('@')) {
      setError('Please provide a valid UPI Virtual Payment Address (e.g., hostelname@hdfcbank or 9849012345@paytm).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'UPI_UPDATE',
          upiId: cleanUpi,
          bankDetails: {
            accountName: accountName.trim(),
            accountNumber: accountNumber.trim(),
            ifsc: ifsc.trim().toUpperCase(),
            bankName: bankName.trim(),
            upiId: cleanUpi
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update UPI settings');
      }

      onSuccess(data.hostel, cleanUpi);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving UPI settings.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Generate UPI string and QR Code preview
  const previewUpiString = `upi://pay?pa=${encodeURIComponent(upiId.trim() || 'srisrinivasahostel@okaxis')}&pn=${encodeURIComponent(accountName.trim() || 'Sri Srinivasa Hostel')}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(previewUpiString)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Hostel UPI & Payment Settings</h2>
              <p className="text-xs text-slate-500 font-medium">
                Update the official UPI ID used for fee invoices, mess POS, and resident QR payments
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Active UPI Status */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Currently Active UPI Address
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-extrabold text-sm text-emerald-950">
                  {currentUpiId || hostel.bankDetails?.upiId || 'srisrinivasahostel@okaxis'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-200 text-emerald-900 text-[10px] font-bold rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Live
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyCurrent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 rounded-xl text-xs font-bold transition-colors shadow-2xs shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* New UPI ID Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              New Hostel UPI ID (VPA Handle) *
            </label>
            <div className="relative">
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. srisrinivasahostel@okhdfcbank"
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all shadow-2xs"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Payments made by residents via GPay, PhonePe, Paytm, or BHIM will credit directly to this handle.
            </p>
          </div>

          {/* Quick Bank Provider Suffix Shortcuts */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Quick Bank Handle Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_UPI_PROVIDERS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyProvider(p.label)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-[11px] font-semibold text-slate-700 hover:text-emerald-900 transition-colors"
                  title={p.desc}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Dynamic QR Code & Settlement Info */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-5">
            <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs shrink-0 flex flex-col items-center">
              {/* QR Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="UPI QR Code Preview"
                width={120}
                height={120}
                className="rounded-lg w-28 h-28 object-contain"
              />
              <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                Live QR Preview
              </span>
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <h4 className="font-bold text-xs text-slate-800">Dynamic Payment QR Sync</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Whenever this UPI ID is changed, all printed receipts, email/WhatsApp notifications, and the resident self-payment portal will automatically generate this updated QR code.
              </p>
              <div className="pt-1">
                <span className="inline-block px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-mono rounded-md truncate max-w-full">
                  {previewUpiString}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Account Settlement Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" /> Linked Settlement Bank Account
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Beneficiary Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Bank & Branch
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden uppercase"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Changes take effect immediately across all receipts and bills.
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !upiId.trim() || !upiId.includes('@')}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving UPI...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save UPI Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
