'use client';

import React from 'react';
import { UserRole } from '@/lib/db/types';
import {
  LayoutDashboard,
  BedDouble,
  Users,
  UserPlus,
  FileText,
  IndianRupee,
  LogOut,
  Wrench,
  Receipt,
  Package,
  UserCheck,
  Briefcase,
  Bell,
  Utensils,
  History,
  ShieldCheck,
  Home,
  FileSpreadsheet
} from 'lucide-react';

export type NavView =
  | 'DASHBOARD'
  | 'ROOMS'
  | 'RESIDENTS'
  | 'ADMISSIONS'
  | 'INVOICES'
  | 'PAYMENTS'
  | 'CHECKOUT'
  | 'COMPLAINTS'
  | 'EXPENSES'
  | 'INVENTORY'
  | 'VISITORS'
  | 'STAFF'
  | 'ANNOUNCEMENTS'
  | 'CANTEEN'
  | 'REPORTS'
  | 'AUDIT'
  | 'RESIDENT_PORTAL';

interface SidebarProps {
  currentRole: UserRole;
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  openComplaintsCount: number;
  pendingInvoicesCount: number;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({
  currentRole,
  activeView,
  onSelectView,
  openComplaintsCount,
  pendingInvoicesCount,
  isOpen,
  onCloseMobile
}: SidebarProps) {
  interface NavItem {
    id: NavView;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
    allowedRoles: UserRole[];
  }

  const navItems: NavItem[] = [
    {
      id: 'RESIDENT_PORTAL',
      label: 'Resident Portal',
      icon: Home,
      allowedRoles: ['RESIDENT'],
    },
    {
      id: 'DASHBOARD',
      label: 'Dashboard & Analytics',
      icon: LayoutDashboard,
      allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT', 'WARDEN'],
    },
    {
      id: 'ROOMS',
      label: 'Rooms & Bed Matrix',
      icon: BedDouble,
      allowedRoles: ['OWNER', 'MANAGER', 'WARDEN', 'MAINTENANCE_STAFF'],
    },
    {
      id: 'RESIDENTS',
      label: 'Residents Directory',
      icon: Users,
      allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT', 'WARDEN'],
    },
    {
      id: 'ADMISSIONS',
      label: 'New Admission Wizard',
      icon: UserPlus,
      allowedRoles: ['OWNER', 'MANAGER', 'WARDEN'],
    },
    {
      id: 'INVOICES',
      label: 'Invoices & Batch Billing',
      icon: FileText,
      badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-900',
      allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'],
    },
    {
      id: 'PAYMENTS',
      label: 'Payments & Receipts',
      icon: IndianRupee,
      allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'],
    },
    {
      id: 'CHECKOUT',
      label: 'Checkout & Settlement',
      icon: LogOut,
      allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'],
    },
    {
      id: 'COMPLAINTS',
      label: 'Complaints & Repairs',
      icon: Wrench,
      badge: openComplaintsCount > 0 ? openComplaintsCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
      allowedRoles: ['OWNER', 'MANAGER', 'WARDEN', 'MAINTENANCE_STAFF'],
    },
    {
      id: 'EXPENSES',
      label: 'Operational Expenses',
      icon: Receipt,
      allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'],
    },
    {
      id: 'INVENTORY',
      label: 'Assets & Inventory',
      icon: Package,
      allowedRoles: ['OWNER', 'MANAGER', 'MAINTENANCE_STAFF'],
    },
    {
      id: 'VISITORS',
      label: 'Visitor Security Log',
      icon: UserCheck,
      allowedRoles: ['OWNER', 'MANAGER', 'WARDEN'],
    },
    {
      id: 'CANTEEN',
      label: 'Canteen / Mess POS',
      icon: Utensils,
      allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT', 'WARDEN', 'RESIDENT'],
    },
    {
      id: 'STAFF',
      label: 'Staff Management',
      icon: Briefcase,
      allowedRoles: ['OWNER', 'MANAGER'],
    },
    {
      id: 'ANNOUNCEMENTS',
      label: 'Notices & Broadcasts',
      icon: Bell,
      allowedRoles: ['OWNER', 'MANAGER', 'WARDEN'],
    },
    {
      id: 'REPORTS',
      label: 'Reports & Export Center',
      icon: FileSpreadsheet,
      allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'],
    },
    {
      id: 'AUDIT',
      label: 'Security & Audit Logs',
      icon: History,
      allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'],
    }
  ];

  const allowedItems = navItems.filter(item => item.allowedRoles.includes(currentRole));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-2xs"
        />
      )}

      <aside
        className={`fixed top-[61px] bottom-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="py-4 px-3 overflow-y-auto flex-1 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {currentRole === 'RESIDENT' ? 'Resident Portal' : 'Hostel ERP Modules'}
          </div>

          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Brand Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-300">RBAC Active: {currentRole}</span>
          </div>
          <p className="text-[10px] text-slate-500">Sri Srinivasa Boys Hostel v2.4 (Enterprise)</p>
        </div>
      </aside>
    </>
  );
}
