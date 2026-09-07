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
  CanteenProduct,
  CanteenOrder,
  CheckoutRecord,
  AuditLog,
  SystemSettings,
} from './types';

export const initialHostel: Hostel = {
  id: 'hostel-01',
  name: 'Sri Srinivasa Luxury Boys Hostel',
  tagline: 'Premium Accommodation, Homely Food & 24/7 Security',
  address: 'Plot No. 42 & 43, Silicon Valley Road, Near Cyber Towers, Madhapur',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500081',
  phone: '+91 98480 22338',
  email: 'stay@srisrinivasahostel.com',
  gstin: '36AAHCS8920K1ZM',
  rules: [
    'Gate closing time is strictly 10:30 PM.',
    'Smoking, alcohol, and prohibited substances are strictly banned.',
    'Visitors are allowed only in reception lobby between 9 AM to 7 PM.',
    'Keep your rooms clean and switch off geysers and AC when leaving.',
    'Notice period for vacating is minimum 30 days.'
  ],
  bankDetails: {
    accountName: 'Sri Srinivasa Hostel Services LLP',
    accountNumber: '50200049281729',
    ifsc: 'HDFC0001629',
    bankName: 'HDFC Bank, Madhapur Branch',
    upiId: 'srisrinivasahostel@hdfcbank'
  }
};

export const initialSettings: SystemSettings = {
  hostel: initialHostel,
  monthlyBillingDay: 1,
  rentDueDays: 5,
  lateFeePerDay: 100,
  upiId: 'srisrinivasahostel@hdfcbank',
  enableOnlinePayments: true,
  smsNotifications: true,
  whatsappNotifications: true,
  emailNotifications: true,
};

export const initialUsers: User[] = [
  {
    id: 'usr-owner-01',
    name: 'Srikanth Varma',
    email: 'owner@srisrinivasa.com',
    role: 'OWNER',
    phone: '+91 98480 22338',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-mgr-01',
    name: 'Ramesh Naidu',
    email: 'manager@srisrinivasa.com',
    role: 'MANAGER',
    phone: '+91 98480 44556',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2024-01-05T00:00:00.000Z'
  },
  {
    id: 'usr-acct-01',
    name: 'Venkat Rao',
    email: 'accountant@srisrinivasa.com',
    role: 'ACCOUNTANT',
    phone: '+91 98480 66778',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2024-01-10T00:00:00.000Z'
  },
  {
    id: 'usr-warden-01',
    name: 'Suresh Kumar',
    email: 'warden@srisrinivasa.com',
    role: 'WARDEN',
    phone: '+91 98480 88990',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    createdAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'usr-maint-01',
    name: 'Prakash Raju',
    email: 'maintenance@srisrinivasa.com',
    role: 'MAINTENANCE_STAFF',
    phone: '+91 98480 11223',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2024-02-01T00:00:00.000Z'
  },
  {
    id: 'usr-res-01',
    name: 'Rahul Sharma',
    email: 'resident@srisrinivasa.com',
    role: 'RESIDENT',
    phone: '+91 91234 56789',
    residentId: 'SSH-2024-001',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    createdAt: '2024-02-10T00:00:00.000Z'
  }
];

export const initialBuildings: Building[] = [
  {
    id: 'bldg-a',
    hostelId: 'hostel-01',
    name: 'Building A (Main Block)',
    code: 'A',
    floorsCount: 3
  },
  {
    id: 'bldg-b',
    hostelId: 'hostel-01',
    name: 'Building B (Executive Annexe)',
    code: 'B',
    floorsCount: 2
  }
];

export const initialFloors: Floor[] = [
  { id: 'floor-g', buildingId: 'bldg-a', name: 'Ground Floor', floorNumber: 0 },
  { id: 'floor-1', buildingId: 'bldg-a', name: 'First Floor', floorNumber: 1 },
  { id: 'floor-2', buildingId: 'bldg-a', name: 'Second Floor', floorNumber: 2 },
  { id: 'floor-b-g', buildingId: 'bldg-b', name: 'Annexe Ground Floor', floorNumber: 0 },
  { id: 'floor-b-1', buildingId: 'bldg-b', name: 'Annexe First Floor', floorNumber: 1 }
];

export const initialFeePlans: FeePlan[] = [
  {
    id: 'plan-single',
    name: 'Single Luxury AC Room',
    roomType: 'SINGLE',
    baseMonthlyRent: 14000,
    securityDeposit: 8000,
    foodCharges: 3500,
    electricityCharges: 1000,
    laundryCharges: 500,
    wifiCharges: 0,
    otherCharges: 0,
    lateFeePerDay: 100,
    description: 'Private room with attached bathroom, Split AC, Study Table, Wardrobe & High-Speed Wi-Fi.',
    isActive: true
  },
  {
    id: 'plan-two-sharing',
    name: 'Two Sharing Executive (AC + Food)',
    roomType: 'TWO_SHARING',
    baseMonthlyRent: 9500,
    securityDeposit: 5000,
    foodCharges: 3000,
    electricityCharges: 800,
    laundryCharges: 500,
    wifiCharges: 0,
    otherCharges: 0,
    lateFeePerDay: 100,
    description: 'Comfortable twin sharing with separate study desks, attached geyser washroom, 3 times food & housekeeping.',
    isActive: true
  },
  {
    id: 'plan-three-sharing',
    name: 'Three Sharing Standard (Food & Wi-Fi)',
    roomType: 'THREE_SHARING',
    baseMonthlyRent: 7500,
    securityDeposit: 4000,
    foodCharges: 2500,
    electricityCharges: 500,
    laundryCharges: 400,
    wifiCharges: 0,
    otherCharges: 0,
    lateFeePerDay: 100,
    description: 'Spacious triple sharing room with individual lockers, 3-times North & South Indian meals & high speed Wi-Fi.',
    isActive: true
  },
  {
    id: 'plan-four-sharing',
    name: 'Four Sharing Budget Friendly',
    roomType: 'FOUR_SHARING',
    baseMonthlyRent: 6000,
    securityDeposit: 3000,
    foodCharges: 2200,
    electricityCharges: 400,
    laundryCharges: 400,
    wifiCharges: 0,
    otherCharges: 0,
    lateFeePerDay: 100,
    description: 'Economical 4-person room ideal for students with daily room cleaning and hygienic mess food.',
    isActive: true
  }
];

