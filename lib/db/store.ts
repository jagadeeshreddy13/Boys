import fs from 'fs';
import path from 'path';
import {
  Hostel,
  Building,
  Floor,
  Room,
  Bed,
  User,
  Resident,
  FeePlan,
  Invoice,
  Payment,
  Expense,
  Complaint,
  InventoryItem,
  VisitorLog,
  Staff,
  Announcement,
  CheckoutRecord,
  CanteenProduct,
  CanteenOrder,
  AuditLog,
  SystemSettings,
  UserRole,
} from './types';
import {
  initialHostel,
  initialSettings,
  initialUsers,
  initialBuildings,
  initialFloors,
  initialFeePlans,
  initialRooms,
  initialBeds,
  initialResidents,
  initialInvoices,
  initialPayments,
  initialExpenses,
  initialComplaints,
  initialInventory,
  initialVisitors,
  initialStaff,
  initialAnnouncements,
  initialCanteenProducts,
  initialCanteenOrders,
  initialCheckoutRecords,
  initialAuditLogs,
} from './seed-data';

interface DatabaseSchema {
  hostel: Hostel;
  settings: SystemSettings;
  users: User[];
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  beds: Bed[];
  residents: Resident[];
  feePlans: FeePlan[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  complaints: Complaint[];
  inventory: InventoryItem[];
  visitors: VisitorLog[];
  staff: Staff[];
  announcements: Announcement[];
  checkoutRecords: CheckoutRecord[];
  canteenProducts: CanteenProduct[];
  canteenOrders: CanteenOrder[];
  auditLogs: AuditLog[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'hostel_db.json');

// Memory fallback / in-process singleton
let memoryDb: DatabaseSchema | null = null;

function getFreshInitialData(): DatabaseSchema {
  return {
    hostel: JSON.parse(JSON.stringify(initialHostel)),
    settings: JSON.parse(JSON.stringify(initialSettings)),
    users: JSON.parse(JSON.stringify(initialUsers)),
    buildings: JSON.parse(JSON.stringify(initialBuildings)),
    floors: JSON.parse(JSON.stringify(initialFloors)),
    rooms: JSON.parse(JSON.stringify(initialRooms)),
    beds: JSON.parse(JSON.stringify(initialBeds)),
    residents: JSON.parse(JSON.stringify(initialResidents)),
    feePlans: JSON.parse(JSON.stringify(initialFeePlans)),
    invoices: JSON.parse(JSON.stringify(initialInvoices)),
    payments: JSON.parse(JSON.stringify(initialPayments)),
    expenses: JSON.parse(JSON.stringify(initialExpenses)),
    complaints: JSON.parse(JSON.stringify(initialComplaints)),
    inventory: JSON.parse(JSON.stringify(initialInventory)),
    visitors: JSON.parse(JSON.stringify(initialVisitors)),
    staff: JSON.parse(JSON.stringify(initialStaff)),
    announcements: JSON.parse(JSON.stringify(initialAnnouncements)),
    checkoutRecords: JSON.parse(JSON.stringify(initialCheckoutRecords)),
    canteenProducts: JSON.parse(JSON.stringify(initialCanteenProducts)),
    canteenOrders: JSON.parse(JSON.stringify(initialCanteenOrders)),
    auditLogs: JSON.parse(JSON.stringify(initialAuditLogs)),
  };
}

function ensureDataDirectory() {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // Ignore if running in constrained environment
  }
}

export function getDb(): DatabaseSchema {
  if (memoryDb) {
    return memoryDb;
  }

  ensureDataDirectory();

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      memoryDb = JSON.parse(data);
      
      // Auto-migrate schema properties if needed
      let dirty = false;
      if (!memoryDb!.checkoutRecords || memoryDb!.checkoutRecords.length === 0) {
        memoryDb!.checkoutRecords = JSON.parse(JSON.stringify(initialCheckoutRecords));
        dirty = true;
      }
      if (!memoryDb!.buildings || memoryDb!.buildings.length < 2) {
        memoryDb!.buildings = JSON.parse(JSON.stringify(initialBuildings));
        memoryDb!.floors = JSON.parse(JSON.stringify(initialFloors));
        memoryDb!.rooms = JSON.parse(JSON.stringify(initialRooms));
        memoryDb!.beds = JSON.parse(JSON.stringify(initialBeds));
        dirty = true;
      }
      if (!memoryDb!.auditLogs || memoryDb!.auditLogs.length < 5 || !memoryDb!.auditLogs[0].ipAddress) {
        memoryDb!.auditLogs = JSON.parse(JSON.stringify(initialAuditLogs));
        dirty = true;
      } else {
        // Ensure every audit log has an ipAddress
        memoryDb!.auditLogs.forEach((log) => {
          if (!log.ipAddress) log.ipAddress = '103.24.188.42';
          if (!log.userRole) log.userRole = log.role;
        });
      }

      if (dirty) {
        saveDb(memoryDb!);
      }

      return memoryDb!;
    }
  } catch (err) {
    console.warn('Could not read persistent DB file, seeding new database:', err);
  }

  memoryDb = getFreshInitialData();
  saveDb(memoryDb);
  return memoryDb;
}

export function saveDb(data: DatabaseSchema) {
  memoryDb = data;
  try {
    ensureDataDirectory();
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write persistent DB file, keeping in memory:', err);
  }
}

// Convert numbers into Indian Rupee words (e.g. 9500 -> Rupees Nine Thousand Five Hundred Only)
export function numberToWordsIndian(num: number): string {
  if (num === 0) return 'Rupees Zero Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + (o ? ' ' + ones[o] : '');
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    let res = '';
    if (h > 0) {
      res += ones[h] + ' Hundred';
      if (rem > 0) res += ' and ';
    }
    if (rem > 0) {
      res += convertTwoDigits(rem);
    }
    return res;
  }

  const crores = Math.floor(num / 10000000);
  let rem = num % 10000000;
  const lakhs = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousands = Math.floor(rem / 1000);
  rem = rem % 1000;

  const parts: string[] = [];

  if (crores > 0) parts.push(convertTwoDigits(crores) + ' Crore');
  if (lakhs > 0) parts.push(convertTwoDigits(lakhs) + ' Lakh');
  if (thousands > 0) parts.push(convertTwoDigits(thousands) + ' Thousand');
  if (rem > 0) parts.push(convertThreeDigits(rem));

  return 'Rupees ' + parts.join(' ') + ' Only';
}

export interface AuditLogOptions {
  ipAddress?: string;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  status?: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

// Log audit action with comprehensive tracking
export function addAuditLog(
  userId: string,
  userName: string,
  role: UserRole,
  action: string,
  entity: string,
  entityId: string,
  details?: string,
  options?: AuditLogOptions
): AuditLog {
  const db = getDb();
  const newLog: AuditLog = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId,
    userName,
    role,
    userRole: role,
    action,
    entity,
    entityId,
    ipAddress: options?.ipAddress || '103.24.188.42',
    beforeData: options?.beforeData !== undefined ? options.beforeData : null,
    afterData: options?.afterData !== undefined ? options.afterData : null,
    status: options?.status || 'SUCCESS',
    details,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(newLog);
  // Cap at last 1000 logs
  if (db.auditLogs.length > 1000) {
    db.auditLogs = db.auditLogs.slice(0, 1000);
  }
  saveDb(db);
  return newLog;
}

// Reset database
export function resetDb() {
  const fresh = getFreshInitialData();
  saveDb(fresh);
  return fresh;
}
