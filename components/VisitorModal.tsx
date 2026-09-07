'use client';

import React, { useState } from 'react';
import { Resident, VisitorLog } from '@/lib/db/types';
import { UserPlus, AlertCircle, Loader2, X } from 'lucide-react';

interface VisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  residents: Resident[];
  onSuccess: (visitor: VisitorLog) => void;
}

export default function VisitorModal({
  isOpen,
  onClose,
  residents,
  onSuccess
}: VisitorModalProps) {
  const [visitorName, setVisitorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [purpose, setPurpose] = useState('Parent Visit');
  const [idProof, setIdProof] = useState('Aadhaar / ID Card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const residentId = selectedResidentId || residents[0]?.id || '';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !mobile || !residentId) {
      setError('Please provide visitor name, mobile, and resident.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName,
          mobile,
          residentId,
          purpose,
          idProof,
          approver: 'Warden (K. Srinivas)'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log visitor');

      onSuccess(data.visitor);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Visitor log failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-base">New Visitor Entry</h3>
              <p className="text-xs text-slate-400">Hostel Security Register</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Visitor Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Chandra (Parent)"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Visitor Mobile (+91) *</label>
            <input
              type="tel"
              required
              placeholder="e.g. 98480 11223"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Resident Being Visited *</label>
            <select
              value={residentId}
              onChange={(e) => setSelectedResidentId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
            >
              {residents.map(r => (
                <option key={r.id} value={r.id}>
                  {r.fullName} (Room {r.roomNumber || 'N/A'}) - {r.id}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purpose of Visit</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
              >
                <option value="Parent Visit">Parent Visit</option>
                <option value="Brother / Family">Brother / Family</option>
                <option value="Friend / Classmate">Friend / Classmate</option>
                <option value="Delivery / Courier">Delivery / Courier</option>
                <option value="Official / Vendor">Official / Vendor</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ID Proof Shown</label>
              <input
                type="text"
                value={idProof}
                onChange={(e) => setIdProof(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
            Visiting hours: 8:00 AM – 9:00 PM. Visitors are only allowed in the Ground Floor reception lounge.
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
              type="submit"
              disabled={loading}
              className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Record Visitor Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