// Helper to construct 20 rooms and 80 beds
export function generateRoomsAndBeds(): { rooms: Room[]; beds: Bed[] } {
  const rooms: Room[] = [];
  const beds: Bed[] = [];

  const roomConfigs: {
    floorId: string;
    floorName: string;
    buildingId?: string;
    buildingCode?: string;
    rooms: { num: string; type: Room['roomType']; cap: number; rent: number; facilities: string[] }[];
  }[] = [
    {
      floorId: 'floor-g',
      floorName: 'Ground Floor',
      rooms: [
        { num: 'G01', type: 'TWO_SHARING', cap: 2, rent: 9500, facilities: ['Attached Bath', 'Geyser', 'Wardrobe', 'Wi-Fi'] },
        { num: 'G02', type: 'TWO_SHARING', cap: 2, rent: 9500, facilities: ['Attached Bath', 'Geyser', 'Wardrobe', 'Wi-Fi'] },
        { num: 'G03', type: 'THREE_SHARING', cap: 3, rent: 7500, facilities: ['Attached Bath', 'Balcony', 'Geyser', 'Wi-Fi'] },
        { num: 'G04', type: 'THREE_SHARING', cap: 3, rent: 7500, facilities: ['Attached Bath', 'Geyser', 'Study Table', 'Wi-Fi'] },
        { num: 'G05', type: 'FOUR_SHARING', cap: 4, rent: 6000, facilities: ['Common Bath', 'Ceiling Fan', 'Lockers', 'Wi-Fi'] },
        { num: 'G06', type: 'SINGLE', cap: 1, rent: 14000, facilities: ['AC', 'Attached Bath', 'Geyser', 'Smart TV', 'Wi-Fi'] }
      ]
    },
    {
      floorId: 'floor-1',
      floorName: 'First Floor',
      rooms: [
        { num: '101', type: 'TWO_SHARING', cap: 2, rent: 9500, facilities: ['AC', 'Attached Bath', 'Geyser', 'Wi-Fi'] },
        { num: '102', type: 'TWO_SHARING', cap: 2, rent: 9500, facilities: ['AC', 'Attached Bath', 'Balcony', 'Wi-Fi'] },
        { num: '103', type: 'THREE_SHARING', cap: 3, rent: 7500, facilities: ['Attached Bath', 'Geyser', 'Wi-Fi'] },
        { num: '104', type: 'THREE_SHARING', cap: 3, rent: 7500, facilities: ['Attached Bath', 'Balcony', 'Wi-Fi'] },
        { num: '105', type: 'FOUR_SHARING', cap: 4, rent: 6000, facilities: ['Attached Bath', 'Individual Desks', 'Wi-Fi'] },
        { num: '106', type: 'FOUR_SHARING', cap: 4, rent: 6000, facilities: ['Attached Bath', 'Lockers', 'Wi-Fi'] },
        { num: '107', type: 'SINGLE', cap: 1, rent: 14000, facilities: ['AC', 'Attached Bath', 'Geyser', 'Balcony', 'Wi-Fi'] }
      ]
    },
    {
      floorId: 'floor-2',
      floorName: 'Second Floor',
      rooms: [
        { num: '201', type: 'TWO_SHARING', cap: 2, rent: 9500, facilities: ['AC', 'Attached Bath', 'Geyser', 'Wi-Fi'] },
        { num: '202', type: 'TWO_SHARING', cap: 2, rent: 9500, facilities: ['AC', 'Attached Bath', 'Geyser', 'Wi-Fi'] },
        { num: '203', type: 'THREE_SHARING', cap: 3, rent: 7500, facilities: ['Attached Bath', 'Balcony', 'Wi-Fi'] },
        { num: '204', type: 'THREE_SHARING', cap: 3, rent: 7500, facilities: ['Attached Bath', 'Geyser', 'Wi-Fi'] },
        { num: '205', type: 'FOUR_SHARING', cap: 4, rent: 6000, facilities: ['Attached Bath', 'Study Desks', 'Wi-Fi'] },
        { num: '206', type: 'FOUR_SHARING', cap: 4, rent: 6000, facilities: ['Attached Bath', 'Wi-Fi'] },
        { num: '207', type: 'SINGLE', cap: 1, rent: 14000, facilities: ['AC', 'Attached Bath', 'Smart TV', 'Balcony', 'Wi-Fi'] }
      ]
    },
    {
      floorId: 'floor-b-g',
      floorName: 'Annexe Ground Floor',
      buildingId: 'bldg-b',
      buildingCode: 'B',
      rooms: [
        { num: 'B-G01', type: 'SINGLE', cap: 1, rent: 14000, facilities: ['AC', 'Attached Bath', 'Workstation', 'Wi-Fi'] },
        { num: 'B-G02', type: 'TWO_SHARING', cap: 2, rent: 9500, facilities: ['AC', 'Attached Bath', 'Geyser', 'Wi-Fi'] },
        { num: 'B-G03', type: 'TWO_SHARING', cap: 2, rent: 9500, facilities: ['Attached Bath', 'Balcony', 'Wi-Fi'] }
      ]
    },
    {
      floorId: 'floor-b-1',
      floorName: 'Annexe First Floor',
      buildingId: 'bldg-b',
      buildingCode: 'B',
      rooms: [
        { num: 'B-101', type: 'TWO_SHARING', cap: 2, rent: 9500, facilities: ['AC', 'Attached Bath', 'Smart TV', 'Wi-Fi'] },
        { num: 'B-102', type: 'THREE_SHARING', cap: 3, rent: 7500, facilities: ['Attached Bath', 'Geyser', 'Wi-Fi'] },
        { num: 'B-103', type: 'SINGLE', cap: 1, rent: 14000, facilities: ['AC', 'Attached Bath', 'Balcony', 'Wi-Fi'] }
      ]
    }
  ];

  const bedLetters = ['A', 'B', 'C', 'D'];

  roomConfigs.forEach(floorCfg => {
    const bId = (floorCfg as any).buildingId || 'bldg-a';
    const bCode = (floorCfg as any).buildingCode || 'A';
    floorCfg.rooms.forEach(r => {
      const roomId = `room-${r.num.toLowerCase()}`;
      rooms.push({
        id: roomId,
        buildingId: bId,
        floorId: floorCfg.floorId,
        roomNumber: r.num,
        floorName: floorCfg.floorName,
        roomType: r.type,
        capacity: r.cap,
        monthlyRent: r.rent,
        facilities: r.facilities,
        status: 'ACTIVE'
      });

      for (let i = 0; i < r.cap; i++) {
        const bedLetter = bedLetters[i];
        const bedId = `bed-${r.num.toLowerCase()}-${bedLetter.toLowerCase()}`;
        beds.push({
          id: bedId,
          roomId: roomId,
          roomNumber: r.num,
          floorName: floorCfg.floorName,
          buildingCode: bCode,
          bedNumber: bedLetter,
          status: 'AVAILABLE',
          monthlyRent: r.rent
        });
      }
    });
  });

  return { rooms, beds };
}

