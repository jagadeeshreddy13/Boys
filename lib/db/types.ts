export type UserRole =
  | 'OWNER'
  | 'MANAGER'
  | 'ACCOUNTANT'
  | 'WARDEN'
  | 'MAINTENANCE_STAFF'
  | 'RESIDENT';

export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export type ResidentStatus =
  | 'ACTIVE'
  | 'RESERVED'
  | 'NOTICE_PERIOD'
  | 'CHECKED_OUT'
  | 'BLOCKED';

export type InvoiceStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'REFUNDED';

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'ONLINE';

export type PaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';

export type ComplaintStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export type ExpenseCategory =
  | 'ELECTRICITY'
  | 'WATER'
  | 'INTERNET'
  | 'FOOD'
  | 'SALARY'
  | 'CLEANING'
  | 'MAINTENANCE'
  | 'PURCHASES'
  | 'PROPERTY_RENT'
  | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  residentId?: string;
  staffId?: string;
  createdAt: string;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'SMS' | 'EMAIL' | 'BOTH';
  twoFactorVerifiedAt?: string;
}

export interface TwoFactorPolicy {
  enforceForAll: boolean;
  enforceForStaff: boolean;
  defaultMethod: 'SMS' | 'EMAIL' | 'BOTH';
  otpValidityMinutes: number;
}

export interface Hostel {
  id: string;
  name: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstin?: string;
  rules?: string[];
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    upiId: string;
  };
}

export interface Building {
  id: string;
  hostelId: string;
  name: string;
  code: string;
  floorsCount: number;
}

export interface Floor {
  id: string;
  buildingId: string;
  name: string;
  floorNumber: number;
}

export interface Room {
  id: string;
  buildingId: string;
  floorId: string;
  roomNumber: string;
  floorName: string;
  roomType: 'SINGLE' | 'TWO_SHARING' | 'THREE_SHARING' | 'FOUR_SHARING';
  capacity: number;
  monthlyRent: number;
  facilities: string[];
  status: 'ACTIVE' | 'MAINTENANCE';
}

export interface Bed {
  id: string;
  roomId: string;
  roomNumber: string;
  floorName: string;
  buildingCode: string;
  bedNumber: string; // e.g., 'A', 'B', 'C', 'D'
  status: BedStatus;
  currentResidentId?: string;
  currentResidentName?: string;
  monthlyRent: number;
  maintenanceNotes?: string;
}

export interface ResidentDocument {
  id: string;
  name: string;
  type: 'AADHAAR' | 'PAN' | 'COLLEGE_ID' | 'PASSPORT_PHOTO' | 'ADMISSION_FORM' | 'OTHER';
  url: string;
  verified: boolean;
  uploadedAt: string;
}

export interface Resident {
  id: string; // e.g. SSH-2024-001
  fullName: string;
  photoUrl: string;
  mobile: string;
  email: string;
  dob: string;
  gender: 'MALE';
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  collegeOrCompany: string;
  courseOrDesignation: string;
  permanentAddress: string;
  currentAddress: string;
  idProofType: 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VOTER_ID';
  idProofNumber: string;
  joiningDate: string;
  status: ResidentStatus;
  roomId?: string;
  roomNumber?: string;
  bedId?: string;
  bedNumber?: string;
  feePlanId: string;
  feePlanName: string;
  securityDeposit: number;
  monthlyRent: number;
  outstandingBalance: number;
  documents: ResidentDocument[];
  allocatedAt?: string;
  noticeDate?: string;
  checkoutDate?: string;
}

export interface FeePlan {
  id: string;
  name: string; // e.g. "Two Sharing (AC + Food + Wi-Fi)"
  roomType: 'SINGLE' | 'TWO_SHARING' | 'THREE_SHARING' | 'FOUR_SHARING';
  baseMonthlyRent: number;
  securityDeposit: number;
  foodCharges: number;
  electricityCharges: number;
  laundryCharges: number;
  wifiCharges: number;
  otherCharges: number;
  lateFeePerDay: number;
  description: string;
  isActive: boolean;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  type: 'RENT' | 'DEPOSIT' | 'FOOD' | 'ELECTRICITY' | 'LATE_FEE' | 'DAMAGE' | 'DISCOUNT' | 'OTHER';
}

