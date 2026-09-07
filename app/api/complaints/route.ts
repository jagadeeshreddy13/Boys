import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { Complaint, ComplaintPriority, ComplaintStatus } from '@/lib/db/types';
import { getClientIp } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const residentId = searchParams.get('residentId');
  const status = searchParams.get('status');

  let complaints = db.complaints;

  if (residentId) {
    complaints = complaints.filter(c => c.residentId === residentId);
  }

  if (status && status !== 'ALL') {
    complaints = complaints.filter(c => c.status === status);
  }

  return NextResponse.json({ complaints, total: complaints.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { residentId, category, priority = 'MEDIUM', description, photoUrl } = body;
    const db = getDb();
    const clientIp = getClientIp(req);

    if (!residentId || !category || !description) {
      return NextResponse.json({ error: 'Resident ID, category, and description are required' }, { status: 400 });
    }

    const resident = db.residents.find(r => r.id === residentId);
    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
    }

    const newComplaint: Complaint = {
      id: `cmp-${Date.now()}`,
      residentId: resident.id,
      residentName: resident.fullName,
      roomNumber: resident.roomNumber || 'N/A',
      bedNumber: resident.bedNumber,
      category,
      priority: priority as ComplaintPriority,
      description,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      photoUrl
    };

    db.complaints.unshift(newComplaint);
    saveDb(db);

    addAuditLog(
      resident.id,
      resident.fullName,
      'RESIDENT',
      'COMPLAINT_CREATE',
      'COMPLAINT',
      newComplaint.id,
      `New ${priority} priority complaint in ${category} filed for Room ${resident.roomNumber}`,
      {
        ipAddress: clientIp,
        beforeData: null,
        afterData: {
          category,
          priority,
          description,
          roomNumber: resident.roomNumber,
          bedNumber: resident.bedNumber
        },
        status: 'SUCCESS'
      }
    );

    return NextResponse.json({ success: true, complaint: newComplaint });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit complaint' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, assignedStaffId, assignedStaffName, repairCost, workNotes, userId, userName } = body;
    const db = getDb();
    const clientIp = getClientIp(req);

    const complaint = db.complaints.find(c => c.id === id);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const beforeState = {
      status: complaint.status,
      assignedStaffName: complaint.assignedStaffName || null,
      repairCost: complaint.repairCost || null,
      workNotes: complaint.workNotes || null
    };

    if (status) complaint.status = status as ComplaintStatus;
    if (assignedStaffId !== undefined) complaint.assignedStaffId = assignedStaffId;
    if (assignedStaffName !== undefined) complaint.assignedStaffName = assignedStaffName;
    if (repairCost !== undefined) complaint.repairCost = Number(repairCost);
    if (workNotes !== undefined) complaint.workNotes = workNotes;

    if (status === 'RESOLVED' || status === 'CLOSED') {
      complaint.resolvedAt = new Date().toISOString();
    }

    saveDb(db);

    const afterState = {
      status: complaint.status,
      assignedStaffName: complaint.assignedStaffName || null,
      repairCost: complaint.repairCost || null,
      workNotes: complaint.workNotes || null
    };

    addAuditLog(
      userId || 'usr-maint-01',
      userName || assignedStaffName || 'Suresh Varma (Maintenance Lead)',
      'MAINTENANCE_STAFF',
      'COMPLAINT_UPDATE',
      'COMPLAINT',
      id,
      `Updated status of complaint #${id} to ${complaint.status}. Notes: ${workNotes || 'None'}`,
      {
        ipAddress: clientIp,
        beforeData: beforeState,
        afterData: afterState,
        status: 'SUCCESS'
      }
    );

    return NextResponse.json({ success: true, complaint });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update complaint' }, { status: 500 });
  }
}
