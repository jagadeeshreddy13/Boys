import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/store';
import { getMongoStatus } from '@/lib/db/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const mongoStatus = await getMongoStatus();

    const totalRooms = db.rooms.length;
    const totalBeds = db.beds.length;
    const occupiedBeds = db.beds.filter(b => b.status === 'OCCUPIED').length;
    const availableBeds = db.beds.filter(b => b.status === 'AVAILABLE').length;
    const reservedBeds = db.beds.filter(b => b.status === 'RESERVED').length;
    const maintenanceBeds = db.beds.filter(b => b.status === 'MAINTENANCE').length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const totalResidents = db.residents.filter(r => r.status === 'ACTIVE').length;

    // Revenue & Collections
    const monthlyRevenue = db.payments.reduce((acc, p) => acc + (p.status === 'SUCCESS' ? p.amount : 0), 0);
    const pendingFees = db.invoices.reduce((acc, inv) => acc + inv.outstandingBalance, 0);
    const overdueFees = db.invoices
      .filter(inv => inv.status === 'OVERDUE' || (inv.status === 'PENDING' && new Date(inv.dueDate) < new Date()))
      .reduce((acc, inv) => acc + inv.outstandingBalance, 0);

    const monthlyExpenses = db.expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const netIncome = monthlyRevenue - monthlyExpenses;

    const openComplaints = db.complaints.filter(c => c.status === 'NEW' || c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').length;

    // Floor occupancy data for charts
    const floorStats = db.floors.map(floor => {
      const floorBeds = db.beds.filter(b => b.floorName === floor.name);
      const occupied = floorBeds.filter(b => b.status === 'OCCUPIED').length;
      const available = floorBeds.filter(b => b.status === 'AVAILABLE').length;
      const reserved = floorBeds.filter(b => b.status === 'RESERVED').length;
      const maintenance = floorBeds.filter(b => b.status === 'MAINTENANCE').length;

      return {
        name: floor.name,
        occupied,
        available,
        reserved,
        maintenance,
        total: floorBeds.length,
        occupancyPercent: floorBeds.length > 0 ? Math.round((occupied / floorBeds.length) * 100) : 0
      };
    });

    const financialTrends = [
      { month: 'Jun', revenue: 210000, expenses: 145000, profit: 65000 },
      { month: 'Jul', revenue: 235000, expenses: 152000, profit: 83000 },
      { month: 'Aug', revenue: 248000, expenses: 148000, profit: 100000 },
      { month: 'Sep', revenue: 260000, expenses: 156000, profit: 104000 },
      { month: 'Oct (Current)', revenue: monthlyRevenue, expenses: monthlyExpenses, profit: netIncome }
    ];

    const paymentMethodCounts: Record<string, number> = {};
    db.payments.forEach(p => {
      paymentMethodCounts[p.paymentMethod] = (paymentMethodCounts[p.paymentMethod] || 0) + p.amount;
    });

    const paymentMethods = Object.keys(paymentMethodCounts).map(method => ({
      name: method.replace('_', ' '),
      amount: paymentMethodCounts[method]
    }));

    const expenseCategorySums: Record<string, number> = {};
    db.expenses.forEach(e => {
      expenseCategorySums[e.category] = (expenseCategorySums[e.category] || 0) + e.amount;
    });

    const expenseBreakdown = Object.keys(expenseCategorySums).map(cat => ({
      name: cat,
      amount: expenseCategorySums[cat]
    }));

    const dashboard = {
      kpis: {
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds,
        reservedBeds,
        maintenanceBeds,
        occupancyRate,
        totalResidents,
        monthlyRevenue,
        pendingFees,
        overdueFees,
        monthlyExpenses,
        netIncome,
        openComplaints,
      },
      floorStats,
      financialTrends,
      paymentMethods,
      expenseBreakdown,
      recentPayments: db.payments.slice(0, 5),
      recentComplaints: db.complaints.slice(0, 5),
      recentAnnouncements: db.announcements.slice(0, 3),
      hostel: db.hostel
    };

    const dbStatus = {
      success: true,
      activeEngine: mongoStatus.connected ? 'MongoDB' : 'Local + Mongo Sync',
      mongodb: mongoStatus,
      snapshotCounts: {
        residents: db.residents.length,
        rooms: db.rooms.length,
        beds: db.beds.length,
        invoices: db.invoices.length,
        payments: db.payments.length,
        complaints: db.complaints.length,
        expenses: db.expenses.length,
        staff: db.staff.length,
        visitors: db.visitors.length,
        auditLogs: db.auditLogs.length,
      }
    };

    return NextResponse.json({
      success: true,
      auth: {
        user: db.users[0],
        availableUsers: db.users,
        twoFactorPolicy: db.settings.twoFactorPolicy || {
          enforceForAll: false,
          enforceForStaff: true,
          defaultMethod: 'BOTH',
          otpValidityMinutes: 5
        }
      },
      dashboard,
      hostel: db.hostel,
      rooms: db.rooms,
      beds: db.beds,
      residents: db.residents,
      invoices: db.invoices,
      payments: db.payments,
      complaints: db.complaints,
      expenses: db.expenses,
      inventory: db.inventory,
      visitors: db.visitors,
      staff: db.staff,
      announcements: db.announcements,
      auditLogs: db.auditLogs,
      checkoutRecords: db.checkoutRecords,
      dbStatus
    });
  } catch (err: any) {
    console.error('Bootstrap API error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to bootstrap data' },
      { status: 500 }
    );
  }
}
