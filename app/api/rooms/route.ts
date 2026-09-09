import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { getClientIp } from '@/lib/utils';
import { Room, Bed, UserRole } from '@/lib/db/types';

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const floor = searchParams.get('floor');
  const type = searchParams.get('type');
  const search = searchParams.get('search')?.toLowerCase();

  let rooms = db.rooms;

  if (floor && floor !== 'ALL') {
    rooms = rooms.filter(r => r.floorName.toLowerCase().includes(floor.toLowerCase()));
  }

  if (type && type !== 'ALL') {
    rooms = rooms.filter(r => r.roomType === type);
  }

  if (search) {
    rooms = rooms.filter(r => r.roomNumber.toLowerCase().includes(search));
  }

  // Attach bed details to each room
  const roomsWithBeds = rooms.map(room => {
    const beds = db.beds.filter(b => b.roomId === room.id);
    const occupiedCount = beds.filter(b => b.status === 'OCCUPIED').length;
    return {
      ...room,
      beds,
      occupiedCount,
      isFull: occupiedCount >= room.capacity,
    };
  });

  return NextResponse.json({
    rooms: roomsWithBeds,
    floors: db.floors,
    buildings: db.buildings,
    totalCount: roomsWithBeds.length
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      roomNumber,
      buildingId = 'bldg-a',
      floorId,
      roomType = 'TWO_SHARING',
      capacity: customCapacity,
      monthlyRent,
      facilities = ['AC', 'Wi-Fi', 'Attached Bath'],
      status = 'ACTIVE',
      autoCreateBeds = true,
      userId = 'usr-owner-01',
      userName = 'Srikanth Varma (Owner)',
      userRole = 'OWNER'
    } = body;

    const trimmedRoomNumber = roomNumber?.trim();
    if (!trimmedRoomNumber) {
      return NextResponse.json({ error: 'Room number is required' }, { status: 400 });
    }

    const db = getDb();
    const clientIp = getClientIp(req);

    // Duplicate check
    const existingRoom = db.rooms.find(
      r => r.roomNumber.toLowerCase() === trimmedRoomNumber.toLowerCase()
    );
    if (existingRoom) {
      return NextResponse.json(
        { error: `Room ${trimmedRoomNumber} already exists in the system.` },
        { status: 400 }
      );
    }

    // Resolve Floor and Building
    const floor = db.floors.find(f => f.id === floorId) || db.floors[0];
    const building = db.buildings.find(b => b.id === (floor?.buildingId || buildingId)) || db.buildings[0];

    // Determine default capacity from roomType if not custom
    let capacity = Number(customCapacity);
    if (!capacity || capacity <= 0) {
      switch (roomType) {
        case 'SINGLE': capacity = 1; break;
        case 'TWO_SHARING': capacity = 2; break;
        case 'THREE_SHARING': capacity = 3; break;
        case 'FOUR_SHARING': capacity = 4; break;
        default: capacity = 2; break;
      }
    }

    const rent = Number(monthlyRent) || 8000;
    const cleanId = `rm-${trimmedRoomNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const newRoom: Room = {
      id: cleanId,
      buildingId: building.id,
      floorId: floor.id,
      roomNumber: trimmedRoomNumber,
      floorName: floor.name,
      roomType,
      capacity,
      monthlyRent: rent,
      facilities: Array.isArray(facilities) ? facilities : ['AC', 'Wi-Fi', 'Attached Bath'],
      status: status === 'MAINTENANCE' ? 'MAINTENANCE' : 'ACTIVE'
    };

    // Auto-create beds
    const bedLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const createdBeds: Bed[] = [];

    if (autoCreateBeds) {
      for (let i = 0; i < capacity; i++) {
        const bedLabel = bedLabels[i] || `${i + 1}`;
        const bedId = `bed-${cleanId}-${bedLabel.toLowerCase()}`;
        const newBed: Bed = {
          id: bedId,
          roomId: newRoom.id,
          roomNumber: newRoom.roomNumber,
          floorName: newRoom.floorName,
          buildingCode: building.code || (newRoom.roomNumber.startsWith('B-') ? 'B' : 'A'),
          bedNumber: bedLabel,
          status: newRoom.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE',
          monthlyRent: rent
        };
        createdBeds.push(newBed);
      }
    }

    // Insert into DB
    db.rooms.push(newRoom);
    if (createdBeds.length > 0) {
      db.beds.push(...createdBeds);
    }
    saveDb(db);

    // Audit log
    addAuditLog(
      userId,
      userName,
      userRole as UserRole,
      'ROOM_CHANGE',
      'ROOM',
      newRoom.id,
      `Created room ${newRoom.roomNumber} (${newRoom.roomType.replace('_', ' ')}) with ${createdBeds.length} beds on ${newRoom.floorName} (${building.name})`,
      {
        ipAddress: clientIp,
        afterData: { room: newRoom, beds: createdBeds },
        status: 'SUCCESS'
      }
    );

    return NextResponse.json({
      success: true,
      room: {
        ...newRoom,
        beds: createdBeds,
        occupiedCount: 0,
        isFull: false
      },
      beds: createdBeds,
      message: `Room ${newRoom.roomNumber} added with ${createdBeds.length} bed(s).`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add room' }, { status: 500 });
  }
}