const { rooms: generatedRooms, beds: generatedBeds } = generateRoomsAndBeds();

export const initialRooms = generatedRooms;
export const initialBeds = generatedBeds;

export const initialResidents: Resident[] = [
  {
    id: 'SSH-2024-001',
    fullName: 'Rahul Sharma',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    mobile: '+91 91234 56789',
    email: 'rahul.sharma@gmail.com',
    dob: '2001-08-15',
    gender: 'MALE',
    emergencyContactName: 'Mahesh Sharma',
    emergencyContactRelation: 'Father',
    emergencyContactPhone: '+91 98490 12345',
    collegeOrCompany: 'IIIT Hyderabad',
    courseOrDesignation: 'B.Tech CSE - 3rd Year',
    permanentAddress: 'H.No 4-52, Tilak Road, Vijayawada, Andhra Pradesh',
    currentAddress: 'Room 102, Sri Srinivasa Hostel, Madhapur, Hyderabad',
    idProofType: 'AADHAAR',
    idProofNumber: '4829-1029-4820',
    joiningDate: '2024-01-10',
    status: 'ACTIVE',
    roomId: 'room-102',
    roomNumber: '102',
    bedId: 'bed-102-a',
    bedNumber: 'A',
    feePlanId: 'plan-two-sharing',
    feePlanName: 'Two Sharing Executive (AC + Food)',
    securityDeposit: 5000,
    monthlyRent: 9500,
    outstandingBalance: 0,
    documents: [
      {
        id: 'doc-01',
        name: 'Aadhaar Card (Front & Back)',
        type: 'AADHAAR',
        url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
        verified: true,
        uploadedAt: '2024-01-10T10:00:00Z'
      },
      {
        id: 'doc-02',
        name: 'College Student ID Card',
        type: 'COLLEGE_ID',
        url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
        verified: true,
        uploadedAt: '2024-01-10T10:05:00Z'
      }
    ],
    allocatedAt: '2024-01-10T10:30:00Z'
  },
  {
    id: 'SSH-2024-002',
    fullName: 'Sai Praneeth Reddy',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    mobile: '+91 94401 22889',
    email: 'sai.praneeth@infosys.com',
    dob: '1999-11-20',
    gender: 'MALE',
    emergencyContactName: 'Satyanarayana Reddy',
    emergencyContactRelation: 'Father',
    emergencyContactPhone: '+91 94401 99887',
    collegeOrCompany: 'Infosys Limited, SEZ Gachibowli',
    courseOrDesignation: 'Senior Systems Engineer',
    permanentAddress: 'Plot 12, Revenue Colony, Tirupati, Andhra Pradesh',
    currentAddress: 'Room 102, Sri Srinivasa Hostel, Madhapur, Hyderabad',
    idProofType: 'AADHAAR',
    idProofNumber: '7721-8930-1124',
    joiningDate: '2024-01-15',
    status: 'ACTIVE',
    roomId: 'room-102',
    roomNumber: '102',
    bedId: 'bed-102-b',
    bedNumber: 'B',
    feePlanId: 'plan-two-sharing',
    feePlanName: 'Two Sharing Executive (AC + Food)',
    securityDeposit: 5000,
    monthlyRent: 9500,
    outstandingBalance: 9500, // Due this month
    documents: [
      {
        id: 'doc-03',
        name: 'Aadhaar Card',
        type: 'AADHAAR',
        url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
        verified: true,
        uploadedAt: '2024-01-15T09:00:00Z'
      }
    ],
    allocatedAt: '2024-01-15T09:30:00Z'
  },
  {
    id: 'SSH-2024-003',
    fullName: 'Karthik Varma',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    mobile: '+91 98852 33441',
    email: 'karthik.varma@amazon.com',
    dob: '1998-04-12',
    gender: 'MALE',
    emergencyContactName: 'Bhadra Raju',
    emergencyContactRelation: 'Uncle',
    emergencyContactPhone: '+91 98852 00112',
    collegeOrCompany: 'Amazon Development Centre',
    courseOrDesignation: 'SDE 2',
    permanentAddress: 'Flat 301, Srinivasa Towers, Bhimavaram',
    currentAddress: 'Room 107, Sri Srinivasa Hostel, Madhapur, Hyderabad',
    idProofType: 'PAN',
    idProofNumber: 'BNUPV4421K',
    joiningDate: '2024-02-01',
    status: 'ACTIVE',
    roomId: 'room-107',
    roomNumber: '107',
    bedId: 'bed-107-a',
    bedNumber: 'A',
    feePlanId: 'plan-single',
    feePlanName: 'Single Luxury AC Room',
    securityDeposit: 8000,
    monthlyRent: 14000,
    outstandingBalance: 0,
    documents: [],
    allocatedAt: '2024-02-01T11:00:00Z'
  },
  {
    id: 'SSH-2024-004',
    fullName: 'Aniket Deshmukh',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    mobile: '+91 97654 32100',
    email: 'aniket.d@gmail.com',
    dob: '2002-01-25',
    gender: 'MALE',
    emergencyContactName: 'Sanjay Deshmukh',
    emergencyContactRelation: 'Father',
    emergencyContactPhone: '+91 97654 00000',
    collegeOrCompany: 'CBIT Gandipet',
    courseOrDesignation: 'B.Tech IT - 4th Year',
    permanentAddress: 'Shivaji Nagar, Nanded, Maharashtra',
    currentAddress: 'Room G01, Sri Srinivasa Hostel, Madhapur',
    idProofType: 'AADHAAR',
    idProofNumber: '6620-1192-3382',
    joiningDate: '2024-02-15',
    status: 'ACTIVE',
    roomId: 'room-g01',
    roomNumber: 'G01',
    bedId: 'bed-g01-a',
    bedNumber: 'A',
    feePlanId: 'plan-two-sharing',
    feePlanName: 'Two Sharing Executive (AC + Food)',
    securityDeposit: 5000,
    monthlyRent: 9500,
    outstandingBalance: 0,
    documents: [],
    allocatedAt: '2024-02-15T10:00:00Z'
  },
  {
    id: 'SSH-2024-005',
    fullName: 'Venkatesh Naidu',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    mobile: '+91 99591 88776',
    email: 'venkatesh.n@gmail.com',
    dob: '2000-09-05',
    gender: 'MALE',
    emergencyContactName: 'Lakshmi Naidu',
    emergencyContactRelation: 'Mother',
    emergencyContactPhone: '+91 99591 11223',
    collegeOrCompany: 'Tech Mahindra',
    courseOrDesignation: 'Associate Software Engineer',
    permanentAddress: 'D.No 12-4, Gajuwaka, Visakhapatnam',
    currentAddress: 'Room 203, Sri Srinivasa Hostel, Madhapur',
    idProofType: 'AADHAAR',
    idProofNumber: '5519-3382-9901',
    joiningDate: '2024-03-01',
    status: 'ACTIVE',
    roomId: 'room-203',
    roomNumber: '203',
    bedId: 'bed-203-a',
    bedNumber: 'A',
    feePlanId: 'plan-three-sharing',
    feePlanName: 'Three Sharing Standard (Food & Wi-Fi)',
    securityDeposit: 4000,
    monthlyRent: 7500,
    outstandingBalance: 1500, // Partial pending
    documents: [],
    allocatedAt: '2024-03-01T14:00:00Z'
  }
];

