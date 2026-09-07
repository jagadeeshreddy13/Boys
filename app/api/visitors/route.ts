import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { VisitorLog } from '@/lib/db/types';

export async function GET() {
  const db = getDb();
  return NextResponse.json({ visitors: db.visitors, total: db.visitors.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitorName, mobile, idProof, residentId, purpose, approver = 'Warden' } = body;
    const db = getDb();

    if (!visitorName || !mobile || !residentId || !purpose) {
      return NextResponse.json({ error: 'Visitor name, mobile, resident, and purpose are required' }, { status: 400 });
    }

    const resident = db.residents.find(r => r.id === residentId);
    if (!resident) return NextResponse.json({ error: 'Resident not found' }, { status: 404 });

    const newVisitor: VisitorLog = {
      id: `vis-${Date.now()}`,
      visitorName,
      mobile,
      idProof: idProof || 'Aadhaar / ID Card',
      residentId: resident.id,
      residentName: resident.fullName,
      roomNumber: resident.roomNumber || 'Lobby',
      purpose,
      entryTime: new Date().toISOString(),
      status: 'CHECKED_IN',
      approver
    };

    db.visitors.unshift(newVisitor);
    saveDb(db);

    addAuditLog('usr-warden-01', approver, 'WARDEN', 'VISITOR_ENTRY', 'VISITOR', newVisitor.id, `Visitor ${visitorName} checked in to visit ${resident.fullName}`);
    return NextResponse.json({ success: true, visitor: newVisitor });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to log visitor' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action } = body;
    const db = getDb();

    const visitor = db.visitors.find(v => v.id === id);
    if (!visitor) return NextResponse.json({ error: 'Visitor log not found' }, { status: 404 });

    if (action === 'CHECK_OUT') {
      visitor.status = 'CHECKED_OUT';
      visitor.exitTime = new Date().toISOString();
      saveDb(db);
      addAuditLog('usr-warden-01', 'Warden', 'WARDEN', 'VISITOR_EXIT', 'VISITOR', id, `Visitor ${visitor.visitorName} checked out`);
      return NextResponse.json({ success: true, visitor });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update visitor' }, { status: 500 });
  }
}
