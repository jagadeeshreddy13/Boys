import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { InventoryItem } from '@/lib/db/types';

export async function GET() {
  const db = getDb();
  return NextResponse.json({ inventory: db.inventory, total: db.inventory.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();
    const { action, id, quantityChange, type, ...itemData } = body;

    if (action === 'STOCK_UPDATE' && id) {
      const item = db.inventory.find(i => i.id === id);
      if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

      const qty = Number(quantityChange) || 0;
      if (type === 'STOCK_IN') {
        item.totalQuantity += qty;
        item.availableQuantity += qty;
      } else if (type === 'STOCK_OUT') {
        item.availableQuantity = Math.max(0, item.availableQuantity - qty);
        item.inUseQuantity += qty;
      } else if (type === 'DAMAGED') {
        item.availableQuantity = Math.max(0, item.availableQuantity - qty);
        item.damagedQuantity += qty;
        item.condition = 'DAMAGED';
      } else if (type === 'REPAIRED') {
        item.damagedQuantity = Math.max(0, item.damagedQuantity - qty);
        item.availableQuantity += qty;
        item.condition = 'GOOD';
      }

      saveDb(db);
      addAuditLog('usr-mgr-01', 'Admin', 'MANAGER', 'INVENTORY_STOCK_UPDATE', 'INVENTORY', id, `${type} of ${qty} units on ${item.name}`);
      return NextResponse.json({ success: true, item });
    }

    const newItem: InventoryItem = {
      id: `inv-item-${Date.now()}`,
      sku: itemData.sku || `SKU-${Date.now().toString().slice(-6)}`,
      totalQuantity: Number(itemData.totalQuantity) || 1,
      availableQuantity: Number(itemData.availableQuantity) || Number(itemData.totalQuantity) || 1,
      inUseQuantity: Number(itemData.inUseQuantity) || 0,
      damagedQuantity: 0,
      condition: 'GOOD',
      ...itemData
    };

    db.inventory.unshift(newItem);
    saveDb(db);

    return NextResponse.json({ success: true, item: newItem });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Inventory action failed' }, { status: 500 });
  }
}
