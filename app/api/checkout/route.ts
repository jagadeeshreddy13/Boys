import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { CheckoutRecord } from '@/lib/db/types';
import { getClientIp } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const residentId = searchParams.get('residentId');

  let records = db.checkoutRecords || [];
  if (residentId) {
    records = records.filter(r => r.residentId === residentId);
  }

  return NextResponse.json({
    checkoutRecords: records,
    total: records.length
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      residentId,
      damageCharges = 0,
      damageNotes = '',
      processor = 'Ramesh Naidu (Manager)',
      userId = 'usr-mgr-01'
    } = body;

    const db = getDb();
    const clientIp = getClientIp(req);

    if (!residentId) {
      return NextResponse.json({ error: 'residentId is required' }, { status: 400 });
    }

    const resident = db.residents.find(r => r.id === residentId);
    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
    }

    if (resident.status === 'CHECKED_OUT') {
      return NextResponse.json({ error: 'Resident has already checked out' }, { status: 400 });
    }

    // 1. Calculate pending dues from all invoices
    const pendingInvoices = db.invoices.filter(
      inv => inv.residentId === residentId && inv.outstandingBalance > 0
    );
    const totalPendingDues = pendingInvoices.reduce((acc, inv) => acc + inv.outstandingBalance, 0);

    const depositPaid = resident.securityDeposit || 0;
    const damage = Number(damageCharges) || 0;

    // Settlement calculation
    const totalDeductions = totalPendingDues + damage;
    let refundAmount = 0;
    let amountDueFromResident = 0;

    if (depositPaid >= totalDeductions) {
      refundAmount = depositPaid - totalDeductions;
      amountDueFromResident = 0;
    } else {
      refundAmount = 0;
      amountDueFromResident = totalDeductions - depositPaid;
    }

    // Capture before data
    const beforeState = {
      residentId: resident.id,
      residentName: resident.fullName,
      status: resident.status,
      roomNumber: resident.roomNumber,
      bedNumber: resident.bedNumber,
      depositPaid,
      totalPendingDues
    };

    // 2. Free up the bed
    let freedBedNumber = resident.bedNumber || '';
    let freedRoomNumber = resident.roomNumber || '';

    if (resident.bedId) {
      const bed = db.beds.find(b => b.id === resident.bedId);
      if (bed) {
        bed.status = 'AVAILABLE';
        bed.currentResidentId = undefined;
        bed.currentResidentName = undefined;
        bed.maintenanceNotes = damage ? `Post-checkout inspection: ${damageNotes}` : undefined;
        freedBedNumber = bed.bedNumber;
        freedRoomNumber = bed.roomNumber;
      }
    }

    // 3. Mark resident as CHECKED_OUT
    resident.status = 'CHECKED_OUT';
    resident.checkoutDate = new Date().toISOString().split('T')[0];
    resident.outstandingBalance = amountDueFromResident;
    resident.bedId = undefined;
    resident.bedNumber = undefined;
    resident.roomId = undefined;
    resident.roomNumber = undefined;

    // 4. Record Checkout Record
    const checkoutRecord: CheckoutRecord = {
      id: `chk-${Date.now()}`,
      residentId: resident.id,
      residentName: resident.fullName,
      roomNumber: freedRoomNumber,
      bedNumber: freedBedNumber,
      checkoutDate: new Date().toISOString(),
      depositPaid,
      pendingDues: totalPendingDues,
      damageCharges: damage,
      damageNotes,
      refundAmount,
      amountDueFromResident,
      settlementStatus: 'COMPLETED',
      processedBy: processor
    };

    if (!db.checkoutRecords) {
      db.checkoutRecords = [];
    }
    db.checkoutRecords.unshift(checkoutRecord);
    saveDb(db);

    const afterState = {
      status: 'CHECKED_OUT',
      checkoutRecordId: checkoutRecord.id,
      refundAmount,
      amountDueFromResident,
      damageCharges: damage,
      freedBed: `${freedRoomNumber}-${freedBedNumber}`,
      settlementStatus: 'COMPLETED'
    };

    addAuditLog(
      userId,
      processor,
      'MANAGER',
      'CHECKOUT',
      'RESIDENT',
      resident.id,
      `Completed checkout for ${resident.fullName}. Freed Bed ${freedRoomNumber}-${freedBedNumber}. Refund: ₹${refundAmount}, Due: ₹${amountDueFromResident}`,
      {
        ipAddress: clientIp,
        beforeData: beforeState,
        afterData: afterState,
        status: 'SUCCESS'
      }
    );

    if (refundAmount > 0) {
      addAuditLog(
        userId,
        processor,
        'MANAGER',
        'REFUND',
        'PAYMENT',
        checkoutRecord.id,
        `Processed security deposit refund of ₹${refundAmount} for resident ${resident.fullName} post-settlement.`,
        {
          ipAddress: clientIp,
          beforeData: { originalDeposit: depositPaid, deductions: totalDeductions },
          afterData: { refundAmount, refundedTo: resident.fullName, method: 'DIRECT_SETTLEMENT' },
          status: 'SUCCESS'
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Checkout and deposit settlement completed for ${resident.fullName}`,
      checkoutRecord,
      resident
    });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 500 });
  }
}
