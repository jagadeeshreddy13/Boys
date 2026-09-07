import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';

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