// Seed bed allocations to match initial residents
initialResidents.forEach(res => {
  const bed = initialBeds.find(b => b.id === res.bedId);
  if (bed) {
    bed.status = 'OCCUPIED';
    bed.currentResidentId = res.id;
    bed.currentResidentName = res.fullName;
  }
});

// Seed a couple reserved and maintenance beds
const reservedBed = initialBeds.find(b => b.id === 'bed-g03-a');
if (reservedBed) {
  reservedBed.status = 'RESERVED';
}
const maintBed = initialBeds.find(b => b.id === 'bed-205-c');
if (maintBed) {
  maintBed.status = 'MAINTENANCE';
  maintBed.maintenanceNotes = 'Mattress replacement & spring repair in progress.';
}

export const initialInvoices: Invoice[] = [
  {
    id: 'inv-2024-001',
    invoiceNumber: 'INV-2024-001',
    residentId: 'SSH-2024-001',
    residentName: 'Rahul Sharma',
    roomNumber: '102',
    bedNumber: 'A',
    billingPeriod: 'October 2024',
    items: [
      { id: 'item-1', description: 'Room Rent (Two Sharing AC)', amount: 9500, type: 'RENT' },
      { id: 'item-2', description: 'Hygienic 3-Meal Food Plan', amount: 0, type: 'FOOD' },
      { id: 'item-3', description: 'High-speed Fiber Wi-Fi & Maintenance', amount: 0, type: 'OTHER' }
    ],
    subtotal: 9500,
    discount: 0,
    totalAmount: 9500,
    paidAmount: 9500,
    outstandingBalance: 0,
    dueDate: '2024-10-05',
    issueDate: '2024-10-01',
    status: 'PAID',
    notes: 'Paid on time via UPI.'
  },
  {
    id: 'inv-2024-002',
    invoiceNumber: 'INV-2024-002',
    residentId: 'SSH-2024-002',
    residentName: 'Sai Praneeth Reddy',
    roomNumber: '102',
    bedNumber: 'B',
    billingPeriod: 'October 2024',
    items: [
      { id: 'item-4', description: 'Room Rent (Two Sharing AC)', amount: 9500, type: 'RENT' }
    ],
    subtotal: 9500,
    discount: 0,
    totalAmount: 9500,
    paidAmount: 0,
    outstandingBalance: 9500,
    dueDate: '2024-10-05',
    issueDate: '2024-10-01',
    status: 'PENDING',
    notes: 'Awaiting salary credit.'
  },
  {
    id: 'inv-2024-003',
    invoiceNumber: 'INV-2024-003',
    residentId: 'SSH-2024-003',
    residentName: 'Karthik Varma',
    roomNumber: '107',
    bedNumber: 'A',
    billingPeriod: 'October 2024',
    items: [
      { id: 'item-5', description: 'Single Luxury AC Room Rent', amount: 14000, type: 'RENT' }
    ],
    subtotal: 14000,
    discount: 0,
    totalAmount: 14000,
    paidAmount: 14000,
    outstandingBalance: 0,
    dueDate: '2024-10-05',
    issueDate: '2024-10-01',
    status: 'PAID',
    notes: 'Paid via Net Banking.'
  },
  {
    id: 'inv-2024-004',
    invoiceNumber: 'INV-2024-004',
    residentId: 'SSH-2024-005',
    residentName: 'Venkatesh Naidu',
    roomNumber: '203',
    bedNumber: 'A',
    billingPeriod: 'October 2024',
    items: [
      { id: 'item-6', description: 'Three Sharing Standard Room Rent', amount: 7500, type: 'RENT' }
    ],
    subtotal: 7500,
    discount: 0,
    totalAmount: 7500,
    paidAmount: 6000,
    outstandingBalance: 1500,
    dueDate: '2024-10-05',
    issueDate: '2024-10-01',
    status: 'PARTIAL',
    notes: 'Partial payment of 6,000 received. Balance 1,500 due.'
  }
];

export const initialPayments: Payment[] = [
  {
    id: 'pay-2024-001',
    receiptNumber: 'RCP-2024-001',
    invoiceId: 'inv-2024-001',
    invoiceNumber: 'INV-2024-001',
    residentId: 'SSH-2024-001',
    residentName: 'Rahul Sharma',
    amount: 9500,
    amountInWords: 'Rupees Nine Thousand Five Hundred Only',
    paymentDate: '2024-10-03',
    paymentMethod: 'UPI',
    referenceNumber: 'UPI/428190392819/HDFC',
    status: 'SUCCESS',
    collectedBy: 'Ramesh Naidu (Manager)',
    notes: 'Received via GPay'
  },
  {
    id: 'pay-2024-002',
    receiptNumber: 'RCP-2024-002',
    invoiceId: 'inv-2024-003',
    invoiceNumber: 'INV-2024-003',
    residentId: 'SSH-2024-003',
    residentName: 'Karthik Varma',
    amount: 14000,
    amountInWords: 'Rupees Fourteen Thousand Only',
    paymentDate: '2024-10-02',
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: 'NEFT-ICICI-928172910',
    status: 'SUCCESS',
    collectedBy: 'Venkat Rao (Accountant)',
    notes: 'Verified against bank statement'
  },
  {
    id: 'pay-2024-003',
    receiptNumber: 'RCP-2024-003',
    invoiceId: 'inv-2024-004',
    invoiceNumber: 'INV-2024-004',
    residentId: 'SSH-2024-005',
    residentName: 'Venkatesh Naidu',
    amount: 6000,
    amountInWords: 'Rupees Six Thousand Only',
    paymentDate: '2024-10-04',
    paymentMethod: 'CASH',
    referenceNumber: 'CASH-REC-004',
    status: 'SUCCESS',
    collectedBy: 'Ramesh Naidu (Manager)',
    notes: 'Cash deposited in office locker'
  }
];

