'use client';

import React, { useState } from 'react';
import { User, UserRole } from '@/lib/db/types';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Phone,
  Mail,
  Smartphone,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Settings,
  Users,
  RefreshCw,
  X,
  Lock,
  Sparkles,
  Info
} from 'lucide-react';
import { TwoFactorChallengeData } from './TwoFactorChallengeModal';

interface TwoFactorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  availableUsers: User[];
  twoFactorPolicy?: {
    enforceForAll: boolean;
    enforceForStaff: boolean;
    defaultMethod: 'SMS' | 'EMAIL' | 'BOTH';
    otpValidityMinutes: number;
  };
  onRequestEnableChallenge: (challenge: TwoFactorChallengeData) => void;
  onRefreshData: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export default function TwoFactorSettingsModal({
  isOpen,
  onClose,
  currentUser,
  availableUsers,
  twoFactorPolicy,
  onRequestEnableChallenge,
  onRefreshData,
  onShowToast
}: TwoFactorSettingsModalProps) {
  const isAdmin = currentUser.role === 'OWNER' || currentUser.role === 'MANAGER';
  const [activeTab, setActiveTab] = useState<'MY_2FA' | 'ADMIN_POLICY'>('MY_2FA');
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'SMS' | 'EMAIL' | 'BOTH'>(
    currentUser.twoFactorMethod || 'BOTH'
  );

  // Policy state for admins
  const [enforceStaff, setEnforceStaff] = useState<boolean>(
    twoFactorPolicy?.enforceForStaff ?? true
  );
  const [enforceAll, setEnforceAll] = useState<boolean>(
    twoFactorPolicy?.enforceForAll ?? false
  );
  const [defaultMethod, setDefaultMethod] = useState<'SMS' | 'EMAIL' | 'BOTH'>(
    twoFactorPolicy?.defaultMethod ?? 'BOTH'
  );

  if (!isOpen) return null;

  // Handle user toggling 2FA on/off
  const handleToggleMy2fa = async (enable: boolean) => {
    setLoading(true);
    try {
      if (enable) {
        // Request challenge to verify before activating
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'request_enable_2fa',
            userId: currentUser.id,
            method: selectedMethod
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to request activation challenge');
        }

        onClose(); // Close settings modal, open challenge modal
        onRequestEnableChallenge(data);
        return;
      } else {
        // Directly disable 2FA
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'toggle_user_2fa',
            userId: currentUser.id,
            enabled: false
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to disable 2FA');
        }

        onShowToast('info', 'Two-Factor Disabled', '2FA has been deactivated for your account.');
        onRefreshData();
      }
    } catch (err: any) {
      onShowToast('error', 'Update Failed', err.message || 'Error configuring 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Handle updating user's preferred delivery channel
  const handleUpdatePreferredMethod = async (newMethod: 'SMS' | 'EMAIL' | 'BOTH') => {
    setSelectedMethod(newMethod);
    if (!currentUser.twoFactorEnabled) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_user_2fa',
          userId: currentUser.id,
          enabled: true,
          method: newMethod
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update delivery method');
      }

      onShowToast('success', 'Method Updated', `2FA verification codes will now be sent via ${newMethod}.`);
      onRefreshData();
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Admin toggling 2FA for another user
  const handleAdminToggleUser = async (targetUser: User, enabled: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_user_2fa',
          targetUserId: targetUser.id,
          userId: currentUser.id,
          enabled,
          method: targetUser.twoFactorMethod || 'SMS'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user 2FA');
      }

      onShowToast(
        'success',
        'User 2FA Updated',
        `2FA ${enabled ? 'enabled' : 'disabled'} for ${targetUser.name}`
      );
      onRefreshData();
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Admin saving hostel-wide security policy
  const handleSavePolicy = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_2fa_policy',
          userId: currentUser.id,
          policy: {
            enforceForAll: enforceAll,
            enforceForStaff: enforceStaff,
            defaultMethod,
            otpValidityMinutes: 5
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update security policy');
      }

      onShowToast('success', 'Security Policy Saved', 'Hostel 2FA rules have been updated.');
      onRefreshData();
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Two-Factor Authentication (2FA)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Security
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Protect your account & operations with OTP verification via SMS & Email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (User Self-Service vs Admin Policies) */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('MY_2FA')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'MY_2FA'
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-amber-600" />
            <span>My 2FA Settings</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('ADMIN_POLICY')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'ADMIN_POLICY'
                  ? 'border-amber-600 text-amber-900 bg-white rounded-t-xl shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-amber-600" />
              <span>Hostel RBAC & Admin Policy</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: MY 2FA SETTINGS */}
          {activeTab === 'MY_2FA' && (
            <div className="space-y-6">
              {/* Current Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-4 ${
                  currentUser.twoFactorEnabled
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    currentUser.twoFactorEnabled
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {currentUser.twoFactorEnabled ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <ShieldAlert className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm">
                      {currentUser.twoFactorEnabled
                        ? 'Two-Factor Authentication is Active'
                        : 'Two-Factor Authentication is Disabled'}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        currentUser.twoFactorEnabled
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {currentUser.twoFactorEnabled ? 'PROTECTED' : 'NOT CONFIGURED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {currentUser.twoFactorEnabled
                      ? `Your logins require a 6-digit OTP sent via ${currentUser.twoFactorMethod || 'SMS & Email'}.`
                      : 'Add an extra layer of defense by requiring an OTP verification code sent to your phone or email on every login.'}
                  </p>

                  <div className="mt-3">
                    {currentUser.twoFactorEnabled ? (
                      <button
                        onClick={() => handleToggleMy2fa(false)}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors shadow-2xs"
                      >
                        Disable 2FA on My Account
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleMy2fa(true)}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm shadow-amber-600/20"
                      >
                        {loading ? 'Sending Test OTP...' : 'Enable 2FA Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Channel Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-900 block">
                  Preferred OTP Delivery Channel
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Channel: SMS */}
                  <div
                    onClick={() => handleUpdatePreferredMethod('SMS')}
                    className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all ${
                      selectedMethod === 'SMS'
                        ? 'border-amber-600 bg-amber-50/40 ring-2 ring-amber-600/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">SMS OTP</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {currentUser.phone || '+91 98480 22338'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Fast SMS dispatch to your registered mobile number
                    </p>
                  </div>

                  {/* Channel: Email */}
                  <div
                    onClick={() => handleUpdatePreferredMethod('EMAIL')}
                    className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all ${
                      selectedMethod === 'EMAIL'
                        ? 'border-amber-600 bg-amber-50/40 ring-2 ring-amber-600/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-900">Email OTP</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {currentUser.email}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Instant security code delivered directly to your inbox
                    </p>
                  </div>

                  {/* Channel: Both */}
                  <div
                    onClick={() => handleUpdatePreferredMethod('BOTH')}
                    className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all ${
                      selectedMethod === 'BOTH'
                        ? 'border-amber-600 bg-amber-50/40 ring-2 ring-amber-600/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-900">SMS & Email (Dual)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Highest reliability
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Code dispatched to both phone & email with quick switch option
                    </p>
                  </div>
                </div>
              </div>

              {/* Security info card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">
                    How Two-Factor Works in Sri Srinivasa Hostel ERP
                  </span>
                  Whenever you log in with your email or password, a fresh 6-digit cryptographic OTP is generated and dispatched. The code remains active for 5 minutes and limits incorrect attempts to safeguard against unauthorized access.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADMINISTRATOR 2FA POLICY & USER DIRECTORY */}
          {activeTab === 'ADMIN_POLICY' && isAdmin && (
            <div className="space-y-6">
              {/* Global Hostel Policy Switches */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Hostel 2FA Enforcement Rules</h3>
                    <p className="text-[11px] text-slate-600">
                      Enforce two-factor verification on all logins system-wide
                    </p>
                  </div>
                  <button
                    onClick={handleSavePolicy}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Save Policy
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-200/60 shadow-2xs">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Enforce for Staff</span>
                      <span className="text-[10px] text-slate-500">Owner, Manager, Warden, Accountants</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnforceStaff(!enforceStaff)}
                      className={`text-2xl transition-colors ${enforceStaff ? 'text-amber-600' : 'text-slate-300'}`}
                    >
                      {enforceStaff ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-200/60 shadow-2xs">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Enforce for Residents</span>
                      <span className="text-[10px] text-slate-500">Require OTP on Resident Portal logins</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnforceAll(!enforceAll)}
                      className={`text-2xl transition-colors ${enforceAll ? 'text-amber-600' : 'text-slate-300'}`}
                    >
                      {enforceAll ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* All System Users 2FA Directory */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">User Security Directory ({availableUsers.length})</h3>
                  <span className="text-[11px] text-slate-500">One-click Admin override</span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  {availableUsers.map(user => {
                    const has2fa = !!user.twoFactorEnabled;
                    return (
                      <div
                        key={user.id}
                        className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 truncate">{user.name}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                {user.role.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate font-mono">
                              {user.email} • {user.phone}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right hidden sm:block">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                has2fa
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {has2fa ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Active ({user.twoFactorMethod || 'SMS'})
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" />
                                  Disabled
                                </>
                              )}
                            </span>
                          </div>

                          <button
                            onClick={() => handleAdminToggleUser(user, !has2fa)}
                            disabled={loading}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                              has2fa
                                ? 'bg-white hover:bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                            }`}
                          >
                            {has2fa ? 'Disable' : 'Enable 2FA'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
