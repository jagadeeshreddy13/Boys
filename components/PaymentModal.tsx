'use client';

import React, { useState } from 'react';
import { Invoice, PaymentMethod } from '@/lib/db/types';
import { IndianRupee, CreditCard, QrCode, Building2, Banknote, ShieldCheck, X, CheckCircle, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuccess: (paymentResult: any) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [collector, setCollector] = useState('Ramesh Naidu (Manager)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [gatewayStep, setGatewayStep] = useState<'FORM' | 'GATEWAY_SIMULATION' | 'SUCCESS'>('FORM');
  const [error, setError] = useState<string | null>(null);
  const [gatewayOrderId] = useState(() => 'order_ssh_' + Math.floor(10000000 + Math.random() * 90000000));

  const amount = customAmount !== null ? customAmount : (invoice?.outstandingBalance || 0);

  const handleClose = () => {
    setCustomAmount(null);
    setReferenceNumber('');
    setError(null);
    setGatewayStep('FORM');
    onClose();
  };

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (amount > invoice.outstandingBalance) {
      setError(`Amount exceeds invoice balance (₹${invoice.outstandingBalance})`);
      return;
    }

    if (paymentMethod === 'ONLINE') {
      // Show simulated gateway modal for verification
      setGatewayStep('GATEWAY_SIMULATION');
      return;
    }

    await executePayment(paymentMethod, referenceNumber);
  };

  const executePayment = async (method: PaymentMethod, ref: string, gatewayToken?: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount,
          paymentMethod: method,
          referenceNumber: ref || (method === 'CASH' ? `CASH-${Date.now().toString().slice(-4)}` : `UPI-${Date.now()}`),
          collector,
          gatewayToken,
          isOnlineGatewaySimulation: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
      setGatewayStep('FORM');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <IndianRupee className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-base">Record Payment</h3>
              <p className="text-xs text-slate-400">Invoice {invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {gatewayStep === 'GATEWAY_SIMULATION' ? (
          <div className="p-6 space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-slate-900">Secure Payment Gateway Verification</h4>
              <p className="text-xs text-slate-500 mt-1">
                Authorizing ₹{amount.toLocaleString('en-IN')} for Sri Srinivasa Hostel via Razorpay/NPCI Gateway
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-semibold text-slate-800">{gatewayOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Merchant VPA:</span>
                <span className="font-semibold text-slate-800">srisrinivasa.hostel@hdfcbank</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5">
                <span>Amount:</span>
                <span className="text-emerald-700">₹{amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGatewayStep('FORM')}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => executePayment('ONLINE', `PG-SUCCESS-${Date.now()}`, 'tok_verified_signature')}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Simulate Webhook Success
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                {error}
              </div>
            )}

            {/* Resident & Invoice Info */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 block">Resident:</span>
                <span className="font-bold text-slate-900">{invoice.residentName}</span>
                <span className="text-slate-400 block text-[11px]">Room {invoice.roomNumber} - Bed {invoice.bedNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Outstanding:</span>
                <span className="font-extrabold text-amber-700 text-sm">
                  ₹{invoice.outstandingBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  max={invoice.outstandingBalance}
                  min={1}
                  value={amount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 text-sm font-bold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Enter partial or full payment (Maximum: ₹{invoice.outstandingBalance})
              </p>
            </div>

            {/* Payment Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border font-medium transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>UPI / QR / GPay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border font-medium transition-all ${
                    paymentMethod === 'CASH'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-amber-600" />
                  <span>Cash in Hand</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border font-medium transition-all ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Bank Transfer / NEFT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border font-medium transition-all ${
                    paymentMethod === 'ONLINE'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span>Online Gateway</span>
                </button>
              </div>
            </div>

            {/* Reference Number / UTR */}
            {paymentMethod !== 'ONLINE' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {paymentMethod === 'CASH' ? 'Receipt Memo / Book No.' : 'UTR / Transaction Reference No.'}
                </label>
                <input
                  type="text"
                  placeholder={paymentMethod === 'CASH' ? 'e.g. CASH-LOBBY-01' : 'e.g. 428190392819'}
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            )}

            {/* Collector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Collector
              </label>
              <input
                type="text"
                value={collector}
                onChange={(e) => setCollector(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
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
                disabled={isProcessing}
                className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                {paymentMethod === 'ONLINE' ? 'Proceed to Gateway' : 'Confirm & Generate Receipt'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
