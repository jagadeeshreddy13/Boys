import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { Staff } from '@/lib/db/types';

export async function GET() {
  const db = getDb();
  return NextResponse.json({ staff: db.staff, total: db.staff.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role, phone, salary, joiningDate } = body;
    const db = getDb();

    if (!name || !role || !phone || !salary) {
      return NextResponse.json({ error: 'Missing required staff fields' }, { status: 400 });
    }

    const newStaff: Staff = {
      id: `stf-${Date.now()}`,
      name,
      role,
      phone,
      salary: Number(salary),
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      assignedTasksCount: 0
    };

    db.staff.unshift(newStaff);
    saveDb(db);

    addAuditLog('usr-owner-01', 'Srikanth Varma', 'OWNER', 'STAFF_ADDED', 'STAFF', newStaff.id, `Added new staff member ${name} as ${role}`);
    return NextResponse.json({ success: true, staff: newStaff });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add staff' }, { status: 500 });
  }
}
