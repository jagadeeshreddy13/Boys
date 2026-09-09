'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Phone, Mail, Clock, RefreshCw, AlertTriangle, CheckCircle2, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';

export interface TwoFactorChallengeData {
  tempToken: string;
  method: 'SMS' | 'EMAIL' | 'BOTH';
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
  };
  phoneMasked: string;
  emailMasked: string;
  simulatedSmsMessage?: string;
  simulatedEmailSubject?: string;
  simulatedEmailBody?: string;
  demoOtp?: string;
  purpose?: 'LOGIN' | 'ENABLE_2FA' | 'SWITCH_USER';
}

interface TwoFactorChallengeModalProps {
  challenge: TwoFactorChallengeData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (verifiedUser: any, token: string) => void;
}

export default function TwoFactorChallengeModal({
  challenge,
  isOpen,
  onClose,
  onSuccess
}: TwoFactorChallengeModalProps) {
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [activeMethod, setActiveMethod] = useState<'SMS' | 'EMAIL' | 'BOTH'>(challenge.method);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [demoOtp, setDemoOtp] = useState<string>(challenge.demoOtp || '');
  const [simulatedSms, setSimulatedSms] = useState<string>(challenge.simulatedSmsMessage || '');
  const [simulatedEmail, setSimulatedEmail] = useState<string>(challenge.simulatedEmailSubject || '');

  const canResend = countdown <= 0;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown(c => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    // Handle paste of whole OTP
    if (val.length > 1) {
      const cleaned = val.replace(/\D/g, '').slice(0, 6);
      if (cleaned.length > 0) {
        const nextDigits = ['', '', '', '', '', ''];
        for (let i = 0; i < cleaned.length; i++) {
          nextDigits[i] = cleaned[i];
        }
        setOtpDigits(nextDigits);
        if (cleaned.length === 6) {
          submitOtp(cleaned);
        } else {
          inputRefs.current[Math.min(cleaned.length, 5)]?.focus();
        }
        return;
      }
    }

    const digit = val.replace(/\D/g, '').slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);
    setErrorMessage('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 filled, auto submit
    if (digit && index === 5) {
      const fullCode = nextDigits.join('');
      if (fullCode.length === 6) {
        submitOtp(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitOtp = async (codeToSubmit?: string) => {
    const code = codeToSubmit || otpDigits.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter all 6 digits of the OTP verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_2fa',
          tempToken: challenge.tempToken,
          otp: code
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification failed. Please check the code.');
      }

      onSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (targetMethod?: 'SMS' | 'EMAIL' | 'BOTH') => {
    setLoading(true);
    setErrorMessage('');
    const methodToSend = targetMethod || activeMethod;

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend_2fa_otp',
          tempToken: challenge.tempToken,
          method: methodToSend
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend code');
      }

      if (data.demoOtp) setDemoOtp(data.demoOtp);
      if (data.simulatedSmsMessage) setSimulatedSms(data.simulatedSmsMessage);
      if (data.simulatedEmailSubject) setSimulatedEmail(data.simulatedEmailSubject);
      if (data.method) setActiveMethod(data.method);

      setCountdown(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = () => {
    if (demoOtp && demoOtp.length === 6) {
      const chars = demoOtp.split('');
      setOtpDigits(chars);
      submitOtp(demoOtp);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95">
        {/* Header with Security Badge */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 p-6 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {challenge.purpose === 'ENABLE_2FA' ? 'Device Activation' : 'Two-Factor Authentication'}
          </span>
          <h2 className="text-xl font-bold mt-2 tracking-tight">
            Verify Your Identity
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            Signing in as <span className="font-semibold text-white">{challenge.user.name}</span> ({challenge.user.role.replace('_', ' ')})
          </p>

          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            title="Back / Cancel"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Channel Info & Switcher */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2">
            <p className="text-[11px] font-semibold text-slate-600 text-center">
              We sent a 6-digit security code to:
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
              {(activeMethod === 'SMS' || activeMethod === 'BOTH') && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono font-medium shadow-2xs">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{challenge.phoneMasked}</span>
                </div>
              )}
              {(activeMethod === 'EMAIL' || activeMethod === 'BOTH') && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono font-medium shadow-2xs">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>{challenge.emailMasked}</span>
                </div>
              )}
            </div>

            {/* Delivery Switcher Button Group */}
            <div className="flex justify-center gap-2 pt-1 border-t border-slate-200/60">
              <span className="text-[10px] text-slate-400 self-center">Switch channel:</span>
              <button
                type="button"
                onClick={() => handleResend('SMS')}
                disabled={loading}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                  activeMethod === 'SMS' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                SMS
              </button>
              <button
                type="button"
                onClick={() => handleResend('EMAIL')}
                disabled={loading}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                  activeMethod === 'EMAIL' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => handleResend('BOTH')}
                disabled={loading}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                  activeMethod === 'BOTH' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Both
              </button>
            </div>
          </div>

          {/* 6 Digit Inputs */}
          <div className="space-y-2">
            <div className="flex justify-center gap-2 sm:gap-3">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={e => handleDigitChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  autoComplete="one-time-code"
                  disabled={loading}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-black rounded-xl border-2 transition-all shadow-xs ${
                    digit
                      ? 'border-amber-600 bg-amber-50/40 text-slate-900 ring-2 ring-amber-600/20'
                      : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20'
                  }`}
                />
              ))}
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Simulated Gateway Preview Banner for Easy Prototyping / Evaluation */}
          {demoOtp && (
            <div className="rounded-xl border border-dashed border-amber-300 bg-gradient-to-r from-amber-50/90 to-amber-100/50 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Simulated OTP Dispatch (Sandbox)</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutofill}
                  className="px-2 py-0.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold shadow-2xs transition-colors"
                >
                  Quick Autofill ({demoOtp})
                </button>
              </div>
              <p className="text-[11px] text-amber-800/90 font-mono truncate">
                {simulatedSms || `Your verification code is: ${demoOtp}`}
              </p>
            </div>
          )}

          {/* Submit Action Button */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => submitOtp()}
              disabled={loading || otpDigits.join('').length < 6}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Verify & Authorize Login</span>
                </>
              )}
            </button>

            {/* Resend & Timer */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <button
                type="button"
                onClick={() => handleResend()}
                disabled={!canResend || loading}
                className="font-semibold text-amber-700 hover:text-amber-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Resend OTP Code
              </button>

              {!canResend ? (
                <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Resend in {countdown}s
                </span>
              ) : (
                <span className="text-[11px] text-emerald-600 font-medium">Ready to resend</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Protected with 256-bit SSL & HMAC verification</span>
        </div>
      </div>
    </div>
  );
}
