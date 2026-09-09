import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { getClientIp } from '@/lib/utils';
import { UserRole } from '@/lib/db/types';

export async function GET() {
  const db = getDb();
  const upiId = db.hostel.bankDetails?.upiId || db.settings?.upiId || 'srisrinivasahostel@okaxis';
  return NextResponse.json({
    hostel: db.hostel,
    feePlans: db.feePlans,
    users: db.users,
    settings: db.settings,
    upiId
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type = 'HOSTEL_PROFILE',
      hostelUpdates,
      feePlanUpdates,
      upiId: newUpiIdInput,
      bankDetails: bankDetailsInput,
      userId = 'usr-own-01',
      userName = 'Sri Srinivasa Rao (Proprietor)',
      userRole = 'OWNER'
    } = body;

    const db = getDb();
    const clientIp = getClientIp(req);

    // Enforce RBAC: Residents cannot modify hostel profile, banking, or UPI configuration
    if (userRole === 'RESIDENT') {
      return NextResponse.json(
        { error: 'Forbidden: Residents do not have permission to modify hostel financial or UPI settings.' },
        { status: 403 }
      );
    }

    // Dedicated UPI ID & QR settings update
    if (type === 'UPI_UPDATE' || type === 'BANK_UPI_UPDATE' || body.upiId) {
      const upiIdToSet = (newUpiIdInput || body.upiId || '').trim();
      if (!upiIdToSet || !upiIdToSet.includes('@')) {
        return NextResponse.json(
          { error: 'Invalid UPI ID format. Must contain a valid handle (e.g., username@bank or merchant@upi)' },
          { status: 400 }
        );
      }

      const prevUpi = db.hostel.bankDetails?.upiId || db.settings?.upiId || 'srisrinivasahostel@okaxis';

      if (!db.hostel.bankDetails) {
        db.hostel.bankDetails = {
          accountName: db.hostel.name,
          accountNumber: '50200049281729',
          ifsc: 'HDFC0001629',
          bankName: 'HDFC Bank, Madhapur Branch',
          upiId: upiIdToSet
        };
      } else {
        db.hostel.bankDetails.upiId = upiIdToSet;
      }

      if (bankDetailsInput) {
        if (bankDetailsInput.accountName) db.hostel.bankDetails.accountName = bankDetailsInput.accountName;
        if (bankDetailsInput.accountNumber) db.hostel.bankDetails.accountNumber = bankDetailsInput.accountNumber;
        if (bankDetailsInput.ifsc) db.hostel.bankDetails.ifsc = bankDetailsInput.ifsc;
        if (bankDetailsInput.bankName) db.hostel.bankDetails.bankName = bankDetailsInput.bankName;
      }

      if (db.settings) {
        db.settings.upiId = upiIdToSet;
      }

      saveDb(db);

      addAuditLog(
        userId,
        userName,
        userRole as UserRole,
        'SETTINGS_CHANGE',
        'SETTINGS',
        db.hostel.id,
        `Changed hostel UPI ID from "${prevUpi}" to "${upiIdToSet}"`,
        {
          ipAddress: clientIp,
          beforeData: { upiId: prevUpi },
          afterData: { upiId: upiIdToSet, bankDetails: db.hostel.bankDetails },
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({
        success: true,
        hostel: db.hostel,
        upiId: upiIdToSet,
        message: `Hostel UPI ID updated to ${upiIdToSet}`
      });
    }

    if (type === 'HOSTEL_PROFILE' && hostelUpdates) {
      const beforeData = { ...db.hostel };
      Object.assign(db.hostel, hostelUpdates);
      if (hostelUpdates.bankDetails?.upiId && db.settings) {
        db.settings.upiId = hostelUpdates.bankDetails.upiId;
      }
      saveDb(db);

      addAuditLog(
        userId,
        userName,
        userRole as UserRole,
        'SETTINGS_CHANGE',
        'SETTINGS',
        db.hostel.id,
        `Updated hostel profile settings (${Object.keys(hostelUpdates).join(', ')})`,
        {
          ipAddress: clientIp,
          beforeData,
          afterData: db.hostel,
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({ success: true, hostel: db.hostel, upiId: db.hostel.bankDetails?.upiId });
    }

    if (type === 'FEE_PLAN' && feePlanUpdates && feePlanUpdates.id) {
      const plan = db.feePlans.find(p => p.id === feePlanUpdates.id);
      if (!plan) {
        return NextResponse.json({ error: 'Fee plan not found' }, { status: 404 });
      }

      const beforeData = { ...plan };
      Object.assign(plan, feePlanUpdates);
      saveDb(db);

      addAuditLog(
        userId,
        userName,
        userRole as UserRole,
        'SETTINGS_CHANGE',
        'SETTINGS',
        plan.id,
        `Updated fee structure for ${plan.name} (${plan.roomType})`,
        {
          ipAddress: clientIp,
          beforeData,
          afterData: plan,
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({ success: true, feePlan: plan });
    }

    return NextResponse.json({ error: 'Invalid settings update payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 500 });
  }
}
