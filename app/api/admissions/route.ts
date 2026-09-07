import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog, numberToWordsIndian } from '@/lib/db/store';
import { Resident, Invoice, Payment } from '@/lib/db/types';
import { getClientIp } from '@/lib/utils';

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

    const {
      fullName,
      photoUrl,
      mobile,
      email,
      dob,
      gender = 'MALE',
      emergencyContactName,
      emergencyContactRelation,
      emergencyContactPhone,
      collegeOrCompany,
      courseOrDesignation,
      permanentAddress,
      currentAddress,
      idProofType,
      idProofNumber,
      bedId,
      feePlanId,
      paymentMethod = 'CASH',
      amountPaid = 0,
      notes = ''
    } = body;

    // 1. Validations
    if (!fullName || !mobile || !emergencyContactPhone || !bedId || !feePlanId) {
      return NextResponse.json({ error: 'Missing required admission fields' }, { status: 400 });
    }

    // Check duplicate active mobile
    const existingMobile = db.residents.find(r => r.mobile === mobile && r.status === 'ACTIVE');
    if (existingMobile) {
      return NextResponse.json({ error: `A resident with mobile ${mobile} is already registered and active.` }, { status: 400 });
    }

    // 2. Validate bed
    const bed = db.beds.find(b => b.id === bedId);
    if (!bed) {
      return NextResponse.json({ error: 'Selected bed not found' }, { status: 404 });
    }
    if (bed.status !== 'AVAILABLE') {
      return NextResponse.json({ error: `Bed ${bed.roomNumber}-${bed.bedNumber} is not available (Current status: ${bed.status})` }, { status: 400 });
    }

    // 3. Validate fee plan
    const feePlan = db.feePlans.find(p => p.id === feePlanId);
    if (!feePlan) {
      return NextResponse.json({ error: 'Fee plan not found' }, { status: 404 });
    }

    // 4. Generate unique resident ID
    const year = new Date().getFullYear();
    const nextSeq = db.residents.length + 1;
    const residentId = `SSH-${year}-${String(nextSeq).padStart(3, '0')}`;

    // 5. Allocate bed atomically
    bed.status = 'OCCUPIED';
    bed.currentResidentId = residentId;
    bed.currentResidentName = fullName;

    const securityDeposit = feePlan.securityDeposit;
    const monthlyRent = feePlan.baseMonthlyRent;
    const totalInitialDue = securityDeposit + monthlyRent;
    const initialPaid = Number(amountPaid) || 0;
    const initialOutstanding = Math.max(0, totalInitialDue - initialPaid);

    // 6. Create Resident object
    const newResident: Resident = {
      id: residentId,
      fullName,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      mobile,
      email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      dob: dob || '2002-01-01',
      gender: gender || 'MALE',
      emergencyContactName: emergencyContactName || 'Parent',
      emergencyContactRelation: emergencyContactRelation || 'Father',
      emergencyContactPhone: emergencyContactPhone || mobile,
      collegeOrCompany: collegeOrCompany || 'Self Employed / Student',
      courseOrDesignation: courseOrDesignation || 'Student',
      permanentAddress: permanentAddress || 'Hyderabad, Telangana',
      currentAddress: currentAddress || `Room ${bed.roomNumber}, Sri Srinivasa Hostel, Madhapur, Hyderabad`,
      idProofType: idProofType || 'AADHAAR',
      idProofNumber: idProofNumber || '4920-1029-4820',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      roomId: bed.roomId,
      roomNumber: bed.roomNumber,
      bedId: bed.id,
      bedNumber: bed.bedNumber,
      feePlanId: feePlan.id,
      feePlanName: feePlan.name,
      securityDeposit,
      monthlyRent,
      outstandingBalance: initialOutstanding,
      documents: [
        {
          id: `doc-${Date.now()}-1`,
          name: `${idProofType || 'Aadhaar'} Document`,
          type: (idProofType as any) || 'AADHAAR',
          url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
          verified: true,
          uploadedAt: new Date().toISOString()
        }
      ],
      allocatedAt: new Date().toISOString()
    };

    db.residents.unshift(newResident);

    // 7. Generate Initial Invoice
    const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const invoiceNumber = `INV-${year}-${String(db.invoices.length + 1).padStart(3, '0')}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);

    const initialInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      residentId,
      residentName: fullName,
      roomNumber: bed.roomNumber,
      bedNumber: bed.bedNumber,
      billingPeriod: `Admission & ${currentMonthName}`,
      items: [
        { id: `item-${Date.now()}-1`, description: 'Refundable Security Deposit', amount: securityDeposit, type: 'DEPOSIT' },
        { id: `item-${Date.now()}-2`, description: `Initial Room Rent (${feePlan.name})`, amount: monthlyRent, type: 'RENT' }
      ],
      subtotal: totalInitialDue,
      discount: 0,
      totalAmount: totalInitialDue,
      paidAmount: initialPaid,
      outstandingBalance: initialOutstanding,
      dueDate: dueDate.toISOString().split('T')[0],
      issueDate: new Date().toISOString().split('T')[0],
      status: initialPaid >= totalInitialDue ? 'PAID' : (initialPaid > 0 ? 'PARTIAL' : 'PENDING'),
      notes: notes || 'Generated on Admission'
    };

    db.invoices.unshift(initialInvoice);

    // 8. Record Initial Payment if paid
    let initialPaymentRecord: Payment | null = null;
    if (initialPaid > 0) {
      const receiptNumber = `RCP-${year}-${String(db.payments.length + 1).padStart(3, '0')}`;
      initialPaymentRecord = {
        id: `pay-${Date.now()}`,
        receiptNumber,
        invoiceId: initialInvoice.id,
        invoiceNumber: initialInvoice.invoiceNumber,
        residentId,
        residentName: fullName,
        amount: initialPaid,
        amountInWords: numberToWordsIndian(initialPaid),
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod,
        referenceNumber: paymentMethod === 'CASH' ? `CASH-ADM-${residentId}` : `TXN-${Date.now()}`,
        status: 'SUCCESS',
        collectedBy: 'Ramesh Naidu (Manager)',
        notes: 'Initial admission fee & deposit payment'
      };
      db.payments.unshift(initialPaymentRecord);
    }

    saveDb(db);

    const clientIp = getClientIp(req);

    addAuditLog(
      'usr-mgr-01',
      'Ramesh Naidu (Manager)',
      'MANAGER',
      'ADMISSION',
      'RESIDENT',
      residentId,
      `Completed admission for ${fullName} to Bed ${bed.roomNumber}-${bed.bedNumber}. Paid ₹${initialPaid} of ₹${totalInitialDue}.`,
      {
        ipAddress: clientIp,
        beforeData: null,
        afterData: {
          residentId,
          fullName,
          roomNumber: bed.roomNumber,
          bedNumber: bed.bedNumber,
          feePlan: feePlan.name,
          securityDeposit,
          monthlyRent,
          initialPaid,
          initialOutstanding
        },
        status: 'SUCCESS'
      }
    );

    addAuditLog(
      'usr-mgr-01',
      'Ramesh Naidu (Manager)',
      'MANAGER',
      'BED_ALLOCATE',
      'BED',
      bed.id,
      `Allocated Bed ${bed.roomNumber}-${bed.bedNumber} to resident ${fullName} (ID: ${residentId})`,
      {
        ipAddress: clientIp,
        beforeData: { status: 'AVAILABLE', occupant: null },
        afterData: { status: 'OCCUPIED', residentId, residentName: fullName },
        status: 'SUCCESS'
      }
    );

    return NextResponse.json({
      success: true,
      message: `Admission completed successfully for ${fullName} (ID: ${residentId})`,
      resident: newResident,
      bed,
      invoice: initialInvoice,
      payment: initialPaymentRecord
    });
  } catch (err: any) {
    console.error('Admission error:', err);
    return NextResponse.json({ error: err.message || 'Failed to complete admission' }, { status: 500 });
  }
}
