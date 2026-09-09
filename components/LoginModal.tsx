'use client';

import React, { useState } from 'react';
import { User } from '@/lib/db/types';
import { ShieldCheck, Mail, Lock, LogIn, X, RefreshCw } from 'lucide-react';
import TwoFactorChallengeModal, { TwoFactorChallengeData } from './TwoFactorChallengeModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableUsers?: User[];
  onSuccess: (user: User, token: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  availableUsers = [],
  onSuccess,
  onShowToast
}: LoginModalProps) {
  const [selectedEmail, setSelectedEmail] = useState(availableUsers[0]?.email || 'owner@srisrinivasa.com');
  const [password, setPassword] = useState('srisrinivasa123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState<TwoFactorChallengeData | null>(null);

  if (!isOpen) return null;

  if (challenge) {
    return (
      <TwoFactorChallengeModal
        key={challenge.challengeId}
        challenge={challenge}
        isOpen={true}
        onClose={() => {
          setChallenge(null);
          onClose();
        }}
        onSuccess={(user, token) => {
          setChallenge(null);
          onSuccess(user, token);
          onClose();
        }}
      />
    );
  }

  const handleSelectUser = (u: User) => {
    setSelectedEmail(u.email);
    setError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: selectedEmail,
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.requires2fa) {
        onShowToast?.('Two-Factor Authentication required. Enter the verification code sent to your device.', 'info');
        setChallenge(data);
      } else {
        onSuccess(data.user, data.token);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 text-white relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">ERP Secure Sign In</h2>
              <p className="text-xs text-slate-300">
                JWT Authentication with Two-Factor OTP Support
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
          {/* Quick User Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Select Demo Account to Test
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {availableUsers.map((u) => {
                const isSelected = u.email.toLowerCase() === selectedEmail.toLowerCase();
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate block">
                        {u.name}
                      </span>
                      {u.twoFactorEnabled && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="2FA Active" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-slate-100 text-slate-700">
                        {u.role.replace('_', ' ')}
                      </span>
                      {u.twoFactorEnabled && (
                        <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                          2FA
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 font-mono"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In (Will challenge 2FA if enabled)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
