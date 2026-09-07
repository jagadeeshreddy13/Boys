'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Resident,
  Invoice,
  Payment,
  Complaint,
  Expense,
  InventoryItem,
  VisitorLog,
  Staff,
  Announcement,
  Bed,
  Room,
  Hostel,
  CheckoutRecord
} from '@/lib/db/types';
import Navbar from '@/components/Navbar';
import Sidebar, { NavView } from '@/components/Sidebar';
import InvoiceReceiptModal from '@/components/InvoiceReceiptModal';
import PaymentModal from '@/components/PaymentModal';
import AdmissionModal from '@/components/AdmissionModal';
import CheckoutModal from '@/components/CheckoutModal';
import BedTransferModal from '@/components/BedTransferModal';
import ComplaintModal from '@/components/ComplaintModal';
import ExpenseModal from '@/components/ExpenseModal';
import VisitorModal from '@/components/VisitorModal';
import CanteenPOSModal from '@/components/CanteenPOSModal';
import AutomatedBillingModal from '@/components/AutomatedBillingModal';
import ResidentPortalView from '@/components/ResidentPortalView';
import AuditTrailView from '@/components/AuditTrailView';
import ReportingView from '@/components/ReportingView';
import ToastContainer, { ToastMessage } from '@/components/Toast';

