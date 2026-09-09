'use client';

import React, { useState } from 'react';
import { Room, Bed } from '@/lib/db/types';
import {
  BedDouble,
  Plus,
  X,
  Check,
  AlertCircle,
  Loader2,
  Building,
  Layers,
  IndianRupee,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (room: Room, beds: Bed[]) => void;
  existingRooms?: Room[];
}

const ALL_FACILITIES = [
  'AC',
  'Attached Bath',
  'Geyser',
  'High-Speed Wi-Fi',
  'Balcony',
  'Dedicated Workstation',
  'Wardrobe / Cupboard',
  'Daily Housekeeping',
  'Power Backup'
];

const DEFAULT_RENTS: Record<string, number> = {
  SINGLE: 14000,
  TWO_SHARING: 9500,
  THREE_SHARING: 7500,
  FOUR_SHARING: 6000
};

export default function AddRoomModal({
  isOpen,
  onClose,
  onSuccess,
  existingRooms = []
}: AddRoomModalProps) {
  const [roomNumber, setRoomNumber] = useState('');
  const [buildingId, setBuildingId] = useState('bldg-a');
  const [floorId, setFloorId] = useState('floor-g');
  const [roomType, setRoomType] = useState<'SINGLE' | 'TWO_SHARING' | 'THREE_SHARING' | 'FOUR_SHARING'>('TWO_SHARING');
  const [capacity, setCapacity] = useState<number>(2);
  const [monthlyRent, setMonthlyRent] = useState<number>(9500);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([
    'AC',
    'Attached Bath',
    'Geyser',
    'High-Speed Wi-Fi',
    'Wardrobe / Cupboard'
  ]);
  const [autoCreateBeds, setAutoCreateBeds] = useState(true);
  const [status, setStatus] = useState<'ACTIVE' | 'MAINTENANCE'>('ACTIVE');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buildings and floors list
  const buildings = [
    { id: 'bldg-a', name: 'Building A (Main Block)', code: 'A' },
    { id: 'bldg-b', name: 'Building B (Executive Annexe)', code: 'B' }
  ];

  const floorsByBuilding: Record<string, { id: string; name: string }[]> = {
    'bldg-a': [
      { id: 'floor-g', name: 'Ground Floor' },
      { id: 'floor-1', name: 'First Floor' },
      { id: 'floor-2', name: 'Second Floor' }
    ],
    'bldg-b': [
      { id: 'floor-b-g', name: 'Annexe Ground Floor' },
      { id: 'floor-b-1', name: 'Annexe First Floor' }
    ]
  };

  const resetForm = () => {
    setRoomNumber('');
    setBuildingId('bldg-a');
    setFloorId('floor-g');
    setRoomType('TWO_SHARING');
    setCapacity(2);
    setMonthlyRent(9500);
    setSelectedFacilities(['AC', 'Attached Bath', 'Geyser', 'High-Speed Wi-Fi', 'Wardrobe / Cupboard']);
    setAutoCreateBeds(true);
    setStatus('ACTIVE');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // When building changes, update floor options
  const handleBuildingChange = (bldId: string) => {
    setBuildingId(bldId);
    const availableFloors = floorsByBuilding[bldId] || [];
    if (availableFloors.length > 0) {
      setFloorId(availableFloors[0].id);
    }
  };

  // When room type changes, update capacity and suggested rent
  const handleRoomTypeChange = (type: 'SINGLE' | 'TWO_SHARING' | 'THREE_SHARING' | 'FOUR_SHARING') => {
    setRoomType(type);
    let newCap = 2;
    if (type === 'SINGLE') newCap = 1;
    else if (type === 'TWO_SHARING') newCap = 2;
    else if (type === 'THREE_SHARING') newCap = 3;
    else if (type === 'FOUR_SHARING') newCap = 4;
    setCapacity(newCap);
    setMonthlyRent(DEFAULT_RENTS[type] || 8000);
  };

  const toggleFacility = (facility: string) => {
    setSelectedFacilities(prev =>
      prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]
    );
  };

  // Check duplicate room number
  const isDuplicate = Boolean(
    roomNumber.trim() &&
    existingRooms.some(r => r.roomNumber.toLowerCase() === roomNumber.trim().toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoomNum = roomNumber.trim();
    if (!cleanRoomNum) {
      setError('Please provide a room number.');
      return;
    }

    if (isDuplicate) {
      setError(`Room number "${cleanRoomNum}" already exists. Please choose a different number.`);
      return;
    }

    if (capacity < 1) {
      setError('Room capacity must be at least 1 bed.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: cleanRoomNum,
          buildingId,
          floorId,
          roomType,
          capacity,
          monthlyRent,
          facilities: selectedFacilities,
          autoCreateBeds,
          status
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      onSuccess(data.room, data.beds || []);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving the room.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentFloors = floorsByBuilding[buildingId] || [];
  const bedLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Add New Hostel Room</h2>
              <p className="text-xs text-slate-500 font-medium">
                Provision new room capacity, allocate beds, and configure amenities
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Location Details: Building, Floor, Room Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" /> Building / Wing
              </label>
              <select
                value={buildingId}
                onChange={(e) => handleBuildingChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition-all"
              >
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Floor Level
              </label>
              <select
                value={floorId}
                onChange={(e) => setFloorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition-all"
              >
                {currentFloors.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Room Number *</span>
                {isDuplicate && (
                  <span className="text-[10px] text-rose-600 font-bold">Already exists</span>
                )}
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 104, 205, B-102"
                required
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden transition-all ${
                  isDuplicate
                    ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-400'
                    : 'border-slate-300 focus:ring-2 focus:ring-amber-500'
                }`}
              />
            </div>
          </div>

          {/* Sharing Type & Pricing */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Room Sharing Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'SINGLE', label: 'Single AC', cap: 1, desc: 'Private 1-bed' },
                { id: 'TWO_SHARING', label: '2 Sharing', cap: 2, desc: 'Twin beds' },
                { id: 'THREE_SHARING', label: '3 Sharing', cap: 3, desc: 'Triple beds' },
                { id: 'FOUR_SHARING', label: '4 Sharing', cap: 4, desc: 'Quad beds' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRoomTypeChange(item.id as any)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    roomType === item.id
                      ? 'border-amber-600 bg-amber-50/60 shadow-xs ring-1 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">{item.label}</span>
                    {roomType === item.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Capacity and Rent Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Bed Capacity
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={capacity}
                  onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Total physical beds in this room</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400" /> Monthly Rent / Bed (₹)
              </label>
              <input
                type="number"
                min="1000"
                step="100"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-1">Standard tariff per resident</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Room Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="ACTIVE">Active & Available</option>
                <option value="MAINTENANCE">Under Maintenance / Setup</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Ready for occupancy</p>
            </div>
          </div>

          {/* Facilities Checklist */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Room Facilities & Amenities</label>
            <div className="flex flex-wrap gap-2">
              {ALL_FACILITIES.map((facility) => {
                const selected = selectedFacilities.includes(facility);
                return (
                  <button
                    key={facility}
                    type="button"
                    onClick={() => toggleFacility(facility)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      selected
                        ? 'bg-amber-100/70 border-amber-300 text-amber-900 shadow-2xs font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {selected ? <Check className="w-3 h-3 text-amber-700" /> : <Plus className="w-3 h-3 text-slate-400" />}
                    <span>{facility}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto Create Beds Provisioning Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoCreateBeds}
                onChange={(e) => setAutoCreateBeds(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-800">
                Automatically generate individual bed slots ({capacity} beds)
              </span>
            </label>

            {autoCreateBeds && (
              <div className="pl-6.5 space-y-1.5">
                <p className="text-[11px] text-slate-500">
                  The following beds will be provisioned in the visual matrix and ready for resident admissions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: capacity }).map((_, idx) => {
                    const label = bedLabels[idx] || `${idx + 1}`;
                    return (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 shadow-2xs"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Bed {roomNumber ? roomNumber.trim() : 'RM'}-{label} (₹{monthlyRent.toLocaleString('en-IN')})
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            * Bed matrix and occupancy rate will auto-update upon creation
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
              disabled={loading || isDuplicate || !roomNumber.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding Room...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Room & Beds</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
