import { NextRequest, NextResponse } from 'next/server';
import { getDb, resetDb, addAuditLog } from '@/lib/db/store';
import { getClientIp } from '@/lib/utils';
import { UserRole } from '@/lib/db/types';

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get('search')?.toLowerCase();
  const action = searchParams.get('action');
  const entity = searchParams.get('entity');
  const role = searchParams.get('role');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let logs = [...db.auditLogs];

  if (action && action !== 'ALL') {
    logs = logs.filter(l => l.action.toLowerCase() === action.toLowerCase());
  }

  if (entity && entity !== 'ALL') {
    logs = logs.filter(l => l.entity.toLowerCase() === entity.toLowerCase());
  }

  if (role && role !== 'ALL') {
    logs = logs.filter(l => (l.role || l.userRole)?.toLowerCase() === role.toLowerCase());
  }

  if (startDate) {
    const start = new Date(startDate).getTime();
    logs = logs.filter(l => new Date(l.timestamp).getTime() >= start);
  }

  if (endDate) {
    const end = new Date(endDate + 'T23:59:59.999Z').getTime();
    logs = logs.filter(l => new Date(l.timestamp).getTime() <= end);
  }

  if (search) {
    logs = logs.filter(l =>
      l.userName.toLowerCase().includes(search) ||
      l.action.toLowerCase().includes(search) ||
      l.entity.toLowerCase().includes(search) ||
      l.entityId.toLowerCase().includes(search) ||
      (l.details && l.details.toLowerCase().includes(search)) ||
      (l.ipAddress && l.ipAddress.includes(search))
    );
  }

  return NextResponse.json({
    auditLogs: logs,
    total: logs.length,
    allCount: db.auditLogs.length
  });
}

// Ensure audit logs are NOT editable by standard users - enforced immutability
export async function PUT() {
  return NextResponse.json(
    {
      error: 'Forbidden: Audit logs are immutable records under statutory compliance policy and cannot be edited by standard users.'
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Forbidden: Audit log records are strictly write-once and tamper-proof. Modifications are prohibited.'
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Forbidden: Audit trail records cannot be deleted. Sri Srinivasa ERP enforces permanent append-only audit persistence.'
    },
    { status: 403 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientIp = getClientIp(req);

    if (body.action === 'RESET_DATABASE') {
      const fresh = resetDb();
      return NextResponse.json({ success: true, message: 'Database reset to initial seed state', db: fresh });
    }

    // Direct event recording API for client-side events (e.g. view export, settings visit)
    if (body.action && body.entity && body.userId) {
      const newLog = addAuditLog(
        body.userId,
        body.userName || 'System User',
        (body.role || 'RESIDENT') as UserRole,
        body.action,
        body.entity,
        body.entityId || 'N/A',
        body.details || '',
        {
          ipAddress: clientIp,
          beforeData: body.beforeData || null,
          afterData: body.afterData || null,
          status: body.status || 'SUCCESS'
        }
      );
      return NextResponse.json({ success: true, log: newLog });
    }

    return NextResponse.json({ error: 'Invalid audit action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Audit action failed' }, { status: 500 });
  }
}