import {
  Users,
  BedDouble,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  FileText,
  UserPlus,
  Wrench,
  Receipt,
  Package,
  UserCheck,
  Building,
  Plus,
  RefreshCw,
  Printer,
  ChevronRight,
  Sparkles,
  Shield,
  Utensils,
  History,
  Phone,
  Eye,
  LogOut,
  ArrowLeftRight
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

export default function App() {
  // Current User Session (Defaults to OWNER for full control, easily switchable)
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-owner-01',
    name: 'Srikanth Varma',
    email: 'srikanth@srisrinivasahostel.com',
    role: 'OWNER',
    phone: '+91 98490 12345',
    createdAt: new Date().toISOString()
  });

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [activeView, setActiveView] = useState<NavView>('DASHBOARD');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Core Data Stores
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [checkoutRecords, setCheckoutRecords] = useState<CheckoutRecord[]>([]);
  const [hostel, setHostel] = useState<Hostel>({
    id: 'hostel-01',
    name: 'Sri Srinivasa Luxury Boys Hostel',
    tagline: 'Premium Living with Homely South & North Food',
    address: 'Plot 42 & 43, Silicon Valley Layout, Near Cyber Towers, Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    phone: '+91 98490 12345',
    email: 'contact@srisrinivasahostel.com',
    gstin: '36AABCS1429Q1Z2',
    bankDetails: {
      accountName: 'Sri Srinivasa Hostel Services',
      accountNumber: '50200049281928',
      ifsc: 'HDFC0001234',
      bankName: 'HDFC Bank, Madhapur Branch',
      upiId: 'srisrinivasahostel@okaxis'
    }
  });

  // Modals
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedResidentForCheckout, setSelectedResidentForCheckout] = useState<Resident | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedResidentForTransfer, setSelectedResidentForTransfer] = useState<Resident | null>(null);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isVisitorOpen, setIsVisitorOpen] = useState(false);
  const [isCanteenOpen, setIsCanteenOpen] = useState(false);
  const [isBatchBillingOpen, setIsBatchBillingOpen] = useState(false);

  // Document Print Modal
  const [isPrintDocOpen, setIsPrintDocOpen] = useState(false);
  const [docModalType, setDocModalType] = useState<'INVOICE' | 'RECEIPT'>('INVOICE');
  const [selectedDocInvoice, setSelectedDocInvoice] = useState<Invoice | null>(null);
  const [selectedDocPayment, setSelectedDocPayment] = useState<Payment | null>(null);

  // Filters & Searches
  const [roomFloorFilter, setRoomFloorFilter] = useState('ALL');
  const [roomTypeFilter, setRoomTypeFilter] = useState('ALL');
  const [bedStatusFilter, setBedStatusFilter] = useState('ALL');
  const [residentSearch, setResidentSearch] = useState('');
  const [residentStatusFilter, setResidentStatusFilter] = useState('ALL');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [selectedResidentDetail, setSelectedResidentDetail] = useState<Resident | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchInitialData = async () => {
    try {
      const [
        authRes,
        dashRes,
        roomsRes,
        bedsRes,
        resRes,
        invRes,
        payRes,
        cmpRes,
        expRes,
        invtRes,
        visRes,
        stfRes,
        ancRes,
        audRes,
        chkRes
      ] = await Promise.all([
        fetch('/api/auth'),
        fetch('/api/dashboard'),
        fetch('/api/rooms'),
        fetch('/api/beds'),
        fetch('/api/residents'),
        fetch('/api/invoices'),
        fetch('/api/payments'),
        fetch('/api/complaints'),
        fetch('/api/expenses'),
        fetch('/api/inventory'),
        fetch('/api/visitors'),
        fetch('/api/staff'),
        fetch('/api/announcements'),
        fetch('/api/audit'),
        fetch('/api/checkout')
      ]);

      const authData = await authRes.json();
      if (authData.availableUsers) setAvailableUsers(authData.availableUsers);

      const dashData = await dashRes.json();
      setDashboardData(dashData);
      if (dashData.hostel) setHostel(dashData.hostel);

      const roomsData = await roomsRes.json();
      setRooms(roomsData.rooms || []);

      const bedsData = await bedsRes.json();
      setBeds(bedsData.beds || []);

      const resData = await resRes.json();
      setResidents(resData.residents || []);

      const invData = await invRes.json();
      setInvoices(invData.invoices || []);

      const payData = await payRes.json();
      setPayments(payData.payments || []);

      const cmpData = await cmpRes.json();
      setComplaints(cmpData.complaints || []);

      const expData = await expRes.json();
      setExpenses(expData.expenses || []);

      const invtData = await invtRes.json();
      setInventory(invtData.inventory || []);

      const visData = await visRes.json();
      setVisitors(visData.visitors || []);

      const stfData = await stfRes.json();
      setStaffList(stfData.staff || []);

      const ancData = await ancRes.json();
      setAnnouncements(ancData.announcements || []);

      const audData = await audRes.json();
      setAuditLogs(audData.auditLogs || []);

      const chkData = await chkRes.json();
      setCheckoutRecords(chkData.checkouts || []);
    } catch (err) {
      console.error('Data fetch error:', err);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        fetchInitialData();
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Switch persona handler
  const handleSwitchUser = async (role: UserRole) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch_role', role })
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        if (role === 'RESIDENT') {
          setActiveView('RESIDENT_PORTAL');
        } else if (activeView === 'RESIDENT_PORTAL') {
          setActiveView('DASHBOARD');
        }
        addToast('info', `Switched Persona to ${data.user.name} (${role})`);
        fetchInitialData();
      }
    } catch {
      addToast('error', 'Failed to switch user');
    }
  };

  // Reset database to initial seed state
  const handleResetDatabase = async () => {
    if (confirm('Reset Sri Srinivasa Hostel ERP database to initial seed records?')) {
      try {
        const res = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'RESET_DATABASE' })
        });
        const data = await res.json();
        if (data.success) {
          addToast('success', 'Database Reset', 'Reset to initial pristine seed dataset.');
          fetchInitialData();
        }
      } catch {
        addToast('error', 'Failed to reset database');
      }
    }
  };

  // Admission Completed Callback
  const handleAdmissionSuccess = (data: any) => {
    addToast('success', 'Admission Complete', `Registered ${data.resident.fullName} (${data.resident.id})`);
    fetchInitialData();
    // Open printable receipt if initial payment was made, else invoice
    if (data.payment) {
      setSelectedDocPayment(data.payment);
      setSelectedDocInvoice(data.invoice);
      setDocModalType('RECEIPT');
      setIsPrintDocOpen(true);
    } else if (data.invoice) {
      setSelectedDocInvoice(data.invoice);
      setDocModalType('INVOICE');
      setIsPrintDocOpen(true);
    }
  };

  // Payment Recorded Callback
  const handlePaymentSuccess = (data: any) => {
    addToast('success', 'Payment Recorded', `Receipt ${data.receiptNumber} generated.`);
    fetchInitialData();
    setSelectedDocPayment(data.payment);
    setSelectedDocInvoice(data.invoice);
    setDocModalType('RECEIPT');
    setIsPrintDocOpen(true);
  };

  // Checkout Completed Callback
  const handleCheckoutSuccess = (data: any) => {
    addToast('success', 'Checkout Complete', `Bed freed. Net refund: ₹${data.checkoutRecord.refundAmount}`);
    fetchInitialData();
  };

  // Bed Transfer Completed
  const handleTransferSuccess = () => {
    addToast('success', 'Bed Transferred', 'Resident reallocated to new bed successfully.');
    fetchInitialData();
  };

  // Batch Billing Completed
  const handleBatchBillingSuccess = (data: any) => {
    addToast('success', 'Batch Invoices Generated', `Created ${data.generatedCount} invoices totaling ₹${data.totalBilled}. Skipped ${data.skippedCount} duplicates.`);
    fetchInitialData();
  };

  // Complaint Filed
  const handleComplaintSuccess = (cmp: Complaint) => {
    addToast('success', 'Ticket Logged', `Complaint #${cmp.id} filed.`);
    fetchInitialData();
  };

  // Expense Logged
  const handleExpenseSuccess = (exp: Expense) => {
    addToast('success', 'Expense Logged', `₹${exp.amount} recorded for ${exp.category}`);
    fetchInitialData();
  };

  // Visitor Logged
  const handleVisitorSuccess = (vis: VisitorLog) => {
    addToast('success', 'Visitor Checked In', `${vis.visitorName} logged at reception`);
    fetchInitialData();
  };

  // Canteen Order Placed
  const handleCanteenSuccess = (order: any) => {
    addToast('success', 'Canteen Order Complete', `Order ${order.orderNumber} placed for ₹${order.totalAmount}`);
    fetchInitialData();
  };

  // Calculate high-level stats
  const totalBeds = beds.length || 65;
  const occupiedBeds = beds.filter(b => b.status === 'OCCUPIED').length;
  const availableBeds = beds.filter(b => b.status === 'AVAILABLE').length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const openComplaintsCount = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  const pendingInvoices = invoices.filter(i => i.status === 'PENDING' || i.status === 'PARTIAL');
  const pendingFeesTotal = invoices.reduce((sum, inv) => sum + inv.outstandingBalance, 0);

  // Active Resident profile for Resident Portal
  const loggedInResident = residents.find(r => r.id === 'SSH-2024-001') || residents[0];

  // Colors for Recharts
  const PIE_COLORS = ['#d97706', '#059669', '#2563eb', '#9333ea', '#e11d48'];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        availableUsers={availableUsers}
        onSwitchUser={handleSwitchUser}
        onOpenAdmissionModal={() => setIsAdmissionOpen(true)}
        onResetDatabase={handleResetDatabase}
        occupancyRate={occupancyRate}
        openComplaintsCount={openComplaintsCount}
        pendingFeesCount={pendingInvoices.length}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          currentRole={currentUser.role}
          activeView={activeView}
          onSelectView={setActiveView}
          openComplaintsCount={openComplaintsCount}
          pendingInvoicesCount={pendingInvoices.length}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all">
          {/* ============================================================ */}
          {/* VIEW: RESIDENT PORTAL (Dedicated View for Resident Role) */}
          {/* ============================================================ */}
          {activeView === 'RESIDENT_PORTAL' && loggedInResident && (
            <ResidentPortalView
              resident={loggedInResident}
              invoices={invoices}
              payments={payments}
              complaints={complaints}
              announcements={announcements}
              hostel={hostel}
              onPayInvoice={(inv) => {
                setSelectedInvoiceForPayment(inv);
                setIsPaymentOpen(true);
              }}
              onFileComplaint={() => setIsComplaintOpen(true)}
              onRequestCheckout={() => {
                setSelectedResidentForCheckout(loggedInResident);
                setIsCheckoutOpen(true);
              }}
              onOpenReceipt={(p) => {
                setSelectedDocPayment(p);
                const inv = invoices.find(i => i.id === p.invoiceId);
                setSelectedDocInvoice(inv || null);
                setDocModalType('RECEIPT');
                setIsPrintDocOpen(true);
              }}
            />
          )}

          {/* ============================================================ */}
          {/* VIEW: DASHBOARD (For Admin, Owner, Manager, Warden, Accountant) */}
          {/* ============================================================ */}
          {activeView === 'DASHBOARD' && dashboardData && (
            <div className="space-y-6">
              {/* Top Row Action Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Hostel Operational Command Center
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live telemetry for Sri Srinivasa Luxury Boys Hostel (Madhapur Branch)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setIsAdmissionOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    New Admission
                  </button>

                  <button
                    onClick={() => setIsBatchBillingOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Run Monthly Billing
                  </button>

                  <button
                    onClick={() => setIsCanteenOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors"
                  >
                    <Utensils className="w-4 h-4" />
                    Canteen POS
                  </button>
                </div>
              </div>

              {/* KPI Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Occupancy */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Occupancy Rate</span>
                    <BedDouble className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{occupancyRate}%</span>
                    <span className="text-xs text-slate-500">
                      ({occupiedBeds} of {totalBeds} beds)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{availableBeds} Vacant Beds</span>
                    <span>{residents.length} Active Residents</span>
                  </div>
                </div>

                {/* 2. Monthly Revenue */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Collections</span>
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">
                      ₹{dashboardData.kpis.monthlyRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Real-time settled payments</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {payments.length} successful receipts issued
                  </div>
                </div>

                {/* 3. Pending Fee Arrears */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Unpaid Dues</span>
                    <Clock className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-rose-600">
                      ₹{pendingFeesTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    Across {pendingInvoices.length} pending invoices
                  </div>
                  <button
                    onClick={() => setActiveView('INVOICES')}
                    className="text-[10px] text-amber-700 font-bold hover:underline block"
                  >
                    View Due Invoices →
                  </button>
                </div>

                {/* 4. Open Maintenance Grievances */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Open Tickets</span>
                    <Wrench className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{openComplaintsCount}</span>
                    <span className="text-xs text-slate-500">Active</span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    {complaints.filter(c => c.priority === 'EMERGENCY' || c.priority === 'HIGH').length} High Priority
                  </div>
                  <button
                    onClick={() => setActiveView('COMPLAINTS')}
                    className="text-[10px] text-amber-700 font-bold hover:underline block"
                  >
                    Manage Tickets →
                  </button>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart 1: Floor-wise Occupancy (2 Cols) */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Floor-wise Bed Allocation Matrix</h3>
                      <p className="text-xs text-slate-500">Occupied vs Available capacity per floor</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      3 Floors • Ground, 1st & 2nd
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.floorStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                        />
                        <Bar dataKey="occupied" name="Occupied Beds" fill="#d97706" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="available" name="Available Beds" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="maintenance" name="Maintenance" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Fee Collections by Payment Method (1 Col) */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Payment Modes Breakdown</h3>
                    <p className="text-xs text-slate-500">UPI vs Cash vs Bank vs Online</p>
                  </div>

                  <div className="h-48 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.paymentMethods}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="amount"
                        >
                          {dashboardData.paymentMethods.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    {dashboardData.paymentMethods.map((m: any, idx: number) => (
                      <div key={m.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                          <span className="text-slate-600 font-medium">{m.name}</span>
                        </div>
                        <span className="font-bold text-slate-900">₹{m.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Recent Payments & Recent Complaints */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Collections */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">Recent Fee Receipts Issued</h3>
                    <button
                      onClick={() => setActiveView('PAYMENTS')}
                      className="text-xs font-semibold text-amber-700 hover:underline"
                    >
                      View All Payments →
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {payments.slice(0, 4).map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{p.residentName}</span>
                            <span className="font-mono text-[10px] text-slate-400">{p.receiptNumber}</span>
                          </div>
                          <span className="text-slate-500 text-[11px]">{p.paymentDate} • {p.paymentMethod}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-emerald-700 block">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedDocPayment(p);
                              const inv = invoices.find(i => i.id === p.invoiceId);
                              setSelectedDocInvoice(inv || null);
                              setDocModalType('RECEIPT');
                              setIsPrintDocOpen(true);
                            }}
                            className="text-[10px] text-slate-500 hover:text-amber-700 flex items-center gap-1 ml-auto"
                          >
                            <Printer className="w-3 h-3" /> Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Complaints */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">Active Maintenance Tickets</h3>
                    <button
                      onClick={() => setActiveView('COMPLAINTS')}
                      className="text-xs font-semibold text-amber-700 hover:underline"
                    >
                      View Ticket Kanban →
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {complaints.slice(0, 4).map((c) => (
                      <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 uppercase text-[10px]">{c.category}</span>
                            <span className="text-slate-500 text-[11px]">Room {c.roomNumber}</span>
                          </div>
                          <p className="text-slate-600 truncate text-[11px] mt-0.5">{c.description}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            c.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: ROOMS & BED MATRIX */}
          {/* ============================================================ */}
          {activeView === 'ROOMS' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Rooms & Visual Bed Allocation Matrix
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any green vacant bed to admit a resident, or an occupied bed to transfer/checkout
                  </p>
                </div>

                {/* Status Legend */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-blue-600"></span>
                    <span>Occupied</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-purple-500"></span>
                    <span>Reserved</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-rose-500"></span>
                    <span>Maintenance</span>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Filter className="w-4 h-4 text-slate-400" /> Filters:
                </div>

                <select
                  value={roomFloorFilter}
                  onChange={(e) => setRoomFloorFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="ALL">All Floors</option>
                  <option value="Ground">Ground Floor</option>
                  <option value="First">First Floor</option>
                  <option value="Second">Second Floor</option>
                </select>

                <select
                  value={roomTypeFilter}
                  onChange={(e) => setRoomTypeFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="ALL">All Room Types</option>
                  <option value="SINGLE">Single AC</option>
                  <option value="TWO_SHARING">Two Sharing</option>
                  <option value="THREE_SHARING">Three Sharing</option>
                  <option value="FOUR_SHARING">Four Sharing</option>
                </select>
              </div>

              {/* Room Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rooms
                  .filter(r => roomFloorFilter === 'ALL' || r.floorName.includes(roomFloorFilter))
                  .filter(r => roomTypeFilter === 'ALL' || r.roomType === roomTypeFilter)
                  .map((room) => {
                    const roomBeds = beds.filter(b => b.roomId === room.id);
                    const occupiedCount = roomBeds.filter(b => b.status === 'OCCUPIED').length;

                    return (
                      <div
                        key={room.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-base text-slate-900">
                                Room {room.roomNumber}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                room.facilities?.includes('AC') ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {room.facilities?.includes('AC') ? 'AC' : 'Non-AC'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {room.floorName} • {room.roomType.replace('_', ' ')}
                            </p>
                          </div>

                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                            occupiedCount >= room.capacity
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {occupiedCount}/{room.capacity} Occupied
                          </span>
                        </div>

                        {/* Bed Matrix inside this room */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Beds Allocation:
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {roomBeds.map((bed) => {
                              const resident = residents.find(r => r.id === bed.currentResidentId);

                              return (
                                <div
                                  key={bed.id}
                                  onClick={() => {
                                    if (bed.status === 'AVAILABLE') {
                                      setIsAdmissionOpen(true);
                                    } else if (bed.status === 'OCCUPIED' && resident) {
                                      setSelectedResidentDetail(resident);
                                    }
                                  }}
                                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                    bed.status === 'AVAILABLE'
                                      ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100 text-emerald-950'
                                      : bed.status === 'OCCUPIED'
                                      ? 'bg-blue-50/70 border-blue-300 hover:bg-blue-100 text-blue-950'
                                      : bed.status === 'MAINTENANCE'
                                      ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                                      : 'bg-purple-50/70 border-purple-300 text-purple-950'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold">Bed {bed.bedNumber}</span>
                                    <span className={`w-2 h-2 rounded-full ${
                                      bed.status === 'AVAILABLE' ? 'bg-emerald-600' :
                                      bed.status === 'OCCUPIED' ? 'bg-blue-600' : 'bg-rose-600'
                                    }`} />
                                  </div>

                                  {bed.status === 'OCCUPIED' && resident ? (
                                    <div className="mt-1">
                                      <p className="font-bold truncate text-slate-900">{resident.fullName}</p>
                                      <p className="text-[10px] text-blue-700 font-mono">{resident.id}</p>
                                    </div>
                                  ) : (
                                    <div className="mt-1">
                                      <span className="font-semibold text-emerald-800 text-[11px] block">
                                        + Click to Admit
                                      </span>
                                      <span className="text-[10px] text-slate-500">₹{bed.monthlyRent}/mo</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Washroom: {room.facilities?.some(f => f.toLowerCase().includes('attached')) ? 'Attached' : 'Common'}</span>
                          <span>Base Rent: ₹{room.monthlyRent}/mo</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: RESIDENTS DIRECTORY */}
          {/* ============================================================ */}
          {activeView === 'RESIDENTS' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Residents Master Directory
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Search residents, inspect KYC Aadhaar documents, handle bed transfers and checkouts
                  </p>
                </div>

                <button
                  onClick={() => setIsAdmissionOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Register New Resident
                </button>
              </div>

              {/* Search & Status Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by resident name, mobile, room or ID..."
                    value={residentSearch}
                    onChange={(e) => setResidentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600">Status:</span>
                  <select
                    value={residentStatusFilter}
                    onChange={(e) => setResidentStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="NOTICE_PERIOD">Notice Period</option>
                    <option value="CHECKED_OUT">Checked Out</option>
                  </select>
                </div>
              </div>

              {/* Residents Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Resident</th>
                      <th className="px-5 py-3.5">Allocation</th>
                      <th className="px-5 py-3.5">Contact & KYC</th>
                      <th className="px-5 py-3.5">Joined Date</th>
                      <th className="px-5 py-3.5">Dues Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {residents
                      .filter(r =>
                        !residentSearch ||
                        r.fullName.toLowerCase().includes(residentSearch.toLowerCase()) ||
                        r.mobile.includes(residentSearch) ||
                        r.id.toLowerCase().includes(residentSearch.toLowerCase()) ||
                        (r.roomNumber && r.roomNumber.includes(residentSearch))
                      )
                      .filter(r => residentStatusFilter === 'ALL' || r.status === residentStatusFilter)
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={r.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                                alt={r.fullName}
                                className="w-9 h-9 rounded-xl object-cover bg-slate-200 border border-slate-300"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block text-sm">{r.fullName}</span>
                                <span className="text-[11px] font-mono text-slate-400">{r.id}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {r.status === 'CHECKED_OUT' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                                Checked Out
                              </span>
                            ) : (
                              <div>
                                <span className="font-bold text-slate-800 block">
                                  Room {r.roomNumber} - Bed {r.bedNumber}
                                </span>
                                <span className="text-[11px] text-slate-500">{r.feePlanName}</span>
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-slate-900 font-semibold block">{r.mobile}</span>
                            <span className="text-[10px] text-emerald-700 font-bold block">
                              ✓ {r.idProofType}: {r.idProofNumber}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-slate-600">{r.joiningDate}</td>

                          <td className="px-5 py-4">
                            {r.outstandingBalance > 0 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                                Due: ₹{r.outstandingBalance.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                Fully Paid
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right space-x-2">
                            <button
                              onClick={() => setSelectedResidentDetail(r)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                            >
                              Profile
                            </button>

                            {r.status === 'ACTIVE' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedResidentForTransfer(r);
                                    setIsTransferOpen(true);
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200"
                                  title="Transfer bed"
                                >
                                  Transfer
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedResidentForCheckout(r);
                                    setIsCheckoutOpen(true);
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
                                  title="Checkout"
                                >
                                  Checkout
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: INVOICES & BATCH BILLING */}
          {/* ============================================================ */}
          {activeView === 'INVOICES' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Invoices & Automated Monthly Billing
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate batch monthly bills for all active residents with one click
                  </p>
                </div>

                <button
                  onClick={() => setIsBatchBillingOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Run Automated Monthly Billing
                </button>
              </div>

              {/* Invoices List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Invoice #</th>
                      <th className="px-5 py-3.5">Resident</th>
                      <th className="px-5 py-3.5">Billing Period</th>
                      <th className="px-5 py-3.5">Due Date</th>
                      <th className="px-5 py-3.5">Total Bill</th>
                      <th className="px-5 py-3.5">Balance Due</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-slate-900 block">{inv.residentName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Room {inv.roomNumber}-{inv.bedNumber}</span>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-800">{inv.billingPeriod}</td>
                        <td className="px-5 py-3.5 text-slate-600">{inv.dueDate}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          ₹{inv.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 font-extrabold text-rose-600">
                          ₹{inv.outstandingBalance.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'PARTIAL'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedDocInvoice(inv);
                              setDocModalType('INVOICE');
                              setIsPrintDocOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                          >
                            Print Bill
                          </button>

                          {inv.outstandingBalance > 0 && (
                            <button
                              onClick={() => {
                                setSelectedInvoiceForPayment(inv);
                                setIsPaymentOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            >
                              Collect Fee
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: PAYMENTS & RECEIPTS */}
          {/* ============================================================ */}
          {activeView === 'PAYMENTS' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Fee Collections & Money Receipts
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official receipts with words formatting and audit tracking
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Receipt #</th>
                      <th className="px-5 py-3.5">Resident</th>
                      <th className="px-5 py-3.5">Invoice Ref</th>
                      <th className="px-5 py-3.5">Mode</th>
                      <th className="px-5 py-3.5">Txn Reference</th>
                      <th className="px-5 py-3.5">Amount (₹)</th>
                      <th className="px-5 py-3.5">Collected By</th>
                      <th className="px-5 py-3.5 text-right">Receipt Voucher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">{p.residentName}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-500">{p.invoiceNumber}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{p.referenceNumber}</td>
                        <td className="px-5 py-3.5 font-extrabold text-emerald-700 text-sm">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{p.collectedBy}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedDocPayment(p);
                              const inv = invoices.find(i => i.id === p.invoiceId);
                              setSelectedDocInvoice(inv || null);
                              setDocModalType('RECEIPT');
                              setIsPrintDocOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-700" />
                            Print Official Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: COMPLAINTS & REPAIRS */}
          {/* ============================================================ */}
          {activeView === 'COMPLAINTS' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Hostel Complaints & Maintenance Grievances
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track plumbing, electrical, WiFi, housekeeping and mess tickets
                  </p>
                </div>

                <button
                  onClick={() => setIsComplaintOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                  Log Maintenance Ticket
                </button>
              </div>

              {/* Complaints Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {complaints.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {c.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          Room {c.roomNumber} ({c.residentName})
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{c.description}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                      {c.assignedStaffName && (
                        <p className="text-slate-500">
                          Assigned to: <strong className="text-slate-800">{c.assignedStaffName}</strong>
                        </p>
                      )}

                      {c.status !== 'RESOLVED' && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={async () => {
                              await fetch('/api/complaints', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  id: c.id,
                                  status: 'RESOLVED',
                                  workNotes: 'Repaired by hostel maintenance staff'
                                })
                              });
                              addToast('success', 'Ticket Resolved', `Complaint for Room ${c.roomNumber} marked closed.`);
                              fetchInitialData();
                            }}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: EXPENSES & ACCOUNTS */}
          {/* ============================================================ */}
          {activeView === 'EXPENSES' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Operational Expenses Register
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Log electricity, water, internet, grocery provisions and staff salaries
                  </p>
                </div>

                <button
                  onClick={() => setIsExpenseOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Log Expense
                </button>
              </div>

              {/* Expenses Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Vendor / Payee</th>
                      <th className="px-5 py-3.5">Description</th>
                      <th className="px-5 py-3.5">Payment Mode</th>
                      <th className="px-5 py-3.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 text-slate-600">{e.date}</td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-slate-900 uppercase text-[11px]">{e.category}</span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{e.vendor}</td>
                        <td className="px-5 py-3.5 text-slate-600">{e.description}</td>
                        <td className="px-5 py-3.5 text-slate-500">{e.paymentMethod}</td>
                        <td className="px-5 py-3.5 text-right font-extrabold text-rose-600 text-sm">
                          ₹{e.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: ASSETS & INVENTORY */}
          {/* ============================================================ */}
          {activeView === 'INVENTORY' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Hostel Fixed Assets & Inventory
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track cots, mattresses, ceiling fans, ACs, and geysers
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map((item) => (
                  <div key={item.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900">{item.name}</h3>
                      <span className="text-[10px] font-mono font-bold text-slate-400">{item.sku}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">Total</span>
                        <span className="font-extrabold text-slate-900">{item.totalQuantity}</span>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <span className="text-emerald-700 block text-[10px]">In Use</span>
                        <span className="font-extrabold text-emerald-800">{item.inUseQuantity}</span>
                      </div>
                      <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                        <span className="text-amber-700 block text-[10px]">Spare</span>
                        <span className="font-extrabold text-amber-800">{item.availableQuantity}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                      <span>Condition: <strong className="text-slate-800">{item.condition}</strong></span>
                      {item.damagedQuantity > 0 && (
                        <span className="text-rose-600 font-bold">{item.damagedQuantity} Damaged</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: VISITORS REGISTER */}
          {/* ============================================================ */}
          {activeView === 'VISITORS' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Reception Visitor Log & Security Gate
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Record guests, parent visits, and delivery agents
                  </p>
                </div>

                <button
                  onClick={() => setIsVisitorOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  Record Visitor Entry
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Visitor</th>
                      <th className="px-5 py-3.5">Resident Visited</th>
                      <th className="px-5 py-3.5">Purpose</th>
                      <th className="px-5 py-3.5">Entry Time</th>
                      <th className="px-5 py-3.5">Exit Time</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {visitors.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-slate-900 block">{v.visitorName}</span>
                          <span className="text-slate-500 text-[11px]">{v.mobile}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-800 block">{v.residentName}</span>
                          <span className="text-slate-400 text-[10px]">Room {v.roomNumber}</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">{v.purpose}</td>
                        <td className="px-5 py-3.5 text-slate-600">{new Date(v.entryTime).toLocaleTimeString()}</td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {v.exitTime ? new Date(v.exitTime).toLocaleTimeString() : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            v.status === 'CHECKED_IN' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {v.status === 'CHECKED_IN' && (
                            <button
                              onClick={async () => {
                                await fetch('/api/visitors', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: v.id, action: 'CHECK_OUT' })
                                });
                                addToast('success', 'Visitor Exit', `${v.visitorName} logged out.`);
                                fetchInitialData();
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white"
                            >
                              Check Out
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: STAFF MANAGEMENT */}
          {/* ============================================================ */}
          {activeView === 'STAFF' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Hostel Staff & Payroll Management
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Wardens, head cooks, maintenance technicians and security personnel
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffList.map((s) => (
                  <div key={s.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-slate-900">{s.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                        {s.role}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p>Phone: <strong className="text-slate-900">{s.phone}</strong></p>
                      <p>Monthly Salary: <strong className="text-emerald-700">₹{s.salary.toLocaleString('en-IN')}/mo</strong></p>
                      <p>Joined: {s.joiningDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: ANNOUNCEMENTS */}
          {/* ============================================================ */}
          {activeView === 'ANNOUNCEMENTS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Hostel Notice Board & Digital Broadcasts
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dispatched automatically to resident self-service portal
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {announcements.map((a) => (
                  <div key={a.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-slate-900">{a.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                        {a.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{a.message}</p>
                    <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
                      <span>Posted by {a.createdBy}</span>
                      <span>{a.startDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: REPORTS & ANALYTICS CENTER */}
          {/* ============================================================ */}
          {activeView === 'REPORTS' && (
            <ReportingView
              residents={residents}
              invoices={invoices}
              payments={payments}
              expenses={expenses}
              complaints={complaints}
              checkoutRecords={checkoutRecords}
              beds={beds}
              rooms={rooms}
              hostel={hostel}
              onShowToast={(msg, type) => addToast(type || 'info', msg)}
            />
          )}

          {/* ============================================================ */}
          {/* VIEW: AUDIT LOGS */}
          {/* ============================================================ */}
          {activeView === 'AUDIT' && (
            <AuditTrailView
              auditLogs={auditLogs}
              onRefresh={fetchInitialData}
              onShowToast={(msg, type) => addToast(type || 'info', msg)}
            />
          )}
        </main>
      </div>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* 1. Admission Wizard Modal */}
      <AdmissionModal
        isOpen={isAdmissionOpen}
        onClose={() => setIsAdmissionOpen(false)}
        onSuccess={handleAdmissionSuccess}
      />

      {/* 2. Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setSelectedInvoiceForPayment(null);
        }}
        invoice={selectedInvoiceForPayment}
        onSuccess={handlePaymentSuccess}
      />

      {/* 3. Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setSelectedResidentForCheckout(null);
        }}
        resident={selectedResidentForCheckout}
        onSuccess={handleCheckoutSuccess}
      />

      {/* 4. Bed Transfer Modal */}
      <BedTransferModal
        isOpen={isTransferOpen}
        onClose={() => {
          setIsTransferOpen(false);
          setSelectedResidentForTransfer(null);
        }}
        resident={selectedResidentForTransfer}
        onSuccess={handleTransferSuccess}
      />

      {/* 5. Printable Invoice / Money Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={isPrintDocOpen}
        onClose={() => setIsPrintDocOpen(false)}
        type={docModalType}
        invoice={selectedDocInvoice}
        payment={selectedDocPayment}
        hostel={hostel}
      />

      {/* 6. Complaint Modal */}
      <ComplaintModal
        isOpen={isComplaintOpen}
        onClose={() => setIsComplaintOpen(false)}
        residents={residents}
        activeResident={currentUser.role === 'RESIDENT' ? loggedInResident : null}
        onSuccess={handleComplaintSuccess}
      />

      {/* 7. Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        onSuccess={handleExpenseSuccess}
      />

      {/* 8. Visitor Modal */}
      <VisitorModal
        isOpen={isVisitorOpen}
        onClose={() => setIsVisitorOpen(false)}
        residents={residents}
        onSuccess={handleVisitorSuccess}
      />

      {/* 9. Canteen POS Modal */}
      <CanteenPOSModal
        isOpen={isCanteenOpen}
        onClose={() => setIsCanteenOpen(false)}
        residents={residents}
        onSuccess={handleCanteenSuccess}
      />

      {/* 10. Batch Billing Modal */}
      <AutomatedBillingModal
        isOpen={isBatchBillingOpen}
        onClose={() => setIsBatchBillingOpen(false)}
        onSuccess={handleBatchBillingSuccess}
      />

      {/* 11. Resident Profile Drawer / Details Modal */}
      {selectedResidentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">Resident Profile • {selectedResidentDetail.fullName}</h3>
              <button
                onClick={() => setSelectedResidentDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-4">
                <img
                  src={selectedResidentDetail.photoUrl}
                  alt={selectedResidentDetail.fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-base text-slate-900">{selectedResidentDetail.fullName}</h4>
                  <p className="font-mono text-slate-500">{selectedResidentDetail.id}</p>
                  <p className="text-amber-700 font-bold mt-0.5">
                    Room {selectedResidentDetail.roomNumber} - Bed {selectedResidentDetail.bedNumber}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Mobile</span>
                  <span className="font-semibold text-slate-800">{selectedResidentDetail.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">College / Employer</span>
                  <span className="font-semibold text-slate-800">{selectedResidentDetail.collegeOrCompany}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Guardian</span>
                  <span className="font-semibold text-slate-800">
                    {selectedResidentDetail.emergencyContactName} ({selectedResidentDetail.emergencyContactRelation})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Emergency Phone</span>
                  <span className="font-semibold text-slate-800">{selectedResidentDetail.emergencyContactPhone}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900 block mb-0.5">KYC Document Verified</span>
                <p className="text-emerald-800">
                  {selectedResidentDetail.idProofType}: {selectedResidentDetail.idProofNumber}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    setSelectedResidentForTransfer(selectedResidentDetail);
                    setSelectedResidentDetail(null);
                    setIsTransferOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Transfer Bed
                </button>
                <button
                  onClick={() => {
                    setSelectedResidentForCheckout(selectedResidentDetail);
                    setSelectedResidentDetail(null);
                    setIsCheckoutOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Initiate Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
