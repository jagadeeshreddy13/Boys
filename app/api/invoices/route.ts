import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { Invoice, InvoiceItem } from '@/lib/db/types';
import { getClientIp } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const residentId = searchParams.get('residentId');
  const status = searchParams.get('status');
  const id = searchParams.get('id');

  if (id) {
    const invoice = db.invoices.find(inv => inv.id === id);
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const payments = db.payments.filter(p => p.invoiceId === id);
    return NextResponse.json({ invoice, payments, hostel: db.hostel });
  }

  let invoices = db.invoices;

  if (residentId) {
    invoices = invoices.filter(inv => inv.residentId === residentId);
  }

  if (status && status !== 'ALL') {
    invoices = invoices.filter(inv => inv.status === status);
  }

  return NextResponse.json({ invoices, total: invoices.length, hostel: db.hostel });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, billingPeriod, dueDate, discountPercent = 0, invoiceData, userId, userName } = body;
    const db = getDb();
    const clientIp = getClientIp(req);

    // 1. Action: BATCH_MONTHLY_BILLING
    if (action === 'BATCH_MONTHLY_BILLING') {
      const targetPeriod = billingPeriod || new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      const targetDueDate = dueDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const activeResidents = db.residents.filter(r => r.status === 'ACTIVE' && r.bedId);

      let generatedCount = 0;
      let skippedCount = 0;
      let totalBilled = 0;
      const newInvoices: Invoice[] = [];

      for (const resident of activeResidents) {
        // Idempotency: check if invoice for this resident and billing period already exists
        const exists = db.invoices.some(
          inv => inv.residentId === resident.id && inv.billingPeriod === targetPeriod
        );

        if (exists) {
          skippedCount++;
          continue;
        }

        const feePlan = db.feePlans.find(p => p.id === resident.feePlanId) || db.feePlans[1];
        const rentAmount = resident.monthlyRent || feePlan.baseMonthlyRent;
        const foodAmount = feePlan.foodCharges || 0;
        const electricityAmount = feePlan.electricityCharges || 0;
        const previousDues = resident.outstandingBalance || 0;

        const items: InvoiceItem[] = [
          { id: `item-${Date.now()}-${Math.random()}`, description: `Monthly Room Rent (${resident.roomNumber}-${resident.bedNumber})`, amount: rentAmount, type: 'RENT' }
        ];

        if (foodAmount > 0) {
          items.push({ id: `item-${Date.now()}-${Math.random()}`, description: 'Mess / Food Charges (3 Meals Daily)', amount: foodAmount, type: 'FOOD' });
        }
        if (electricityAmount > 0) {
          items.push({ id: `item-${Date.now()}-${Math.random()}`, description: 'Electricity & Maintenance Surcharge', amount: electricityAmount, type: 'ELECTRICITY' });
        }
        if (previousDues > 0) {
          items.push({ id: `item-${Date.now()}-${Math.random()}`, description: 'Previous Unpaid Arrears / Balance', amount: previousDues, type: 'OTHER' });
        }

        const subtotal = items.reduce((acc, it) => acc + it.amount, 0);
        const discount = discountPercent > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;
        const totalAmount = subtotal - discount;

        const year = new Date().getFullYear();
        const seq = db.invoices.length + 1;
        const invoiceNumber = `INV-${year}-${String(seq).padStart(3, '0')}`;

        const newInvoice: Invoice = {
          id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          invoiceNumber,
          residentId: resident.id,
          residentName: resident.fullName,
          roomNumber: resident.roomNumber || 'N/A',
          bedNumber: resident.bedNumber || 'N/A',
          billingPeriod: targetPeriod,
          items,
          subtotal,
          discount,
          totalAmount,
          paidAmount: 0,
          outstandingBalance: totalAmount,
          dueDate: targetDueDate,
          issueDate: new Date().toISOString().split('T')[0],
          status: 'PENDING',
          notes: `Automated monthly billing for ${targetPeriod}`
        };

        db.invoices.unshift(newInvoice);
        resident.outstandingBalance += (totalAmount - previousDues); // adjust for new charges
        newInvoices.push(newInvoice);
        generatedCount++;
        totalBilled += totalAmount;
      }

      saveDb(db);

      addAuditLog(
        userId || 'usr-acct-01',
        userName || 'Venkat Rao (Accountant)',
        'ACCOUNTANT',
        'INVOICE_BATCH_CREATE',
        'INVOICE_BATCH',
        targetPeriod,
        `Generated ${generatedCount} invoices for ${targetPeriod} totaling ₹${totalBilled}. Skipped ${skippedCount} duplicates.`,
        {
          ipAddress: clientIp,
          beforeData: null,
          afterData: {
            billingPeriod: targetPeriod,
            invoicesGenerated: generatedCount,
            skippedDuplicates: skippedCount,
            totalBilled
          },
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({
        success: true,
        generatedCount,
        skippedCount,
        totalBilled,
        billingPeriod: targetPeriod,
        invoices: newInvoices
      });
    }

    // 2. Action: Single manual invoice creation
    if (invoiceData) {
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${String(db.invoices.length + 1).padStart(3, '0')}`;
      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber,
        ...invoiceData,
        issueDate: new Date().toISOString().split('T')[0],
        paidAmount: 0,
        outstandingBalance: invoiceData.totalAmount,
        status: 'PENDING'
      };

      db.invoices.unshift(newInvoice);
      saveDb(db);

      addAuditLog(
        userId || 'usr-acct-01',
        userName || 'Venkat Rao (Accountant)',
        'ACCOUNTANT',
        'INVOICE_CREATE',
        'INVOICE',
        newInvoice.id,
        `Created invoice ${newInvoice.invoiceNumber} for ${newInvoice.residentName} amounting to ₹${newInvoice.totalAmount}`,
        {
          ipAddress: clientIp,
          beforeData: null,
          afterData: {
            invoiceNumber: newInvoice.invoiceNumber,
            residentId: newInvoice.residentId,
            residentName: newInvoice.residentName,
            totalAmount: newInvoice.totalAmount,
            dueDate: newInvoice.dueDate
          },
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({ success: true, invoice: newInvoice });
    }

    return NextResponse.json({ error: 'Invalid invoice creation payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invoice processing failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId, userName, ...updates } = body;
    const db = getDb();
    const clientIp = getClientIp(req);

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const invoice = db.invoices.find(inv => inv.id === id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const beforeData: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      beforeData[key] = (invoice as any)[key];
    });

    Object.assign(invoice, updates);
    saveDb(db);

    addAuditLog(
      userId || 'usr-acct-01',
      userName || 'Venkat Rao (Accountant)',
      'ACCOUNTANT',
      'INVOICE_UPDATE',
      'INVOICE',
      id,
      `Modified invoice ${invoice.invoiceNumber} details (${Object.keys(updates).join(', ')})`,
      {
        ipAddress: clientIp,
        beforeData,
        afterData: updates,
        status: 'SUCCESS'
      }
    );

    return NextResponse.json({ success: true, invoice });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invoice update failed' }, { status: 500 });
  }
}
