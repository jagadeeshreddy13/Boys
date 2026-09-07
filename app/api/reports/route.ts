import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/store';

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const buildingId = searchParams.get('buildingId'); // 'ALL' or specific
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const reportType = searchParams.get('reportType') || 'SUMMARY';

  // Date filtering helper
  const isInDateRange = (dateStr?: string) => {
    if (!startDate && !endDate) return true;
    if (!dateStr) return true;
    const t = new Date(dateStr.split('T')[0]).getTime();
    if (startDate && t < new Date(startDate).getTime()) return false;
    if (endDate && t > new Date(endDate + 'T23:59:59').getTime()) return false;
    return true;
  };

  // Building filtering helper
  const isBuildingMatch = (bldCodeOrId?: string) => {
    if (!buildingId || buildingId === 'ALL') return true;
    if (buildingId === 'bld-01' && (bldCodeOrId === 'A' || bldCodeOrId === 'bld-01')) return true;
    if (buildingId === 'bld-02' && (bldCodeOrId === 'B' || bldCodeOrId === 'bld-02')) return true;
    return false;
  };

  // Filtered dataset
  const filteredInvoices = db.invoices.filter(inv => {
    if (!isInDateRange(inv.issueDate)) return false;
    if (buildingId && buildingId !== 'ALL') {
      const isBldB = inv.roomNumber?.endsWith('B') || inv.roomNumber?.startsWith('B');
      if (buildingId === 'bld-02' && !isBldB) return false;
      if (buildingId === 'bld-01' && isBldB) return false;
    }
    return true;
  });

  const filteredPayments = db.payments.filter(pay => {
    return isInDateRange(pay.paymentDate);
  });

  const filteredExpenses = db.expenses.filter(exp => {
    return isInDateRange(exp.date);
  });

  const totalBilled = filteredInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalCollected = filteredPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalOutstanding = filteredInvoices.reduce((acc, i) => acc + i.outstandingBalance, 0);
  const totalExpenseAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netMargin = totalCollected - totalExpenseAmount;

  const totalBeds = db.beds.length;
  const occupiedBeds = db.beds.filter(b => b.status === 'OCCUPIED').length;
  const availableBeds = db.beds.filter(b => b.status === 'AVAILABLE').length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return NextResponse.json({
    reportType,
    scope: {
      buildingId: buildingId || 'ALL',
      startDate: startDate || null,
      endDate: endDate || null
    },
    summary: {
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalExpenses: totalExpenseAmount,
      netMargin,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate
    },
    counts: {
      invoicesCount: filteredInvoices.length,
      paymentsCount: filteredPayments.length,
      expensesCount: filteredExpenses.length,
      residentsCount: db.residents.length
    }
  });
}
