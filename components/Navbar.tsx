'use client';

import React, { useState } from 'react';
import { User, UserRole } from '@/lib/db/types';
import { Building2, UserCircle, Bell, UserPlus, RefreshCw, ChevronDown, Check, Shield, Menu } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  availableUsers: User[];
  onSwitchUser: (role: UserRole) => void;
  onOpenAdmissionModal: () => void;
  onResetDatabase: () => void;
  occupancyRate: number;
  openComplaintsCount: number;
  pendingFeesCount: number;
  onToggleSidebar: () => void;
}

export default function Navbar({
  currentUser,
  availableUsers,
  onSwitchUser,
  onOpenAdmissionModal,
  onResetDatabase,
  occupancyRate,
  openComplaintsCount,
  pendingFeesCount,
  onToggleSidebar
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'MANAGER': return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'ACCOUNTANT': return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'WARDEN': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'MAINTENANCE_STAFF': return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'RESIDENT': return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-amber-600/30">
              SS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  Sri Srinivasa Hostel ERP
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Madhapur, Hyderabad
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Complete Boys Hostel Management & Billing System
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Stats, New Admission, Persona Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Occupancy Metric */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-500 font-medium">Occupancy:</span>
            <span className="font-extrabold text-slate-900">{occupancyRate}%</span>
          </div>

          {/* Quick New Admission Button (for Admin roles) */}
          {currentUser.role !== 'RESIDENT' && (
            <button
              onClick={onOpenAdmissionModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">New Admission</span>
            </button>
          )}

          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-xs font-medium transition-all shadow-2xs"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <span className="font-bold text-slate-900 block leading-tight">{currentUser.name}</span>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${getRoleBadgeColor(currentUser.role)}`}>
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    One-Click Persona Switcher (RBAC)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Test different permissions & views instantly
                  </p>
                </div>

                <div className="py-1 max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {availableUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u.role);
                        setDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{u.name}</span>
                          {u.id === currentUser.id && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                          )}
                        </div>
                        <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${getRoleBadgeColor(u.role)}`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {u.role === 'RESIDENT' ? 'Room 102' : 'Staff'}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="px-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onResetDatabase();
                      setDropdownOpen(false);
                    }}
                    className="w-full py-1.5 px-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset to Initial Seed State
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