export const initialExpenses: Expense[] = [
  {
    id: 'exp-01',
    category: 'FOOD',
    amount: 42500,
    date: '2024-10-02',
    description: 'Weekly mess groceries, rice bags (25kg x 5), dal, cooking oil & spices',
    vendor: 'Sri Lakshmi Wholesale Kirana & General Stores',
    paymentMethod: 'UPI',
    createdBy: 'Ramesh Naidu'
  },
  {
    id: 'exp-02',
    category: 'ELECTRICITY',
    amount: 38400,
    date: '2024-10-05',
    description: 'TSSPDCL Commercial Electricity Bill for Building A (Meter #382910)',
    vendor: 'Telangana Southern Power Distribution Co Ltd',
    paymentMethod: 'ONLINE',
    createdBy: 'Venkat Rao'
  },
  {
    id: 'exp-03',
    category: 'INTERNET',
    amount: 8500,
    date: '2024-10-04',
    description: 'ACT Fibernet Commercial Gigabit Dedicated Lease Line (1 Gbps)',
    vendor: 'ACT Fibernet Hyderabad',
    paymentMethod: 'BANK_TRANSFER',
    createdBy: 'Venkat Rao'
  },
  {
    id: 'exp-04',
    category: 'SALARY',
    amount: 55000,
    date: '2024-10-01',
    description: 'Staff salaries for Head Chef (22k), Assistant Cook (15k), Cleaners (18k)',
    vendor: 'Internal Mess & Cleaning Staff',
    paymentMethod: 'BANK_TRANSFER',
    createdBy: 'Srikanth Varma'
  },
  {
    id: 'exp-05',
    category: 'MAINTENANCE',
    amount: 3200,
    date: '2024-10-06',
    description: 'Geyser heating element replacement & plumbing brass valves for Floor 1',
    vendor: 'Balaji Hardware & Electricals, Madhapur',
    paymentMethod: 'CASH',
    createdBy: 'Prakash Raju'
  }
];

export const initialComplaints: Complaint[] = [
  {
    id: 'cmp-01',
    residentId: 'SSH-2024-001',
    residentName: 'Rahul Sharma',
    roomNumber: '102',
    bedNumber: 'A',
    category: 'INTERNET',
    priority: 'MEDIUM',
    description: 'Wi-Fi router on 1st Floor wing B has high ping during evening peak hours.',
    status: 'IN_PROGRESS',
    assignedStaffId: 'usr-maint-01',
    assignedStaffName: 'Prakash Raju',
    createdAt: '2024-10-05T14:30:00Z',
    workNotes: 'Rebooted access point; inspecting mesh repeater bridge.'
  },
  {
    id: 'cmp-02',
    residentId: 'SSH-2024-002',
    residentName: 'Sai Praneeth Reddy',
    roomNumber: '102',
    bedNumber: 'B',
    category: 'PLUMBING',
    priority: 'HIGH',
    description: 'Bathroom shower tap is dripping water continuously.',
    status: 'RESOLVED',
    assignedStaffId: 'usr-maint-01',
    assignedStaffName: 'Prakash Raju',
    createdAt: '2024-10-04T09:00:00Z',
    resolvedAt: '2024-10-04T16:00:00Z',
    repairCost: 250,
    workNotes: 'Replaced rubber washer & Teflon tape. Leak sealed.'
  },
  {
    id: 'cmp-03',
    residentId: 'SSH-2024-005',
    residentName: 'Venkatesh Naidu',
    roomNumber: '203',
    bedNumber: 'A',
    category: 'AC_FAN',
    priority: 'LOW',
    description: 'Ceiling fan makes slight squeaking sound at speed 5.',
    status: 'NEW',
    createdAt: '2024-10-06T18:00:00Z'
  }
];

export const initialInventory: InventoryItem[] = [
  {
    id: 'inv-item-01',
    name: 'Single Cot Wooden Bed with Headboard',
    sku: 'BED-WOOD-01',
    category: 'FURNITURE',
    totalQuantity: 84,
    availableQuantity: 80,
    inUseQuantity: 78,
    damagedQuantity: 2,
    unit: 'Pieces',
    purchasePrice: 4200,
    purchaseDate: '2023-11-10',
    supplier: 'Royal Wood Industries Hyderabad',
    condition: 'GOOD',
    location: 'Rooms & Ground Floor Storeroom'
  },
  {
    id: 'inv-item-02',
    name: 'Coir & Foam Orthopedic Mattress (72x36x5 inch)',
    sku: 'MAT-ORTHO-02',
    category: 'LINEN',
    totalQuantity: 86,
    availableQuantity: 82,
    inUseQuantity: 78,
    damagedQuantity: 4,
    unit: 'Pieces',
    purchasePrice: 2800,
    purchaseDate: '2023-11-15',
    supplier: 'Kurlon Mattresses Distributor',
    condition: 'GOOD',
    location: 'Rooms & Linen Store'
  },
  {
    id: 'inv-item-03',
    name: 'Crompton 1200mm High-Speed Ceiling Fan',
    sku: 'FAN-CROM-03',
    category: 'ELECTRICAL',
    totalQuantity: 32,
    availableQuantity: 30,
    inUseQuantity: 28,
    damagedQuantity: 1,
    unit: 'Units',
    purchasePrice: 1950,
    purchaseDate: '2023-12-01',
    supplier: 'Crompton Greaves Authorized Dealer',
    condition: 'EXCELLENT',
    location: 'Installed in All Rooms'
  },
  {
    id: 'inv-item-04',
    name: 'Instant Water Geyser (15 Litre 5-Star)',
    sku: 'GEYS-BAJAJ-04',
    category: 'APPLIANCE',
    totalQuantity: 22,
    availableQuantity: 20,
    inUseQuantity: 20,
    damagedQuantity: 2,
    unit: 'Units',
    purchasePrice: 5800,
    purchaseDate: '2023-12-05',
    supplier: 'Bajaj Electricals Wholesale',
    condition: 'GOOD',
    location: 'Attached Bathrooms'
  },
  {
    id: 'inv-item-05',
    name: 'Steel Almirah / Wardrobe with 2 Lockers',
    sku: 'ALM-STEEL-05',
    category: 'FURNITURE',
    totalQuantity: 40,
    availableQuantity: 38,
    inUseQuantity: 38,
    damagedQuantity: 0,
    unit: 'Units',
    purchasePrice: 6500,
    purchaseDate: '2023-12-10',
    supplier: 'Godrej Interio Commercial',
    condition: 'EXCELLENT',
    location: 'All Rooms'
  }
];

