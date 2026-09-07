'use client';

import React, { useState, useEffect } from 'react';
import { Bed, FeePlan } from '@/lib/db/types';
import { UserCheck, IndianRupee, BedDouble, FileText, CheckCircle, AlertCircle, Loader2, X, ChevronRight, ChevronLeft } from 'lucide-react';

interface AdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (admissionData: any) => void;
}

export default function AdmissionModal({
  isOpen,
  onClose,
  onSuccess,
}: AdmissionModalProps) {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available beds and fee plans
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);

  // Form State
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('2002-04-10');
  const [collegeOrCompany, setCollegeOrCompany] = useState('');
  const [courseOrDesignation, setCourseOrDesignation] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('Father');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [idProofType, setIdProofType] = useState('AADHAAR');
  const [idProofNumber, setIdProofNumber] = useState('');

  const [selectedBedId, setSelectedBedId] = useState('');
  const [selectedFeePlanId, setSelectedFeePlanId] = useState('');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'ONLINE'>('UPI');

  // Load available beds and plans on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    Promise.all([
      fetch('/api/beds?status=AVAILABLE').then(r => r.json()),
      fetch('/api/dashboard').then(r => r.json())
    ]).then(([bedsData]) => {
      if (isMounted) {
        setAvailableBeds(bedsData.beds || []);
        setStep(1);
        setError(null);
        setFeePlans([
          {
            id: 'plan-two-sharing',
            name: 'Two Sharing Executive (AC + Food)',
            roomType: 'TWO_SHARING',
            baseMonthlyRent: 9500,
            securityDeposit: 5000,
            foodCharges: 3000,
            electricityCharges: 800,
            laundryCharges: 500,
            wifiCharges: 0,
            otherCharges: 0,
            lateFeePerDay: 100,
            description: 'Twin sharing with study desks, attached geyser washroom, 3 times food & housekeeping.',
            isActive: true
          },
          {
            id: 'plan-three-sharing',
            name: 'Three Sharing Standard (Food & Wi-Fi)',
            roomType: 'THREE_SHARING',
            baseMonthlyRent: 7500,
            securityDeposit: 4000,
            foodCharges: 2500,
            electricityCharges: 500,
            laundryCharges: 400,
            wifiCharges: 0,
            otherCharges: 0,
            lateFeePerDay: 100,
            description: 'Triple sharing with individual lockers, 3 meals daily & high speed Wi-Fi.',
            isActive: true
          },
          {
            id: 'plan-single',
            name: 'Single Luxury AC Room',
            roomType: 'SINGLE',
            baseMonthlyRent: 14000,
            securityDeposit: 8000,
            foodCharges: 3500,
            electricityCharges: 1000,
            laundryCharges: 500,
            wifiCharges: 0,
            otherCharges: 0,
            lateFeePerDay: 100,
            description: 'Private room with attached bathroom, Split AC, Study Table, Smart TV & Wi-Fi.',
            isActive: true
          },
          {
            id: 'plan-four-sharing',
            name: 'Four Sharing Budget Friendly',
            roomType: 'FOUR_SHARING',
            baseMonthlyRent: 6000,
            securityDeposit: 3000,
            foodCharges: 2200,
            electricityCharges: 400,
            laundryCharges: 400,
            wifiCharges: 0,
            otherCharges: 0,
            lateFeePerDay: 100,
            description: 'Economical 4-person room ideal for students with daily room cleaning and hygienic mess.',
            isActive: true
          }
        ]);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedPlan = feePlans.find(p => p.id === selectedFeePlanId);
  const selectedBed = availableBeds.find(b => b.id === selectedBedId);
  const totalAdmissionFee = (selectedPlan?.securityDeposit || 0) + (selectedPlan?.baseMonthlyRent || 0);

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!fullName.trim() || !mobile.trim() || !emergencyContactPhone.trim()) {
        setError('Please enter Full Name, Mobile, and Emergency Contact.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedBedId) {
        setError('Please select an available bed.');
        return;
      }
      if (!selectedFeePlanId) {
        setError('Please select a fee plan.');
        return;
      }
      // Auto suggest amount to pay
      if (amountPaid === 0 && selectedPlan) {
        setAmountPaid(totalAdmissionFee);
      }
      setStep(3);
    }
  };

  const handleCompleteAdmission = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          mobile,
          email,
          dob,
          collegeOrCompany,
          courseOrDesignation,
          permanentAddress,
          emergencyContactName,
          emergencyContactRelation,
          emergencyContactPhone,
          idProofType,
          idProofNumber: idProofNumber || '4829-1029-4820',
          bedId: selectedBedId,
          feePlanId: selectedFeePlanId,
          amountPaid,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete admission');
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Admission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-base">New Resident Admission</h3>
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

        {/* Step Indicator */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs font-semibold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-amber-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-amber-600 text-white' : 'bg-slate-200'}`}>
              1
            </span>
            <span>Resident Profile</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-amber-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-amber-600 text-white' : 'bg-slate-200'}`}>
              2
            </span>
            <span>Room & Bed Selection</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-amber-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 3 ? 'bg-amber-600 text-white' : 'bg-slate-200'}`}>
              3
            </span>
            <span>Fee & Payment</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: RESIDENT DETAILS */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Raju"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number (+91) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98480 12345"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. vikram.raju@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">College or Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Tech Mahindra / JNTUH"
                    value={collegeOrCompany}
                    onChange={(e) => setCollegeOrCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer / B.Tech"
                    value={courseOrDesignation}
                    onChange={(e) => setCourseOrDesignation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Emergency Contact & ID Proof */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Emergency Contact & ID Verification
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Guardian / Parent Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Subba Raju"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Relation</label>
                    <select
                      value={emergencyContactRelation}
                      onChange={(e) => setEmergencyContactRelation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Emergency Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 98490 55667"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ID Proof Type</label>
                    <select
                      value={idProofType}
                      onChange={(e) => setIdProofType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                    >
                      <option value="AADHAAR">Aadhaar Card (12 Digits)</option>
                      <option value="PAN">PAN Card</option>
                      <option value="DRIVING_LICENSE">Driving License</option>
                      <option value="VOTER_ID">Voter ID</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ID Proof Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 4829-1029-4820"
                      value={idProofNumber}
                      onChange={(e) => setIdProofNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ROOM & BED SELECTION */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Select Available Bed ({availableBeds.length} Vacant Beds Available)
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {availableBeds.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No beds currently available. Please check room statuses.
                    </div>
                  ) : (
                    availableBeds.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBedId(b.id)}
                        className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          selectedBedId === b.id
                            ? 'bg-amber-50 border-l-4 border-amber-600 text-amber-950 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <BedDouble className={`w-4 h-4 ${selectedBedId === b.id ? 'text-amber-600' : 'text-slate-400'}`} />
                          <span>Room {b.roomNumber} - Bed {b.bedNumber}</span>
                          <span className="text-slate-400 text-[11px]">({b.floorName})</span>
                        </div>
                        <span className="font-semibold text-emerald-700">₹{b.monthlyRent}/mo</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Select Configured Fee Plan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {feePlans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedFeePlanId(plan.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedFeePlanId === plan.id
                          ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900">{plan.name}</span>
                        <span className="font-extrabold text-amber-700">₹{plan.baseMonthlyRent}/m</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{plan.description}</p>
                      <div className="mt-2 text-[10px] text-slate-600 flex gap-2">
                        <span>Deposit: <strong>₹{plan.securityDeposit}</strong></span>
                        <span>Food: <strong>₹{plan.foodCharges}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FEE & PAYMENT */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Resident Name:</span>
                  <span className="font-bold text-slate-900">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Selected Allocation:</span>
                  <span className="font-bold text-slate-900">Room {selectedBed?.roomNumber} - Bed {selectedBed?.bedNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Fee Plan:</span>
                  <span className="font-semibold text-slate-900">{selectedPlan?.name}</span>
                </div>
                <div className="border-t border-amber-200 pt-2 flex justify-between font-bold text-sm text-slate-950">
                  <span>Total Initial Due (Rent + Deposit):</span>
                  <span className="text-emerald-800">₹{totalAdmissionFee.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Payment Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="ONLINE">Online Payment</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Upon confirming, the system will allocate Bed {selectedBed?.roomNumber}-{selectedBed?.bedNumber}, activate the resident, generate an invoice and receipt voucher.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleCompleteAdmission}
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Complete Admission & Activate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
