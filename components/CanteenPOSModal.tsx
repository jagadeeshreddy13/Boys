'use client';

import React, { useState, useEffect } from 'react';
import { CanteenProduct, Resident } from '@/lib/db/types';
import { Coffee, ShoppingCart, Plus, Minus, IndianRupee, Loader2, X, CheckCircle, Utensils } from 'lucide-react';

interface CanteenPOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  residents: Resident[];
  onSuccess: (order: any) => void;
}

export default function CanteenPOSModal({
  isOpen,
  onClose,
  residents,
  onSuccess
}: CanteenPOSModalProps) {
  const [products, setProducts] = useState<CanteenProduct[]>([]);
  const [cart, setCart] = useState<{ product: CanteenProduct; quantity: number }[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH'>('UPI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    fetch('/api/canteen')
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setProducts(data.products || []);
          setCart([]);
          setError(null);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const addToCart = (product: CanteenProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: CanteenProduct; quantity: number }[];
    });
  };

  const totalAmount = cart.reduce((sum, it) => sum + it.product.price * it.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setError('Your canteen cart is empty');
      return;
    }

    setLoading(true);
    setError(null);

    const resident = residents.find(r => r.id === selectedResidentId);

    try {
      const items = cart.map(c => ({
        productId: c.product.id,
        name: c.product.name,
        price: c.product.price,
        quantity: c.quantity
      }));

      const res = await fetch('/api/canteen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          paymentMethod,
          residentId: resident?.id,
          residentName: resident?.fullName || 'Walk-in Resident / Guest',
          roomNumber: resident?.roomNumber || 'Lobby'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      onSuccess(data.order);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Utensils className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-base">Canteen & Mess POS Terminal</h3>
              <p className="text-xs text-slate-400">Sri Srinivasa Food Court</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Menu Items (2 Cols) */}
          <div className="p-4 md:col-span-2 space-y-3">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              Snacks, Meals & Beverages Menu
            </h4>
            <div className="grid grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {products.map(prod => (
                <div
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-900 text-xs">{prod.name}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {prod.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <span className="font-extrabold text-amber-700 text-xs">₹{prod.price}</span>
                    <button
                      type="button"
                      className="p-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart & Billing (1 Col) */}
          <div className="p-4 bg-slate-50 flex flex-col justify-between text-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-slate-500" /> Current Order
                </span>
                <span className="text-slate-400 text-[11px]">{cart.length} items</span>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Click items on the left to add to order
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                      <div>
                        <p className="font-semibold text-slate-900 text-[11px]">{item.product.name}</p>
                        <p className="text-[10px] text-slate-500">₹{item.product.price} each</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center font-bold text-slate-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Settings */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Resident (Optional)</label>
                <select
                  value={selectedResidentId}
                  onChange={(e) => setSelectedResidentId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden"
                >
                  <option value="">Walk-in / Cash Customer</option>
                  {residents.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.fullName} (Room {r.roomNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`py-1.5 rounded-lg font-bold text-[11px] border transition-all ${
                      paymentMethod === 'UPI'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-1.5 rounded-lg font-bold text-[11px] border transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Cash
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 mt-3 space-y-2">
              <div className="flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-emerald-700">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>

              <button
                type="button"
                disabled={loading || cart.length === 0}
                onClick={handlePlaceOrder}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Complete Sale (₹{totalAmount})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
