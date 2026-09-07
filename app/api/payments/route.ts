import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog, numberToWordsIndian } from '@/lib/db/store';
import { Payment, PaymentMethod, PaymentStatus } from '@/lib/db/types';
import { getClientIp } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const residentId = searchParams.get('residentId');
  const invoiceId = searchParams.get('invoiceId');
  const id = searchParams.get('id');

  if (id) {
    const payment = db.payments.find(p => p.id === id);
    if (!payment) return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    const invoice = db.invoices.find(i => i.id === payment.invoiceId);
    return NextResponse.json({ payment, invoice, hostel: db.hostel });
  }

  let payments = db.payments;

  if (residentId) {
    payments = payments.filter(p => p.residentId === residentId);
  }

  if (invoiceId) {
    payments = payments.filter(p => p.invoiceId === invoiceId);
  }

  return NextResponse.json({ payments, total: payments.length, hostel: db.hostel });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      invoiceId,
      amount,
      paymentMethod,
      referenceNumber,
      notes,
      collector = 'Venkat Rao (Accountant)',
      userId = 'usr-acct-01',
      gatewayToken, // for online gateway verification
      isOnlineGatewaySimulation
    } = body;

    const db = getDb();
    const clientIp = getClientIp(req);

    // 1. Validation
    if (!invoiceId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Invoice ID, amount, and payment method are required' }, { status: 400 });
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json({ error: 'Payment amount must be greater than zero' }, { status: 400 });
    }

    const invoice = db.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: 'Target invoice not found' }, { status: 404 });
    }

    // Capture before data
    const beforeInvoiceState = {
      invoiceNumber: invoice.invoiceNumber,
      outstandingBalance: invoice.outstandingBalance,
      paidAmount: invoice.paidAmount,
      status: invoice.status
    };

    // Constraint: payment must not exceed outstanding balance
    if (payAmount > invoice.outstandingBalance) {
      return NextResponse.json({
        error: `Payment amount (₹${payAmount}) exceeds invoice outstanding balance (₹${invoice.outstandingBalance}). Overpayments not permitted without advance clearance.`
      }, { status: 400 });
    }

    // 2. Server-side verification for Online Payment
    let finalStatus: PaymentStatus = 'SUCCESS';
    let txnRef = referenceNumber;

    if (paymentMethod === 'ONLINE') {
      if (!gatewayToken && !isOnlineGatewaySimulation) {
        return NextResponse.json({
          error: 'Online payment cannot be marked successful without server-side gateway signature verification.'
        }, { status: 400 });
      }
      txnRef = `ONL-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    } else if (paymentMethod === 'UPI' && !txnRef) {
      txnRef = `UPI-${Date.now()}`;
    } else if (!txnRef) {
      txnRef = `REF-${Date.now()}`;
    }

    // 3. Generate Receipt Number
    const year = new Date().getFullYear();
    const receiptSeq = db.payments.length + 1;
    const receiptNumber = `RCP-${year}-${String(receiptSeq).padStart(3, '0')}`;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      residentId: invoice.residentId,
      residentName: invoice.residentName,
      amount: payAmount,
      amountInWords: numberToWordsIndian(payAmount),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod as PaymentMethod,
      referenceNumber: txnRef,
      gatewayOrderId: paymentMethod === 'ONLINE' ? `order_${Date.now()}` : undefined,
      gatewayPaymentId: paymentMethod === 'ONLINE' ? txnRef : undefined,
      status: finalStatus,
      collectedBy: collector,
      notes: notes || `Payment recorded via ${paymentMethod}`
    };

    db.payments.unshift(newPayment);

    // 4. Update Invoice balances
    invoice.paidAmount += payAmount;
    invoice.outstandingBalance = Math.max(0, invoice.outstandingBalance - payAmount);
    if (invoice.outstandingBalance === 0) {
      invoice.status = 'PAID';
    } else {
      invoice.status = 'PARTIAL';
    }

    // 5. Update Resident balance
    const resident = db.residents.find(r => r.id === invoice.residentId);
    if (resident) {
      resident.outstandingBalance = Math.max(0, resident.outstandingBalance - payAmount);
    }

    saveDb(db);

    addAuditLog(
      userId,
      collector,
      'ACCOUNTANT',
      'PAYMENT_CREATE',
      'PAYMENT',
      newPayment.id,
      `Recorded ₹${payAmount} (${paymentMethod}) from ${invoice.residentName} for ${invoice.invoiceNumber}. Receipt: ${receiptNumber}`,
      {
        ipAddress: clientIp,
        beforeData: beforeInvoiceState,
        afterData: {
          receiptNumber,
          amount: payAmount,
          paymentMethod,
          referenceNumber: txnRef,
          remainingBalance: invoice.outstandingBalance,
          invoiceStatus: invoice.status
        },
        status: 'SUCCESS'
      }
    );

    return NextResponse.json({
      success: true,
      message: `Payment of ₹${payAmount} recorded successfully`,
      payment: newPayment,
      invoice,
      receiptNumber,
      hostel: db.hostel
    });
  } catch (err: any) {
    console.error('Payment error:', err);
    return NextResponse.json({ error: err.message || 'Payment processing failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId, userName, action, ...updates } = body;
    const db = getDb();
    const clientIp = getClientIp(req);

    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const payment = db.payments.find(p => p.id === id);
    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    const beforeData: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      beforeData[key] = (payment as any)[key];
    });

    Object.assign(payment, updates);
    saveDb(db);

    const logAction = action === 'REFUND' ? 'REFUND' : 'PAYMENT_UPDATE';

    addAuditLog(
      userId || 'usr-acct-01',
      userName || 'Venkat Rao (Accountant)',
      'ACCOUNTANT',
      logAction,
      'PAYMENT',
      id,
      `Updated payment record ${payment.receiptNumber} (${Object.keys(updates).join(', ')})`,
      {
        ipAddress: clientIp,
        beforeData,
        afterData: updates,
        status: 'SUCCESS'
      }
    );

    return NextResponse.json({ success: true, payment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update payment' }, { status: 500 });
  }
}
