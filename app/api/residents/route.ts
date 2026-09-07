import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { getClientIp } from '@/lib/utils';
import { Resident } from '@/lib/db/types';

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.toLowerCase();
  const id = searchParams.get('id');

  if (id) {
    const resident = db.residents.find(r => r.id === id);
    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
    }
    const residentInvoices = db.invoices.filter(i => i.residentId === id);
    const residentPayments = db.payments.filter(p => p.residentId === id);
    const residentComplaints = db.complaints.filter(c => c.residentId === id);

    return NextResponse.json({
      resident,
      invoices: residentInvoices,
      payments: residentPayments,
      complaints: residentComplaints
    });
  }

  let residents = db.residents;

  if (status && status !== 'ALL') {
    residents = residents.filter(r => r.status === status);
  }

  if (search) {
    residents = residents.filter(r =>
      r.fullName.toLowerCase().includes(search) ||
      r.id.toLowerCase().includes(search) ||
      r.mobile.includes(search) ||
      (r.roomNumber && r.roomNumber.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({ residents, total: residents.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();
    const clientIp = getClientIp(req);

    const year = new Date().getFullYear();
    const residentId = body.id || `SSH-${year}-${String(db.residents.length + 1).padStart(3, '0')}`;

    const newResident: Resident = {
      id: residentId,
      fullName: body.fullName,
      photoUrl: body.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      mobile: body.mobile,
      email: body.email || `${body.fullName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      dob: body.dob || '2000-01-01',
      gender: body.gender || 'MALE',
      emergencyContactName: body.emergencyContactName || 'Parent',
      emergencyContactRelation: body.emergencyContactRelation || 'Guardian',
      emergencyContactPhone: body.emergencyContactPhone || body.mobile,
      collegeOrCompany: body.collegeOrCompany || 'Independent Professional',
      courseOrDesignation: body.courseOrDesignation || 'Engineer',
      permanentAddress: body.permanentAddress || 'Hyderabad, Telangana',
      currentAddress: body.currentAddress || 'Sri Srinivasa Hostel',
      idProofType: body.idProofType || 'AADHAAR',
      idProofNumber: body.idProofNumber || 'N/A',
      joiningDate: body.joiningDate || new Date().toISOString().split('T')[0],
      status: body.status || 'ACTIVE',
      roomId: body.roomId || '',
      roomNumber: body.roomNumber || '',
      bedId: body.bedId || '',
      bedNumber: body.bedNumber || '',
      feePlanId: body.feePlanId || '',
      feePlanName: body.feePlanName || 'Standard Accommodation',
      securityDeposit: Number(body.securityDeposit) || 5000,
      monthlyRent: Number(body.monthlyRent) || 7500,
      outstandingBalance: Number(body.outstandingBalance) || 0,
      documents: body.documents || [],
      allocatedAt: new Date().toISOString()
    };

    db.residents.unshift(newResident);
    saveDb(db);

    addAuditLog(
      body.userId || 'usr-mgr-01',
      body.userName || 'Ramesh Naidu (Manager)',
      'MANAGER',
      'RESIDENT_CREATE',
      'RESIDENT',
      residentId,
      `Created resident record for ${newResident.fullName} (${residentId})`,
      {
        ipAddress: clientIp,
        beforeData: null,
        afterData: {
          id: newResident.id,
          fullName: newResident.fullName,
          mobile: newResident.mobile,
          roomNumber: newResident.roomNumber,
          bedNumber: newResident.bedNumber,
          monthlyRent: newResident.monthlyRent
        },
        status: 'SUCCESS'
      }
    );

    return NextResponse.json({ success: true, resident: newResident });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create resident' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId, userName, ...updates } = body;
    const db = getDb();
    const clientIp = getClientIp(req);

    if (!id) {
      return NextResponse.json({ error: 'Resident ID is required' }, { status: 400 });
    }

    const resident = db.residents.find(r => r.id === id);
    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
    }

    // Capture before data
    const beforeData: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      beforeData[key] = (resident as any)[key];
    });

    Object.assign(resident, updates);
    saveDb(db);

    addAuditLog(
      userId || 'usr-mgr-01',
      userName || 'Ramesh Naidu (Manager)',
      'MANAGER',
      'RESIDENT_UPDATE',
      'RESIDENT',
      id,
      `Updated resident ${resident.fullName} profile details (${Object.keys(updates).join(', ')})`,
      {
        ipAddress: clientIp,
        beforeData,
        afterData: updates,
        status: 'SUCCESS'
      }
    );

    return NextResponse.json({ success: true, resident });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update resident' }, { status: 500 });
  }
}
