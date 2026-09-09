'use client';

import React, { useState } from 'react';
import { UserRole } from '@/lib/db/types';
import { NavView } from './Sidebar';
import {
  LayoutDashboard,
  BedDouble,
  Users,
  IndianRupee,
  Menu,
  X,
  Wrench,
  UserPlus,
  LogOut,
  Receipt,
  Package,
  UserCheck,
  Briefcase,
  Bell,
  Utensils,
  FileSpreadsheet,
  History,
  QrCode,
  Database,
  Home
} from 'lucide-react';

interface MobileNavProps {
  currentRole: UserRole;
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  openComplaintsCount: number;
  pendingInvoicesCount: number;
  onOpenChangeUpi?: () => void;
  upiId?: string;
  mongoConnected?: boolean;
  activeResidentTab?: 'OVERVIEW' | 'BILLS' | 'COMPLAINTS' | 'NOTICES' | 'MESS_MENU';
  onSelectResidentTab?: (tab: 'OVERVIEW' | 'BILLS' | 'COMPLAINTS' | 'NOTICES' | 'MESS_MENU') => void;
  residentTicketsCount?: number;
  noticesCount?: number;
}

export default function MobileNav({
  currentRole,
  activeView,
  onSelectView,
  openComplaintsCount,
  pendingInvoicesCount,
  onOpenChangeUpi,
  upiId,
  mongoConnected = false,
  activeResidentTab = 'OVERVIEW',
  onSelectResidentTab,
  residentTicketsCount = 1,
  noticesCount = 2
}: MobileNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // If role is RESIDENT, provide resident-only quick navigation:
  // 1. My Room & Overview, 2. Fee Invoices & Receipts, 3. My Tickets (1), 4. Mess Menu (Weekly), 5. Hostel Notices (2)
  if (currentRole === 'RESIDENT') {
    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* 1. My Room & Overview */}
          <button
            onClick={() => {
              onSelectView('RESIDENT_PORTAL');
              onSelectResidentTab?.('OVERVIEW');
            }}
            className={`flex flex-col items-center justify-center min-h-[44px] px-1.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
              activeView === 'RESIDENT_PORTAL' && activeResidentTab === 'OVERVIEW'
                ? 'text-amber-700 bg-amber-50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] leading-tight text-center font-medium">My Room</span>
          </button>

          {/* 2. Fee Invoices & Receipts */}
          <button
            onClick={() => {
              onSelectView('RESIDENT_PORTAL');
              onSelectResidentTab?.('BILLS');
            }}
            className={`relative flex flex-col items-center justify-center min-h-[44px] px-1.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
              activeView === 'RESIDENT_PORTAL' && activeResidentTab === 'BILLS'
                ? 'text-amber-700 bg-amber-50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] leading-tight text-center font-medium">Invoices</span>
          </button>

          {/* 3. My Tickets (1) */}
          <button
            onClick={() => {
              onSelectView('RESIDENT_PORTAL');
              onSelectResidentTab?.('COMPLAINTS');
            }}
            className={`relative flex flex-col items-center justify-center min-h-[44px] px-1.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
              activeView === 'RESIDENT_PORTAL' && activeResidentTab === 'COMPLAINTS'
                ? 'text-amber-700 bg-amber-50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] leading-tight text-center font-medium">
              Tickets ({residentTicketsCount})
            </span>
          </button>

          {/* 4. Mess Menu (Weekly) */}
          <button
            onClick={() => {
              onSelectView('RESIDENT_PORTAL');
              onSelectResidentTab?.('MESS_MENU');
            }}
            className={`flex flex-col items-center justify-center min-h-[44px] px-1.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
              activeView === 'RESIDENT_PORTAL' && activeResidentTab === 'MESS_MENU'
                ? 'text-amber-700 bg-amber-50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] leading-tight text-center font-medium">Mess Menu</span>
          </button>

          {/* 5. Hostel Notices (2) */}
          <button
            onClick={() => {
              onSelectView('RESIDENT_PORTAL');
              onSelectResidentTab?.('NOTICES');
            }}
            className={`flex flex-col items-center justify-center min-h-[44px] px-1.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
              activeView === 'RESIDENT_PORTAL' && activeResidentTab === 'NOTICES'
                ? 'text-amber-700 bg-amber-50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] leading-tight text-center font-medium">
              Notices ({noticesCount})
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Admin / Staff bottom dock items
  const primaryDockItems: { id: NavView; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'DASHBOARD',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      id: 'ROOMS',
      label: 'Rooms',
      icon: <BedDouble className="w-5 h-5" />
    },
    {
      id: 'RESIDENTS',
      label: 'Residents',
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'PAYMENTS',
      label: 'Billing',
      icon: <IndianRupee className="w-5 h-5" />,
      badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined
    }
  ];

  // Secondary menu drawer items
  const drawerSections = [
    {
      title: 'Operations',
      items: [
        { id: 'ADMISSIONS' as NavView, label: 'Admissions & KYC', icon: <UserPlus className="w-4 h-4" /> },
        { id: 'CHECKOUT' as NavView, label: 'Checkout & Clearance', icon: <LogOut className="w-4 h-4" /> },
        { id: 'COMPLAINTS' as NavView, label: 'Complaints', icon: <Wrench className="w-4 h-4" />, badge: openComplaintsCount },
        { id: 'CANTEEN' as NavView, label: 'Canteen POS & Mess', icon: <Utensils className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Finance & Administration',
      items: [
        { id: 'INVOICES' as NavView, label: 'Tax Invoices', icon: <Receipt className="w-4 h-4" /> },
        { id: 'EXPENSES' as NavView, label: 'Expenses & Petty Cash', icon: <IndianRupee className="w-4 h-4" /> },
        { id: 'REPORTS' as NavView, label: 'Reports & Excel Export', icon: <FileSpreadsheet className="w-4 h-4" /> },
        { id: 'AUDIT' as NavView, label: 'Audit Trail', icon: <History className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Premises & Security',
      items: [
        { id: 'VISITORS' as NavView, label: 'Visitor Logs', icon: <UserCheck className="w-4 h-4" /> },
        { id: 'INVENTORY' as NavView, label: 'Inventory & Assets', icon: <Package className="w-4 h-4" /> },
        { id: 'STAFF' as NavView, label: 'Staff Management', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'ANNOUNCEMENTS' as NavView, label: 'Notices & Circulars', icon: <Bell className="w-4 h-4" /> },
      ]
    }
  ];

  const handleSelect = (view: NavView) => {
    onSelectView(view);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Slide-up compact bottom drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end transition-opacity">
          <div
            className="fixed inset-0"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation sheet"
          />

          <div className="relative bg-white rounded-t-3xl border-t border-slate-200 p-5 shadow-2xl max-h-[80vh] overflow-y-auto z-10 space-y-5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center text-sm">
                  SS
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Sri Srinivasa Hostel</h3>
                  <p className="text-[10px] text-slate-500">Navigation & Operations Menu</p>
                </div>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions / DB status */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-600 font-medium">Database:</span>
                <span className="font-bold text-slate-900">
                  {mongoConnected ? 'MongoDB Live' : 'Local + Mongo Sync'}
                </span>
              </div>

              {onOpenChangeUpi && (
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenChangeUpi();
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-[11px] rounded-lg shadow-2xs flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>UPI ID</span>
                </button>
              )}
            </div>

            {/* Navigation Category Groups */}
            <div className="space-y-4">
              {drawerSections.map((sec) => (
                <div key={sec.title} className="space-y-1.5">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    {sec.title}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {sec.items.map((item) => {
                      const isActive = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item.id)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                            isActive
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100'
                          }`}
                        >
                          <span className={isActive ? 'text-white' : 'text-slate-500'}>
                            {item.icon}
                          </span>
                          <span className="truncate flex-1">{item.label}</span>
                          {item.badge && item.badge > 0 ? (
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                                isActive ? 'bg-white text-amber-700' : 'bg-rose-500 text-white'
                              }`}
                            >
                              {item.badge}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Dock (fixed at bottom of screen on mobile) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg safe-area-pb"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {primaryDockItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[58px] px-2 py-1 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'text-amber-700 bg-amber-50/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 text-[9px] font-bold bg-rose-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] leading-tight mt-0.5">{item.label}</span>
              </button>
            );
          })}

          {/* "More" Trigger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[58px] px-2 py-1 rounded-xl text-xs font-semibold transition-colors ${
              drawerOpen ? 'text-amber-700 bg-amber-50/80' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] leading-tight mt-0.5">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