export const initialVisitors: VisitorLog[] = [
  {
    id: 'vis-01',
    visitorName: 'Mahesh Sharma',
    mobile: '+91 98490 12345',
    idProof: 'Aadhaar 4829-xxxx-xxxx',
    residentId: 'SSH-2024-001',
    residentName: 'Rahul Sharma',
    roomNumber: '102',
    purpose: 'Parent visiting with homemade snacks',
    entryTime: '2024-10-06T10:15:00Z',
    exitTime: '2024-10-06T12:30:00Z',
    status: 'CHECKED_OUT',
    approver: 'Suresh Kumar (Warden)'
  },
  {
    id: 'vis-02',
    visitorName: 'Amit Verma',
    mobile: '+91 91234 99881',
    idProof: 'Driving License TS09-xxxx',
    residentId: 'SSH-2024-003',
    residentName: 'Karthik Varma',
    roomNumber: '107',
    purpose: 'College project discussion',
    entryTime: '2024-10-06T17:00:00Z',
    status: 'CHECKED_IN',
    approver: 'Suresh Kumar (Warden)'
  }
];

export const initialStaff: Staff[] = [
  {
    id: 'stf-01',
    name: 'Ramesh Naidu',
    role: 'MANAGER',
    phone: '+91 98480 44556',
    joiningDate: '2023-01-01',
    salary: 35000,
    status: 'ACTIVE',
    assignedTasksCount: 4
  },
  {
    id: 'stf-02',
    name: 'Suresh Kumar',
    role: 'WARDEN',
    phone: '+91 98480 88990',
    joiningDate: '2023-03-15',
    salary: 26000,
    status: 'ACTIVE',
    assignedTasksCount: 2
  },
  {
    id: 'stf-03',
    name: 'Venkat Rao',
    role: 'ACCOUNTANT',
    phone: '+91 98480 66778',
    joiningDate: '2023-05-01',
    salary: 28000,
    status: 'ACTIVE',
    assignedTasksCount: 3
  },
  {
    id: 'stf-04',
    name: 'Prakash Raju',
    role: 'ELECTRICIAN',
    phone: '+91 98480 11223',
    joiningDate: '2023-06-01',
    salary: 22000,
    status: 'ACTIVE',
    assignedTasksCount: 1
  },
  {
    id: 'stf-05',
    name: 'Govind Swamy',
    role: 'CHEF',
    phone: '+91 98480 55667',
    joiningDate: '2023-02-01',
    salary: 24000,
    status: 'ACTIVE',
    assignedTasksCount: 0
  }
];

export const initialAnnouncements: Announcement[] = [
  {
    id: 'anc-01',
    title: 'Diwali Special Mess Feast & Celebration',
    message: 'Join us on Sunday evening at 7:30 PM in the Mess Hall for a grand traditional South & North Indian festive buffet and sweets distribution!',
    priority: 'NORMAL',
    targetAudience: 'ALL',
    startDate: '2024-10-01',
    expiryDate: '2024-11-05',
    createdBy: 'Srikanth Varma (Owner)',
    createdAt: '2024-10-01T10:00:00Z'
  },
  {
    id: 'anc-02',
    title: 'Solar Water Heater Maintenance - Floor 2',
    message: 'Hot water supply on 2nd Floor will be suspended between 1:00 PM to 3:30 PM on Thursday for routine descaling of the solar collector tanks.',
    priority: 'URGENT',
    targetAudience: 'FLOOR',
    targetValue: 'Second Floor',
    startDate: '2024-10-05',
    expiryDate: '2024-10-10',
    createdBy: 'Prakash Raju (Maintenance)',
    createdAt: '2024-10-05T09:00:00Z'
  }
];

export const initialCanteenProducts: CanteenProduct[] = [
  { id: 'cnt-01', name: 'Special South Indian Filter Coffee', category: 'BEVERAGES', price: 20, isAvailable: true },
  { id: 'cnt-02', name: 'Masala Irani Chai with Osmania Biscuit', category: 'BEVERAGES', price: 15, isAvailable: true },
  { id: 'cnt-03', name: 'Crispy Ghee Podi Dosa (2 pcs)', category: 'BREAKFAST', price: 60, isAvailable: true },
  { id: 'cnt-04', name: 'Steamed Idli & Medu Vada Combo', category: 'BREAKFAST', price: 50, isAvailable: true },
  { id: 'cnt-05', name: 'Hyderabadi Egg Fried Rice / Biryani', category: 'DINNER', price: 110, isAvailable: true },
  { id: 'cnt-06', name: 'Hot Samosa with Mint Chutney (2 pcs)', category: 'SNACKS', price: 30, isAvailable: true },
  { id: 'cnt-07', name: 'Curd Rice with Pomegranate & Pickle', category: 'LUNCH', price: 60, isAvailable: true }
];

export const initialCanteenOrders: CanteenOrder[] = [
  {
    id: 'ord-01',
    orderNumber: 'ORD-101',
    residentId: 'SSH-2024-001',
    residentName: 'Rahul Sharma',
    roomNumber: '102',
    items: [
      { productId: 'cnt-01', name: 'Special South Indian Filter Coffee', quantity: 1, price: 20 },
      { productId: 'cnt-06', name: 'Hot Samosa with Mint Chutney (2 pcs)', quantity: 1, price: 30 }
    ],
    totalAmount: 50,
    paymentMethod: 'UPI',
    status: 'COMPLETED',
    createdAt: '2024-10-06T17:15:00Z'
  }
];

