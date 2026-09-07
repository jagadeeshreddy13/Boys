import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { Expense, ExpenseCategory, PaymentMethod } from '@/lib/db/types';
import { getClientIp } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const category = searchParams.get('category');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let expenses = db.expenses;

  if (category && category !== 'ALL') {
    expenses = expenses.filter(e => e.category === category);
  }

  if (startDate) {
    expenses = expenses.filter(e => e.date >= startDate);
  }

  if (endDate) {
    expenses = expenses.filter(e => e.date <= endDate);
  }

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Category totals
  const categorySummary: Record<string, number> = {};
  expenses.forEach(e => {
    categorySummary[e.category] = (categorySummary[e.category] || 0) + e.amount;
  });

  return NextResponse.json({
    expenses,
    totalExpense,
    categorySummary,
    totalCount: expenses.length
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      category,
      amount,
      date,
      description,
      vendor,
      paymentMethod = 'UPI',
      receiptAttachment,
      createdBy = 'Venkat Rao (Accountant)',
      userId = 'usr-acct-01'
    } = body;
    const db = getDb();
    const clientIp = getClientIp(req);

    if (!category || !amount || !description || !vendor) {
      return NextResponse.json({ error: 'Missing required expense fields' }, { status: 400 });
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      category: category as ExpenseCategory,
      amount: Number(amount),
      date: date || new Date().toISOString().split('T')[0],
      description,
      vendor,
      paymentMethod: paymentMethod as PaymentMethod,
      receiptAttachment,
      createdBy
    };

    db.expenses.unshift(newExpense);
    saveDb(db);

    addAuditLog(
      userId,
      createdBy,
      'ACCOUNTANT',
      'EXPENSE_CREATE',
      'EXPENSE',
      newExpense.id,
      `Logged ₹${amount} expense in ${category} paid to ${vendor}`,
      {
        ipAddress: clientIp,
        beforeData: null,
        afterData: {
          category: newExpense.category,
          amount: newExpense.amount,
          vendor: newExpense.vendor,
          paymentMethod: newExpense.paymentMethod,
          date: newExpense.date
        },
        status: 'SUCCESS'
      }
    );

    return NextResponse.json({ success: true, expense: newExpense });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to log expense' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId, userName, ...updates } = body;
    const db = getDb();
    const clientIp = getClientIp(req);

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const expense = db.expenses.find(e => e.id === id);
    if (!expense) {
      return NextResponse.json({ error: 'Expense record not found' }, { status: 404 });
    }

    const beforeData: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      beforeData[key] = (expense as any)[key];
    });

    Object.assign(expense, updates);
    saveDb(db);

    addAuditLog(
      userId || 'usr-acct-01',
      userName || 'Venkat Rao (Accountant)',
      'ACCOUNTANT',
      'EXPENSE_UPDATE',
      'EXPENSE',
      id,
      `Modified expense record for ${expense.vendor} (₹${expense.amount})`,
      {
        ipAddress: clientIp,
        beforeData,
        afterData: updates,
        status: 'SUCCESS'
      }
    );

    return NextResponse.json({ success: true, expense });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update expense' }, { status: 500 });
  }
}
