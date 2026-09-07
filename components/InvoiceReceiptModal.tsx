'use client';

import React from 'react';
import { Invoice, Payment, Hostel } from '@/lib/db/types';
import { Printer, X, CheckCircle, IndianRupee, ShieldCheck, Building, Phone, Mail, Calendar } from 'lucide-react';

interface InvoiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'INVOICE' | 'RECEIPT';
  invoice?: Invoice | null;
  payment?: Payment | null;
  hostel: Hostel;
}

export default function InvoiceReceiptModal({
  isOpen,
  onClose,
  type,
  invoice,
  payment,
  hostel
}: InvoiceReceiptModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <IndianRupee className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-base">
                {type === 'INVOICE' ? 'Official Tax Invoice' : 'Official Money Receipt'}
              </h3>
              <p className="text-xs text-slate-400">Sri Srinivasa Luxury Boys Hostel ERP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="printable-document" className="p-8 text-slate-800 bg-white">
          {/* Letterhead */}
          <div className="border-b-2 border-amber-600 pb-5 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    SS
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                      SRI SRINIVASA LUXURY BOYS HOSTEL
                    </h1>
                    <p className="text-xs text-amber-700 font-medium tracking-wide uppercase">
                      Premium Accommodation, Homely South & North Food, 24/7 Security
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 max-w-md mt-2 leading-relaxed">
                  {hostel.address}, {hostel.city}, {hostel.state} - {hostel.pincode}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {hostel.phone}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {hostel.email}
                  </span>
                  {hostel.gstin && (
                    <span className="font-semibold text-slate-700">
                      GSTIN: {hostel.gstin}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  type === 'RECEIPT'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : invoice?.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {type === 'RECEIPT' ? 'Payment Receipt' : `Invoice (${invoice?.status || 'PENDING'})`}
                </span>
                <p className="text-xs font-mono font-bold text-slate-800 mt-2">
                  {type === 'RECEIPT' ? payment?.receiptNumber : invoice?.invoiceNumber}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Date: {type === 'RECEIPT' ? payment?.paymentDate : invoice?.issueDate}
                </p>
              </div>
            </div>
          </div>

          {/* Resident Details Banner */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200/80">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block uppercase text-[10px] font-semibold tracking-wider">Resident Name</span>
                <span className="font-bold text-slate-900 text-sm">
                  {type === 'RECEIPT' ? payment?.residentName : invoice?.residentName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[10px] font-semibold tracking-wider">Resident ID</span>
                <span className="font-semibold font-mono text-slate-800">
                  {type === 'RECEIPT' ? payment?.residentId : invoice?.residentId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[10px] font-semibold tracking-wider">Room / Bed</span>
                <span className="font-semibold text-slate-800">
                  Room {invoice?.roomNumber || '102'} - Bed {invoice?.bedNumber || 'A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[10px] font-semibold tracking-wider">
                  {type === 'RECEIPT' ? 'Payment Mode' : 'Billing Period'}
                </span>
                <span className="font-semibold text-slate-800">
                  {type === 'RECEIPT' ? payment?.paymentMethod : invoice?.billingPeriod}
                </span>
              </div>
            </div>
          </div>

          {/* Receipt View */}
          {type === 'RECEIPT' && payment && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                    Amount Received
                  </span>
                  <div className="text-3xl font-extrabold text-emerald-950 flex items-center mt-1">
                    <span>₹{payment.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Txn / Ref: {payment.referenceNumber}</p>
                  <p className="text-slate-500 mt-1">Against Invoice: {payment.invoiceNumber}</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 block font-semibold uppercase text-[10px]">Amount in Words:</span>
                <p className="font-semibold text-slate-900 mt-0.5 italic">{payment.amountInWords}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <span className="text-slate-500 block">Collector Name:</span>
                  <span className="font-medium text-slate-800">{payment.collectedBy}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Hostel UPI / Bank:</span>
                  <span className="font-medium text-slate-800">{hostel.bankDetails?.upiId || 'srisrinivasa.hostel@hdfcbank'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Invoice View */}
          {type === 'INVOICE' && invoice && (
            <div className="space-y-4">
              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/80 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-medium text-slate-900">{item.description}</td>
                        <td className="px-4 py-2.5 text-slate-500">{item.type}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-semibold border-t border-slate-200 text-xs text-slate-800">
                    <tr>
                      <td colSpan={2} className="px-4 py-2 text-right">Subtotal:</td>
                      <td className="px-4 py-2 text-right">₹{invoice.subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                    {invoice.discount > 0 && (
                      <tr className="text-emerald-700">
                        <td colSpan={2} className="px-4 py-1.5 text-right">Special Discount:</td>
                        <td className="px-4 py-1.5 text-right">-₹{invoice.discount.toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    <tr className="text-sm font-bold bg-slate-100 text-slate-950">
                      <td colSpan={2} className="px-4 py-2.5 text-right">Total Invoice Amount:</td>
                      <td className="px-4 py-2.5 text-right">₹{invoice.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-4 py-2 text-right text-emerald-700">Paid to Date:</td>
                      <td className="px-4 py-2 text-right text-emerald-700">₹{invoice.paidAmount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="text-sm font-bold bg-amber-50 text-amber-900 border-t border-amber-200">
                      <td colSpan={2} className="px-4 py-2 text-right">Outstanding Balance:</td>
                      <td className="px-4 py-2 text-right">₹{invoice.outstandingBalance.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Due Date: <strong className="text-slate-800">{invoice.dueDate}</strong></span>
                <span>Payment Status: <strong className="text-slate-800">{invoice.status}</strong></span>
              </div>
            </div>
          )}

          {/* Terms & Signatures */}
          <div className="border-t border-slate-200 mt-8 pt-6">
            <div className="grid grid-cols-2 gap-8 items-end">
              <div className="text-[11px] text-slate-500 leading-relaxed">
                <p className="font-semibold text-slate-700 mb-1">Terms & Conditions:</p>
                <p>1. Fee must be paid on or before the 5th of every month.</p>
                <p>2. Security deposit is refundable upon 30-day prior vacating notice.</p>
                <p>3. This is a computer-generated document under Sri Srinivasa Hostel ERP.</p>
              </div>

              <div className="text-right">
                <div className="inline-block text-center">
                  <div className="h-12 flex items-end justify-center mb-1">
                    <span className="font-serif italic font-semibold text-slate-700 text-sm">
                      For Sri Srinivasa Hostel
                    </span>
                  </div>
                  <div className="w-44 border-t border-slate-400 pt-1 text-[11px] text-slate-600 font-medium">
                    Authorized Signatory / Manager
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
