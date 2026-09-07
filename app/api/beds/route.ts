import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { BedStatus } from '@/lib/db/types';
import { getClientIp } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status') as BedStatus | null;
  const floor = searchParams.get('floor');
  const roomId = searchParams.get('roomId');

  let beds = db.beds;

  if (status && status !== ('ALL' as any)) {
    beds = beds.filter(b => b.status === status);
  }

  if (floor && floor !== 'ALL') {
    beds = beds.filter(b => b.floorName.toLowerCase().includes(floor.toLowerCase()));
  }

  if (roomId) {
    beds = beds.filter(b => b.roomId === roomId);
  }

  return NextResponse.json({ beds, total: beds.length });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { bedId, status, maintenanceNotes, action, residentId, newBedId, userId, userName } = body;
    const db = getDb();
    const clientIp = getClientIp(req);

    // Handle Bed Transfer
    if (action === 'TRANSFER') {
      if (!residentId || !newBedId) {
        return NextResponse.json({ error: 'residentId and newBedId are required for transfer' }, { status: 400 });
      }

      const resident = db.residents.find(r => r.id === residentId);
      if (!resident) {
        return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
      }

      const targetBed = db.beds.find(b => b.id === newBedId);
      if (!targetBed) {
        return NextResponse.json({ error: 'Target bed not found' }, { status: 404 });
      }

      if (targetBed.status !== 'AVAILABLE') {
        return NextResponse.json({ error: `Target bed ${targetBed.roomNumber}-${targetBed.bedNumber} is already ${targetBed.status}` }, { status: 400 });
      }

      // Record before state
      const beforeState = {
        residentId: resident.id,
        residentName: resident.fullName,
        previousBedId: resident.bedId,
        previousRoomNumber: resident.roomNumber,
        previousBedNumber: resident.bedNumber
      };

      // Free previous bed
      if (resident.bedId) {
        const oldBed = db.beds.find(b => b.id === resident.bedId);
        if (oldBed) {
          oldBed.status = 'AVAILABLE';
          oldBed.currentResidentId = undefined;
          oldBed.currentResidentName = undefined;
        }
      }

      // Allocate new bed
      targetBed.status = 'OCCUPIED';
      targetBed.currentResidentId = resident.id;
      targetBed.currentResidentName = resident.fullName;

      resident.bedId = targetBed.id;
      resident.bedNumber = targetBed.bedNumber;
      resident.roomId = targetBed.roomId;
      resident.roomNumber = targetBed.roomNumber;

      saveDb(db);

      const afterState = {
        residentId: resident.id,
        residentName: resident.fullName,
        newBedId: targetBed.id,
        newRoomNumber: targetBed.roomNumber,
        newBedNumber: targetBed.bedNumber
      };

      addAuditLog(
        userId || 'usr-mgr-01',
        userName || 'Ramesh Naidu (Manager)',
        'MANAGER',
        'BED_TRANSFER',
        'BED',
        newBedId,
        `Transferred resident ${resident.fullName} from Bed ${beforeState.previousRoomNumber}-${beforeState.previousBedNumber} to Bed ${targetBed.roomNumber}-${targetBed.bedNumber}`,
        {
          ipAddress: clientIp,
          beforeData: beforeState,
          afterData: afterState,
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({
        success: true,
        message: `Successfully transferred to ${targetBed.roomNumber}-${targetBed.bedNumber}`,
        resident,
        bed: targetBed
      });
    }

    // Handle status update (e.g. mark maintenance or available)
    if (!bedId) {
      return NextResponse.json({ error: 'bedId is required' }, { status: 400 });
    }

    const bed = db.beds.find(b => b.id === bedId);
    if (!bed) {
      return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
    }

    const beforeStatus = {
      status: bed.status,
      maintenanceNotes: bed.maintenanceNotes || null
    };

    if (status) {
      // Prevent marking an occupied bed as available without checkout
      if (bed.status === 'OCCUPIED' && status === 'AVAILABLE' && bed.currentResidentId) {
        return NextResponse.json({
          error: 'Cannot mark occupied bed as available directly. Please process checkout first to ensure financial settlement.'
        }, { status: 400 });
      }

      bed.status = status;
    }

    if (maintenanceNotes !== undefined) {
      bed.maintenanceNotes = maintenanceNotes;
    }

    saveDb(db);

    const afterStatus = {
      status: bed.status,
      maintenanceNotes: bed.maintenanceNotes || null
    };

    addAuditLog(
      userId || 'usr-mgr-01',
      userName || 'Ramesh Naidu (Manager)',
      'MANAGER',
      'BED_UPDATE',
      'BED',
      bedId,
      `Updated bed ${bed.roomNumber}-${bed.bedNumber} status to ${bed.status}`,
      {
        ipAddress: clientIp,
        beforeData: beforeStatus,
        afterData: afterStatus,
        status: 'SUCCESS'
      }
    );

    return NextResponse.json({ success: true, bed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update bed' }, { status: 500 });
  }
}