export const initialCheckoutRecords: CheckoutRecord[] = [
  {
    id: 'chk-101',
    residentId: 'SSH-2023-088',
    residentName: 'Praneeth Reddy',
    roomNumber: '104',
    bedNumber: 'B',
    checkoutDate: '2024-09-28T10:00:00Z',
    depositPaid: 5000,
    pendingDues: 0,
    damageCharges: 500,
    damageNotes: 'Geyser knob replacement',
    refundAmount: 4500,
    amountDueFromResident: 0,
    settlementStatus: 'COMPLETED',
    processedBy: 'Ramesh Naidu (Manager)'
  },
  {
    id: 'chk-102',
    residentId: 'SSH-2023-094',
    residentName: 'Abhishek Kulkarni',
    roomNumber: '205',
    bedNumber: 'C',
    checkoutDate: '2024-10-02T14:30:00Z',
    depositPaid: 4000,
    pendingDues: 1200,
    damageCharges: 0,
    damageNotes: 'Room handed over in immaculate condition',
    refundAmount: 2800,
    amountDueFromResident: 0,
    settlementStatus: 'COMPLETED',
    processedBy: 'Ramesh Naidu (Manager)'
  },
  {
    id: 'chk-103',
    residentId: 'SSH-2023-112',
    residentName: 'Deepak Verma',
    roomNumber: '107',
    bedNumber: 'A',
    checkoutDate: '2024-10-15T11:20:00Z',
    depositPaid: 8000,
    pendingDues: 2000,
    damageCharges: 1000,
    damageNotes: 'Wardrobe lock replacement & deep clean',
    refundAmount: 5000,
    amountDueFromResident: 0,
    settlementStatus: 'COMPLETED',
    processedBy: 'Ramesh Naidu (Manager)'
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud-01',
    userId: 'usr-owner-01',
    userName: 'Srikanth Varma',
    role: 'OWNER',
    userRole: 'OWNER',
    action: 'LOGIN',
    entity: 'AUTH',
    entityId: 'usr-owner-01',
    ipAddress: '103.24.188.42',
    beforeData: null,
    afterData: { email: 'srikanth.varma@srisrinivasahostel.com', role: 'OWNER', method: 'BIOMETRIC_MFA' },
    details: 'Owner logged in successfully with MFA authentication.',
    status: 'SUCCESS',
    timestamp: '2024-10-01T08:00:00Z'
  },
  {
    id: 'aud-02',
    userId: 'usr-owner-01',
    userName: 'Srikanth Varma',
    role: 'OWNER',
    userRole: 'OWNER',
    action: 'SETTINGS_CHANGE',
    entity: 'SETTINGS',
    entityId: 'sys-settings',
    ipAddress: '103.24.188.42',
    beforeData: { lateFeePerDay: 50, rentDueDays: 3 },
    afterData: { lateFeePerDay: 100, rentDueDays: 5 },
    details: 'Updated hostel billing grace period to 5 days and late fee to ₹100/day.',
    status: 'SUCCESS',
    timestamp: '2024-10-01T08:15:00Z'
  },
  {
    id: 'aud-03',
    userId: 'usr-mgr-01',
    userName: 'Ramesh Naidu',
    role: 'MANAGER',
    userRole: 'MANAGER',
    action: 'LOGIN',
    entity: 'AUTH',
    entityId: 'usr-mgr-01',
    ipAddress: '49.205.112.89',
    beforeData: null,
    afterData: { email: 'manager@srisrinivasahostel.com', role: 'MANAGER' },
    details: 'Hostel Manager session started via Office Reception Terminal.',
    status: 'SUCCESS',
    timestamp: '2024-10-01T08:30:00Z'
  },
  {
    id: 'aud-04',
    userId: 'usr-mgr-01',
    userName: 'Ramesh Naidu',
    role: 'MANAGER',
    userRole: 'MANAGER',
    action: 'USER_ROLE_CHANGE',
    entity: 'USER',
    entityId: 'usr-warden-01',
    ipAddress: '49.205.112.89',
    beforeData: { role: 'WARDEN', accessScope: 'NIGHT_SHIFT' },
    afterData: { role: 'WARDEN', accessScope: 'FULL_CAMPUS_24x7' },
    details: 'Upgraded Warden Srinivasa Rao access clearance to Full Campus.',
    status: 'SUCCESS',
    timestamp: '2024-10-01T09:00:00Z'
  },
  {
    id: 'aud-05',
    userId: 'usr-acct-01',
    userName: 'Venkat Rao',
    role: 'ACCOUNTANT',
    userRole: 'ACCOUNTANT',
    action: 'INVOICE_BATCH_CREATE',
    entity: 'INVOICE_BATCH',
    entityId: 'BATCH-2024-10',
    ipAddress: '157.48.22.10',
    beforeData: null,
    afterData: { billingPeriod: 'October 2024', invoicesGenerated: 24, totalBilled: 198500 },
    details: 'Executed automated October 2024 monthly billing cycle for all active residents.',
    status: 'SUCCESS',
    timestamp: '2024-10-01T10:00:00Z'
  },
  {
    id: 'aud-06',
    userId: 'usr-mgr-01',
    userName: 'Ramesh Naidu',
    role: 'MANAGER',
    userRole: 'MANAGER',
    action: 'ADMISSION',
    entity: 'RESIDENT',
    entityId: 'SSH-2024-001',
    ipAddress: '49.205.112.89',
    beforeData: null,
    afterData: {
      residentId: 'SSH-2024-001',
      fullName: 'Rahul Sharma',
      roomNumber: '102',
      bedNumber: 'A',
      feePlan: 'Two Sharing Executive (AC + Food)',
      depositPaid: 5000,
      rent: 9500
    },
    details: 'Completed admission for Rahul Sharma to Bed 102-A with Aadhaar verification.',
    status: 'SUCCESS',
    timestamp: '2024-10-01T11:15:00Z'
  },
  {
    id: 'aud-07',
    userId: 'usr-mgr-01',
    userName: 'Ramesh Naidu',
    role: 'MANAGER',
    userRole: 'MANAGER',
    action: 'BED_ALLOCATE',
    entity: 'BED',
    entityId: 'bed-102-a',
    ipAddress: '49.205.112.89',
    beforeData: { status: 'AVAILABLE', occupant: null },
    afterData: { status: 'OCCUPIED', occupantId: 'SSH-2024-001', residentName: 'Rahul Sharma' },
    details: 'Allocated Bed 102-A to Rahul Sharma upon admission.',
    status: 'SUCCESS',
    timestamp: '2024-10-01T11:18:00Z'
  },
  {
    id: 'aud-08',
    userId: 'usr-acct-01',
    userName: 'Venkat Rao',
    role: 'ACCOUNTANT',
    userRole: 'ACCOUNTANT',
    action: 'PAYMENT_CREATE',
    entity: 'PAYMENT',
    entityId: 'pay-2024-001',
    ipAddress: '157.48.22.10',
    beforeData: { invoiceOutstanding: 14500 },
    afterData: {
      receiptNumber: 'RCP-2024-001',
      amount: 9500,
      paymentMethod: 'UPI',
      referenceNumber: 'UPI-98481239812',
      invoiceOutstandingAfter: 5000
    },
    details: 'Recorded ₹9,500 via PhonePe UPI from Rahul Sharma for Invoice INV-2024-001.',
    status: 'SUCCESS',
    timestamp: '2024-10-02T10:45:00Z'
  },
  {
    id: 'aud-09',
    userId: 'usr-mgr-01',
    userName: 'Ramesh Naidu',
    role: 'MANAGER',
    userRole: 'MANAGER',
    action: 'BED_TRANSFER',
    entity: 'BED',
    entityId: 'bed-107-a',
    ipAddress: '49.205.112.89',
    beforeData: { resident: 'Karthik Varma', previousBed: '103-B', roomType: 'THREE_SHARING' },
    afterData: { resident: 'Karthik Varma', newBed: '107-A', roomType: 'SINGLE' },
    details: 'Transferred Karthik Varma from Bed 103-B to Single AC Room 107 Bed A per upgrade request.',
    status: 'SUCCESS',
    timestamp: '2024-10-02T15:30:00Z'
  },
  {
    id: 'aud-10',
    userId: 'usr-mgr-01',
    userName: 'Ramesh Naidu',
    role: 'MANAGER',
    userRole: 'MANAGER',
    action: 'RESIDENT_UPDATE',
    entity: 'RESIDENT',
    entityId: 'SSH-2024-002',
    ipAddress: '49.205.112.89',
    beforeData: { mobile: '+91 99887 76655', emergencyContactPhone: '+91 99887 00000' },
    afterData: { mobile: '+91 98480 22338', emergencyContactPhone: '+91 98480 11223' },
    details: 'Updated contact numbers and workplace details for resident Sai Kiran Reddy.',
    status: 'SUCCESS',
    timestamp: '2024-10-03T12:00:00Z'
  },
  {
    id: 'aud-11',
    userId: 'usr-acct-01',
    userName: 'Venkat Rao',
    role: 'ACCOUNTANT',
    userRole: 'ACCOUNTANT',
    action: 'EXPENSE_CREATE',
    entity: 'EXPENSE',
    entityId: 'exp-2024-001',
    ipAddress: '157.48.22.10',
    beforeData: null,
    afterData: {
      category: 'ELECTRICITY',
      amount: 42500,
      vendor: 'TSSPDCL Hyderabad',
      paymentMethod: 'BANK_TRANSFER'
    },
    details: 'Paid commercial electricity bill for Building A & B via NEFT transfer to TSSPDCL.',
    status: 'SUCCESS',
    timestamp: '2024-10-03T16:00:00Z'
  },
  {
    id: 'aud-12',
    userId: 'usr-maint-01',
    userName: 'Shiva Kumar',
    role: 'MAINTENANCE_STAFF',
    userRole: 'MAINTENANCE_STAFF',
    action: 'COMPLAINT_UPDATE',
    entity: 'COMPLAINT',
    entityId: 'cmp-01',
    ipAddress: '192.168.1.108',
    beforeData: { status: 'NEW', assignedStaff: null, repairCost: 0 },
    afterData: { status: 'RESOLVED', assignedStaff: 'Shiva Kumar (Electrician)', repairCost: 350, workNotes: 'Replaced AC capacitor and cleaned filter mesh.' },
    details: 'Resolved Room 102 Split AC cooling complaint. Replaced 36uF capacitor.',
    status: 'SUCCESS',
    timestamp: '2024-10-04T14:10:00Z'
  },
  {
    id: 'aud-13',
    userId: 'usr-mgr-01',
    userName: 'Ramesh Naidu',
    role: 'MANAGER',
    userRole: 'MANAGER',
    action: 'CHECKOUT',
    entity: 'RESIDENT',
    entityId: 'SSH-2023-094',
    ipAddress: '49.205.112.89',
    beforeData: { residentStatus: 'ACTIVE', roomNumber: '205', bedNumber: 'C', securityDeposit: 4000 },
    afterData: { residentStatus: 'CHECKED_OUT', settlementStatus: 'COMPLETED', pendingDues: 1200, damageCharges: 0, refundAmount: 2800 },
    details: 'Completed checkout inspection for Abhishek Kulkarni. Bed 205-C released to inventory.',
    status: 'SUCCESS',
    timestamp: '2024-10-05T11:00:00Z'
  },
  {
    id: 'aud-14',
    userId: 'usr-acct-01',
    userName: 'Venkat Rao',
    role: 'ACCOUNTANT',
    userRole: 'ACCOUNTANT',
    action: 'REFUND',
    entity: 'PAYMENT',
    entityId: 'REF-chk-102',
    ipAddress: '157.48.22.10',
    beforeData: { depositHeld: 4000, deductions: 1200 },
    afterData: { refundAmount: 2800, paymentMethod: 'UPI', referenceNumber: 'UPI-REF-99212001' },
    details: 'Disbursed security deposit refund of ₹2,800 via Google Pay UPI to Abhishek Kulkarni.',
    status: 'SUCCESS',
    timestamp: '2024-10-05T11:15:00Z'
  },
  {
    id: 'aud-15',
    userId: 'usr-mgr-01',
    userName: 'Ramesh Naidu',
    role: 'MANAGER',
    userRole: 'MANAGER',
    action: 'LOGOUT',
    entity: 'AUTH',
    entityId: 'usr-mgr-01',
    ipAddress: '49.205.112.89',
    beforeData: { activeSessionHours: 9.5 },
    afterData: null,
    details: 'Manager Ramesh Naidu logged out cleanly after evening day-end audit.',
    status: 'SUCCESS',
    timestamp: '2024-10-05T19:30:00Z'
  }
];
