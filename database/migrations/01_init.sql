-- Migration: 01_init.sql
-- Sri Srinivasa Hostel ERP Database Initialization for PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TYPE role_type AS ENUM ('OWNER', 'MANAGER', 'ACCOUNTANT', 'WARDEN', 'MAINTENANCE_STAFF', 'RESIDENT');
CREATE TYPE bed_status AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE');
CREATE TYPE resident_status AS ENUM ('ACTIVE', 'RESERVED', 'NOTICE_PERIOD', 'CHECKED_OUT', 'BLOCKED');
CREATE TYPE room_type AS ENUM ('SINGLE', 'TWO_SHARING', 'THREE_SHARING', 'FOUR_SHARING');
CREATE TYPE invoice_status AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'REFUNDED');
CREATE TYPE payment_method AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'ONLINE');
CREATE TYPE payment_status AS ENUM ('SUCCESS', 'PENDING', 'FAILED', 'REFUNDED');
CREATE TYPE complaint_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');
CREATE TYPE complaint_status AS ENUM ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    avatar TEXT,
    role role_type NOT NULL DEFAULT 'RESIDENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. HOSTEL STRUCTURE
CREATE TABLE hostels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    tagline TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    gstin VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hostel_id, code)
);

CREATE TABLE floors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    floor_number INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(building_id, floor_number)
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    room_type room_type NOT NULL,
    capacity INT NOT NULL,
    monthly_rent NUMERIC(10, 2) NOT NULL,
    facilities TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(floor_id, room_number)
);

CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    bed_number VARCHAR(10) NOT NULL, -- 'A', 'B', etc.
    status bed_status NOT NULL DEFAULT 'AVAILABLE',
    monthly_rent NUMERIC(10, 2) NOT NULL,
    maintenance_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, bed_number)
);

CREATE INDEX idx_beds_status ON beds(status);

-- 3. FEE PLANS
CREATE TABLE fee_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    room_type room_type NOT NULL,
    base_monthly_rent NUMERIC(10, 2) NOT NULL,
    security_deposit NUMERIC(10, 2) NOT NULL,
    food_charges NUMERIC(10, 2) DEFAULT 0,
    electricity_charges NUMERIC(10, 2) DEFAULT 0,
    laundry_charges NUMERIC(10, 2) DEFAULT 0,
    wifi_charges NUMERIC(10, 2) DEFAULT 0,
    other_charges NUMERIC(10, 2) DEFAULT 0,
    late_fee_per_day NUMERIC(10, 2) DEFAULT 100,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RESIDENTS
CREATE TABLE residents (
    id VARCHAR(50) PRIMARY KEY, -- 'SSH-2024-001'
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(20) DEFAULT 'MALE',
    emergency_contact_name VARCHAR(255) NOT NULL,
    emergency_contact_relation VARCHAR(100) NOT NULL,
    emergency_contact_phone VARCHAR(20) NOT NULL,
    college_or_company VARCHAR(255) NOT NULL,
    course_or_designation VARCHAR(255) NOT NULL,
    permanent_address TEXT NOT NULL,
    current_address TEXT NOT NULL,
    id_proof_type VARCHAR(50) NOT NULL,
    id_proof_number VARCHAR(100) NOT NULL,
    joining_date DATE NOT NULL,
    status resident_status NOT NULL DEFAULT 'ACTIVE',
    fee_plan_id UUID NOT NULL REFERENCES fee_plans(id),
    security_deposit NUMERIC(10, 2) NOT NULL,
    monthly_rent NUMERIC(10, 2) NOT NULL,
    outstanding_balance NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_residents_status ON residents(status);

CREATE TABLE bed_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bed_id UUID NOT NULL REFERENCES beds(id),
    resident_id VARCHAR(50) NOT NULL REFERENCES residents(id),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_unique_active_bed ON bed_allocations(bed_id) WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_unique_active_resident ON bed_allocations(resident_id) WHERE is_active = TRUE;

CREATE TABLE resident_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id VARCHAR(50) NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. BILLING & PAYMENTS
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    resident_id VARCHAR(50) NOT NULL REFERENCES residents(id),
    billing_period VARCHAR(50) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) DEFAULT 0,
    outstanding_balance NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    status invoice_status NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resident_id, billing_period)
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    resident_id VARCHAR(50) NOT NULL REFERENCES residents(id),
    amount NUMERIC(10, 2) NOT NULL,
    amount_in_words TEXT NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method payment_method NOT NULL,
    reference_number VARCHAR(100) NOT NULL,
    gateway_order_id VARCHAR(100),
    status payment_status NOT NULL DEFAULT 'SUCCESS',
    collected_by VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. EXPENSES & COMPLAINTS & INVENTORY
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    vendor VARCHAR(255) NOT NULL,
    payment_method payment_method NOT NULL,
    receipt_attachment TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id VARCHAR(50) NOT NULL REFERENCES residents(id),
    room_number VARCHAR(50) NOT NULL,
    bed_number VARCHAR(10),
    category VARCHAR(50) NOT NULL,
    priority complaint_priority DEFAULT 'MEDIUM',
    description TEXT NOT NULL,
    status complaint_status DEFAULT 'NEW',
    assigned_staff_id VARCHAR(100),
    repair_cost NUMERIC(10, 2),
    work_notes TEXT,
    photo_url TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    total_quantity INT NOT NULL,
    available_quantity INT NOT NULL,
    in_use_quantity INT NOT NULL,
    damaged_quantity INT DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    purchase_price NUMERIC(10, 2) NOT NULL,
    purchase_date DATE NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    condition VARCHAR(50) DEFAULT 'GOOD',
    location VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    id_proof VARCHAR(100) NOT NULL,
    resident_id VARCHAR(50) NOT NULL REFERENCES residents(id),
    room_number VARCHAR(50) NOT NULL,
    purpose TEXT NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'CHECKED_IN',
    approver VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    joining_date DATE NOT NULL,
    salary NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'NORMAL',
    target_audience VARCHAR(50) DEFAULT 'ALL',
    target_value VARCHAR(100),
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE checkout_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id VARCHAR(50) NOT NULL REFERENCES residents(id),
    room_number VARCHAR(50) NOT NULL,
    bed_number VARCHAR(10) NOT NULL,
    checkout_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deposit_paid NUMERIC(10, 2) NOT NULL,
    pending_dues NUMERIC(10, 2) NOT NULL,
    damage_charges NUMERIC(10, 2) DEFAULT 0,
    damage_notes TEXT,
    refund_amount NUMERIC(10, 2) DEFAULT 0,
    amount_due_from_resident NUMERIC(10, 2) DEFAULT 0,
    settlement_status VARCHAR(50) DEFAULT 'COMPLETED',
    processed_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
