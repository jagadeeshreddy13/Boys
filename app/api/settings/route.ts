import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { getClientIp } from '@/lib/utils';
import { UserRole } from '@/lib/db/types';

export async function GET() {
  const db = getDb();
  return NextResponse.json({
    hostel: db.hostel,
    feePlans: db.feePlans,
    users: db.users
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type = 'HOSTEL_PROFILE',
      hostelUpdates,
      feePlanUpdates,
      userId = 'usr-own-01',
      userName = 'Sri Srinivasa Rao (Proprietor)',
      userRole = 'OWNER'
    } = body;

    const db = getDb();
    const clientIp = getClientIp(req);

    if (type === 'HOSTEL_PROFILE' && hostelUpdates) {
      const beforeData = { ...db.hostel };
      Object.assign(db.hostel, hostelUpdates);
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

      return NextResponse.json({ success: true, hostel: db.hostel });
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
