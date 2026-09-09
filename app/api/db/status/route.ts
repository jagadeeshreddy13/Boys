import { NextResponse } from 'next/server';
import { getMongoStatus } from '@/lib/db/mongodb';
import { getDb } from '@/lib/db/store';

export async function GET() {
  try {
    const mongoStatus = await getMongoStatus();
    const localDb = getDb();

    return NextResponse.json({
      success: true,
      activeEngine: mongoStatus.connected ? 'MongoDB' : 'Local + Mongo Sync',
      mongodb: mongoStatus,
      snapshotCounts: {
        residents: localDb.residents?.length || 0,
        rooms: localDb.rooms?.length || 0,
        beds: localDb.beds?.length || 0,
        invoices: localDb.invoices?.length || 0,
        payments: localDb.payments?.length || 0,
        complaints: localDb.complaints?.length || 0,
        expenses: localDb.expenses?.length || 0,
        staff: localDb.staff?.length || 0,
        visitors: localDb.visitors?.length || 0,
        auditLogs: localDb.auditLogs?.length || 0,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      activeEngine: 'Local Fallback',
      error: error?.message || 'Failed to retrieve database status'
    }, { status: 500 });
  }
}