export interface Invoice {
  id: string; // e.g. INV-2024-001
  invoiceNumber: string;
  residentId: string;
  residentName: string;
  roomNumber: string;
  bedNumber: string;
  billingPeriod: string; // e.g., "October 2024"
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  dueDate: string;
  issueDate: string;
  status: InvoiceStatus;
  notes?: string;
}

export interface Payment {
  id: string; // e.g. PAY-2024-001
  receiptNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  residentId: string;
  residentName: string;
  amount: number;
  amountInWords: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  status: PaymentStatus;
  collectedBy: string;
  notes?: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
  vendor: string;
  paymentMethod: PaymentMethod;
  receiptAttachment?: string;
  createdBy: string;
}

export interface Complaint {
  id: string;
  residentId: string;
  residentName: string;
  roomNumber: string;
  bedNumber?: string;
  category: 'ELECTRICAL' | 'PLUMBING' | 'INTERNET' | 'FURNITURE' | 'CLEANING' | 'WATER' | 'AC_FAN' | 'OTHER';
  priority: ComplaintPriority;
  description: string;
  status: ComplaintStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdAt: string;
  resolvedAt?: string;
  repairCost?: number;
  workNotes?: string;
  photoUrl?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: 'FURNITURE' | 'ELECTRICAL' | 'LINEN' | 'CLEANING' | 'APPLIANCE' | 'HARDWARE';
  totalQuantity: number;
  availableQuantity: number;
  inUseQuantity: number;
  damagedQuantity: number;
  unit: string;
  purchasePrice: number;
  purchaseDate: string;
  supplier: string;
  condition: 'EXCELLENT' | 'GOOD' | 'NEEDS_REPAIR' | 'DAMAGED';
  location: string;
}

export interface VisitorLog {
  id: string;
  visitorName: string;
  mobile: string;
  idProof: string;
  residentId: string;
  residentName: string;
  roomNumber: string;
  purpose: string;
  entryTime: string;
  exitTime?: string;
  status: 'CHECKED_IN' | 'CHECKED_OUT';
  approver: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'MANAGER' | 'WARDEN' | 'ACCOUNTANT' | 'CHEF' | 'CLEANER' | 'ELECTRICIAN' | 'SECURITY';
  phone: string;
  joiningDate: string;
  salary: number;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  assignedTasksCount: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'URGENT';
  targetAudience: 'ALL' | 'BUILDING' | 'FLOOR' | 'ROOM' | 'RESIDENT';
  targetValue?: string; // e.g. "Floor 1" or specific room
  startDate: string;
  expiryDate: string;
  createdBy: string;
  createdAt: string;
}

export interface CheckoutRecord {
  id: string;
  residentId: string;
  residentName: string;
  roomNumber: string;
  bedNumber: string;
  checkoutDate: string;
  depositPaid: number;
  pendingDues: number;
  damageCharges: number;
  damageNotes?: string;
  refundAmount: number; // deposit - pendingDues - damageCharges (if positive)
  amountDueFromResident: number; // if negative
  settlementStatus: 'COMPLETED' | 'PENDING';
  processedBy: string;
}

export interface CanteenProduct {
  id: string;
  name: string;
  category: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS' | 'BEVERAGES';
  price: number;
  isAvailable: boolean;
  image?: string;
}

export interface CanteenOrder {
  id: string;
  orderNumber: string;
  residentId?: string;
  residentName?: string;
  roomNumber?: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod: 'CASH' | 'UPI' | 'ROOM_BILL';
  status: 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  userRole?: UserRole;
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  details?: string;
  status?: 'SUCCESS' | 'FAILURE' | 'WARNING';
  timestamp: string;
}

export interface SystemSettings {
  hostel: Hostel;
  monthlyBillingDay: number; // day of month (e.g., 1st)
  rentDueDays: number; // e.g. 5 days to pay
  lateFeePerDay: number;
  upiId: string;
  enableOnlinePayments: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  emailNotifications: boolean;
  twoFactorPolicy?: {
    enforceForAll: boolean;
    enforceForStaff: boolean;
    defaultMethod: 'SMS' | 'EMAIL' | 'BOTH';
    otpValidityMinutes: number;
  };
}
