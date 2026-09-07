'use client';

import React, { useState } from 'react';
import { Complaint, ComplaintPriority, Resident } from '@/lib/db/types';
import { Wrench, AlertCircle, Loader2, X } from 'lucide-react';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  residents: Resident[];
  activeResident?: Resident | null;
  onSuccess: (complaint: Complaint) => void;
}

export default function ComplaintModal({
  isOpen,
  onClose,
  residents,
  activeResident,
  onSuccess
}: ComplaintModalProps) {
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [category, setCategory] = useState<'PLUMBING' | 'ELECTRICAL' | 'CLEANING' | 'WIFI' | 'MESS_FOOD' | 'CARPENTRY' | 'OTHER'>('PLUMBING');
  const [priority, setPriority] = useState<ComplaintPriority>('MEDIUM');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const residentId = activeResident?.id || selectedResidentId || residents[0]?.id || '';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description of the issue');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId: activeResident?.id || residentId,
          category,
          priority,
          description,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to file ticket');

      onSuccess(data.complaint);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ticket creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Wrench className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-base">File Maintenance Ticket</h3>
              <p className="text-xs text-slate-400">Hostel Repair & Grievance</p>
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

          {!activeResident && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Resident</label>
              <select
                value={residentId}
                onChange={(e) => setSelectedResidentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
              >
                {residents.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.fullName} ({r.roomNumber ? `Room ${r.roomNumber}` : 'No Room'}) - {r.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Issue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
              >
                <option value="PLUMBING">Plumbing (Tap / Geyser / Drain)</option>
                <option value="ELECTRICAL">Electrical (Fan / Light / Switch)</option>
                <option value="CLEANING">Cleaning & Housekeeping</option>
                <option value="WIFI">Wi-Fi & Internet</option>
                <option value="MESS_FOOD">Food & Mess</option>
                <option value="CARPENTRY">Carpentry & Furniture</option>
                <option value="OTHER">Other Issue</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent (Immediate attention)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Issue Description & Room Location
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Geyser in attached washroom not heating water properly since yesterday morning."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
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
              className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Complaint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
