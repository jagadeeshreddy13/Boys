'use client';

import React, { useState, useEffect } from 'react';
import { Bed, Resident } from '@/lib/db/types';
import { ArrowLeftRight, BedDouble, AlertCircle, Loader2, X } from 'lucide-react';

interface BedTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: Resident | null;
  onSuccess: () => void;
}

export default function BedTransferModal({
  isOpen,
  onClose,
  resident,
  onSuccess
}: BedTransferModalProps) {
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    fetch('/api/beds?status=AVAILABLE')
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setAvailableBeds(data.beds || []);
          setSelectedBedId('');
          setError(null);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen || !resident) return null;

  const handleTransfer = async () => {
    if (!selectedBedId) {
      setError('Please select a target vacant bed.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/beds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRANSFER',
          residentId: resident.id,
          newBedId: selectedBedId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <ArrowLeftRight className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-base">Transfer Bed</h3>
              <p className="text-xs text-slate-400">Room Reallocation</p>
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

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <p className="text-slate-500">Resident: <strong className="text-slate-900">{resident.fullName}</strong></p>
            <p className="text-slate-500">Current Bed: <strong className="text-amber-700">Room {resident.roomNumber} - Bed {resident.bedNumber}</strong></p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Destination Bed ({availableBeds.length} Available)
            </label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {availableBeds.length === 0 ? (
                <div className="p-4 text-center text-slate-500">No vacant beds available right now.</div>
              ) : (
                availableBeds.map(b => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBedId(b.id)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      selectedBedId === b.id
                        ? 'bg-blue-50 border-l-4 border-blue-600 font-bold text-blue-950'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BedDouble className="w-4 h-4 text-slate-400" />
                      <span>Room {b.roomNumber} - Bed {b.bedNumber}</span>
                      <span className="text-[11px] text-slate-400">({b.floorName})</span>
                    </div>
                    <span className="font-semibold text-emerald-700">₹{b.monthlyRent}</span>
                  </div>
                ))
              )}
            </div>
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
              disabled={loading || !selectedBedId}
              onClick={handleTransfer}
              className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Bed Transfer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
