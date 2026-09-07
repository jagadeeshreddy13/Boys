import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { CanteenOrder } from '@/lib/db/types';

export async function GET() {
  const db = getDb();
  return NextResponse.json({
    products: db.canteenProducts,
    orders: db.canteenOrders,
    totalSales: db.canteenOrders.reduce((acc, o) => acc + o.totalAmount, 0)
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, paymentMethod = 'UPI', residentId, residentName, roomNumber } = body;
    const db = getDb();

    if (!items || !items.length) {
      return NextResponse.json({ error: 'Order items required' }, { status: 400 });
    }

    const totalAmount = items.reduce((acc: number, it: any) => acc + (it.price * it.quantity), 0);
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}`;

    const newOrder: CanteenOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      residentId,
      residentName,
      roomNumber,
      items,
      totalAmount,
      paymentMethod,
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };

    db.canteenOrders.unshift(newOrder);
    saveDb(db);

    addAuditLog('usr-mgr-01', 'Canteen Staff', 'MANAGER', 'CANTEEN_ORDER_PLACED', 'CANTEEN', newOrder.id, `Order ${orderNumber} for ₹${totalAmount} via ${paymentMethod}`);

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Canteen order failed' }, { status: 500 });
  }
}
