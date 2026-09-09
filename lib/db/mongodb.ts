import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB_NAME || 'sri_srinivasa_hostel';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;
let lastSyncTimestamp: string | null = null;
let lastSyncError: string | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Lazy connection initializer for MongoDB.
 * Reuses the connection across invocations in dev/production.
 */
export async function getMongoClient(): Promise<MongoClient | null> {
  if (!uri) {
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      try {
        client = new MongoClient(uri, {
          connectTimeoutMS: 2000,
          serverSelectionTimeoutMS: 2000,
        });
        global._mongoClientPromise = client.connect();
      } catch (err: any) {
        console.warn('[MongoDB] Init error:', err?.message || err);
        return null;
      }
    }
    clientPromise = global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      try {
        client = new MongoClient(uri, {
          connectTimeoutMS: 2000,
          serverSelectionTimeoutMS: 2000,
        });
        clientPromise = client.connect();
      } catch (err: any) {
        console.warn('[MongoDB] Client creation error:', err?.message || err);
        return null;
      }
    }
  }

  try {
    return await clientPromise;
  } catch (err: any) {
    console.warn('[MongoDB] Connection failed (falling back to JSON/memory store):', err?.message || err);
    return null;
  }
}

/**
 * Gets the connected MongoDB database instance, or null if unreachable.
 */
export async function getMongoDb(): Promise<Db | null> {
  const c = await getMongoClient();
  if (!c) return null;
  try {
    return c.db(dbName);
  } catch (err: any) {
    console.warn('[MongoDB] Database selection error:', err?.message || err);
    return null;
  }
}

/**
 * Asynchronously synchronizes the JSON data store snapshot into MongoDB collections.
 * Runs in background without blocking requests.
 */
export async function syncSnapshotToMongo(snapshot: Record<string, any>): Promise<boolean> {
  try {
    const db = await getMongoDb();
    if (!db) {
      return false;
    }

    const collections = [
      { name: 'hostel', data: snapshot.hostel ? [snapshot.hostel] : [] },
      { name: 'residents', data: snapshot.residents || [] },
      { name: 'rooms', data: snapshot.rooms || [] },
      { name: 'beds', data: snapshot.beds || [] },
      { name: 'invoices', data: snapshot.invoices || [] },
      { name: 'payments', data: snapshot.payments || [] },
      { name: 'complaints', data: snapshot.complaints || [] },
      { name: 'expenses', data: snapshot.expenses || [] },
      { name: 'inventory', data: snapshot.inventory || [] },
      { name: 'visitors', data: snapshot.visitors || [] },
      { name: 'staff', data: snapshot.staff || [] },
      { name: 'announcements', data: snapshot.announcements || [] },
      { name: 'checkout_records', data: snapshot.checkoutRecords || [] },
      { name: 'audit_logs', data: snapshot.auditLogs || [] },
      { name: 'settings', data: snapshot.settings ? [snapshot.settings] : [] }
    ];

    for (const col of collections) {
      if (col.data && col.data.length > 0) {
        const mongoCol = db.collection(col.name);
        // Bulk upsert by id if items have id, or bulk insert
        const operations = col.data.map((item: any) => {
          const doc = { ...item };
          const id = item.id || (col.name === 'hostel' ? 'hostel_main' : undefined);
          if (id) {
            return {
              replaceOne: {
                filter: { _id: id },
                replacement: { ...doc, _id: id },
                upsert: true
              }
            };
          }
          return null;
        }).filter(Boolean);

        if (operations.length > 0) {
          await mongoCol.bulkWrite(operations as any[], { ordered: false });
        }
      }
    }

    lastSyncTimestamp = new Date().toISOString();
    lastSyncError = null;
    return true;
  } catch (err: any) {
    lastSyncError = err?.message || 'Unknown sync error';
    console.warn('[MongoDB] Sync snapshot error:', lastSyncError);
    return false;
  }
}

/**
 * Returns connection diagnostic status and stats for the MongoDB database.
 */
export async function getMongoStatus() {
  const isConfigured = Boolean(uri);
  if (!isConfigured) {
    return {
      isConfigured: false,
      connected: false,
      uriMasked: null,
      dbName,
      collections: {},
      lastSyncedAt: lastSyncTimestamp,
      lastSyncError: null,
    };
  }

  let isConnected = false;
  const collectionCounts: Record<string, number> = {};

  try {
    const db = await getMongoDb();
    if (db) {
      await db.command({ ping: 1 });
      isConnected = true;
      const cols = await db.listCollections().toArray();
      for (const c of cols) {
        try {
          collectionCounts[c.name] = await db.collection(c.name).countDocuments();
        } catch {
          // ignore individual count errors
        }
      }
    }
  } catch {
    isConnected = false;
  }

  return {
    isConfigured,
    connected: isConnected,
    uriMasked: uri ? uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : null,
    dbName,
    collections: collectionCounts,
    lastSyncedAt: lastSyncTimestamp,
    lastSyncError,
  };
}
