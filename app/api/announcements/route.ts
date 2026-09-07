import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { Announcement } from '@/lib/db/types';

export async function GET() {
  const db = getDb();
  return NextResponse.json({ announcements: db.announcements });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, message, priority = 'NORMAL', targetAudience = 'ALL', targetValue, createdBy = 'Admin' } = body;
    const db = getDb();

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const newAnnouncement: Announcement = {
      id: `anc-${Date.now()}`,
      title,
      message,
      priority,
      targetAudience,
      targetValue,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdBy,
      createdAt: new Date().toISOString()
    };

    db.announcements.unshift(newAnnouncement);
    saveDb(db);

    addAuditLog('usr-mgr-01', createdBy, 'MANAGER', 'ANNOUNCEMENT_POSTED', 'ANNOUNCEMENT', newAnnouncement.id, `Broadcast: ${title}`);
    return NextResponse.json({ success: true, announcement: newAnnouncement });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to post notice' }, { status: 500 });
  }
}
