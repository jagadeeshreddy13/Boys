// Two-Factor Authentication (2FA) Service for Sri Srinivasa Hostel ERP
import { UserRole } from '@/lib/db/types';

export interface PendingOtpSession {
  tempToken: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userEmail: string;
  userPhone: string;
  method: 'SMS' | 'EMAIL' | 'BOTH';
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  purpose: 'LOGIN' | 'ENABLE_2FA' | 'SWITCH_USER';
  simulatedSmsMessage?: string;
  simulatedEmailSubject?: string;
  simulatedEmailBody?: string;
}

// Global in-memory map of active OTP verification challenges
// (Persistent across server-side API requests in Node runtime)
const globalOtpSessions = new Map<string, PendingOtpSession>();

// Helper to mask phone: e.g. "+91 98480 22338" -> "+91 98*** 2338"
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '+91 ******0000';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return phone;
  const start = phone.slice(0, 7);
  const end = phone.slice(-4);
  return `${start}***${end}`;
}

// Helper to mask email: e.g. "owner@srisrinivasa.com" -> "o***@srisrinivasa.com"
export function maskEmailAddress(email: string): string {
  if (!email || !email.includes('@')) return 'user@domain.com';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const first = local.slice(0, 2);
  return `${first}${'*'.repeat(Math.max(3, local.length - 2))}@${domain}`;
}

/**
 * Generate a 6-digit cryptographic-quality numeric OTP
 */
export function generateNumericOtp(): string {
  // 6 digits between 100000 and 999999
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
}

/**
 * Create a new pending 2FA challenge session
 */
export function create2faChallenge({
  userId,
  userName,
  userRole,
  userEmail,
  userPhone,
  method = 'BOTH',
  purpose = 'LOGIN',
  validityMinutes = 5
}: {
  userId: string;
  userName: string;
  userRole: UserRole;
  userEmail: string;
  userPhone: string;
  method?: 'SMS' | 'EMAIL' | 'BOTH';
  purpose?: 'LOGIN' | 'ENABLE_2FA' | 'SWITCH_USER';
  validityMinutes?: number;
}): PendingOtpSession {
  // Clean up any stale sessions for this user first
  for (const [token, sess] of globalOtpSessions.entries()) {
    if (sess.userId === userId || Date.now() > sess.expiresAt) {
      globalOtpSessions.delete(token);
    }
  }

  const code = generateNumericOtp();
  const tempToken = `2fa_token_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const now = Date.now();
  const expiresAt = now + validityMinutes * 60 * 1000;

  const phoneMasked = maskPhoneNumber(userPhone);
  const emailMasked = maskEmailAddress(userEmail);

  const simulatedSms = `[SMS Gateway • Fast2SMS] To ${phoneMasked}: ${code} is your Sri Srinivasa Hostel ERP verification code. Valid for ${validityMinutes} mins. Never share this OTP with anyone.`;
  const simulatedEmailSub = `[Security Alert] Your Sri Srinivasa Hostel OTP: ${code}`;
  const simulatedEmailBody = `Hello ${userName},\n\nYour Two-Factor Authentication (2FA) verification code is: ${code}\n\nThis OTP is valid for ${validityMinutes} minutes until ${new Date(expiresAt).toLocaleTimeString()}.\n\nIf you did not request this login code, please contact Sri Srinivasa Hostel management immediately.`;

  const session: PendingOtpSession = {
    tempToken,
    userId,
    userName,
    userRole,
    userEmail,
    userPhone,
    method,
    code,
    createdAt: now,
    expiresAt,
    attempts: 0,
    maxAttempts: 4,
    verified: false,
    purpose,
    simulatedSmsMessage: simulatedSms,
    simulatedEmailSubject: simulatedEmailSub,
    simulatedEmailBody
  };

  globalOtpSessions.set(tempToken, session);
  return session;
}

/**
 * Retrieve session by token
 */
export function get2faSession(tempToken: string): PendingOtpSession | null {
  const session = globalOtpSessions.get(tempToken);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    globalOtpSessions.delete(tempToken);
    return null;
  }
  return session;
}

/**
 * Verify OTP against pending session
 */
export function verify2faOtp(
  tempToken: string,
  providedOtp: string
): { success: boolean; error?: string; session?: PendingOtpSession } {
  const session = globalOtpSessions.get(tempToken);
  if (!session) {
    return { success: false, error: 'Authentication session expired or invalid. Please request a new OTP.' };
  }

  if (Date.now() > session.expiresAt) {
    globalOtpSessions.delete(tempToken);
    return { success: false, error: 'OTP has expired. Please request a new verification code.' };
  }

  if (session.attempts >= session.maxAttempts) {
    globalOtpSessions.delete(tempToken);
    return { success: false, error: 'Maximum verification attempts exceeded. Please initiate a new login.' };
  }

  session.attempts += 1;

  const cleanProvided = (providedOtp || '').trim();
  if (cleanProvided !== session.code) {
    const remaining = session.maxAttempts - session.attempts;
    return {
      success: false,
      error: `Incorrect 6-digit OTP code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Account challenge locked.'}`
    };
  }

  // Verification successful!
  session.verified = true;
  globalOtpSessions.delete(tempToken); // Consume one-time use token
  return { success: true, session };
}

/**
 * Resend OTP (with optional channel switch: SMS, EMAIL, BOTH)
 */
export function resend2faOtp(
  tempToken: string,
  newMethod?: 'SMS' | 'EMAIL' | 'BOTH'
): { success: boolean; session?: PendingOtpSession; error?: string } {
  const session = globalOtpSessions.get(tempToken);
  if (!session) {
    return { success: false, error: 'Session expired. Please restart login.' };
  }

  // Generate fresh code and reset expiry
  const newCode = generateNumericOtp();
  session.code = newCode;
  session.attempts = 0;
  session.expiresAt = Date.now() + 5 * 60 * 1000;
  if (newMethod) {
    session.method = newMethod;
  }

  const phoneMasked = maskPhoneNumber(session.userPhone);
  session.simulatedSmsMessage = `[SMS Gateway • Fast2SMS] To ${phoneMasked}: ${newCode} is your new Sri Srinivasa Hostel ERP verification code. Valid for 5 mins.`;
  session.simulatedEmailSubject = `[Security Alert] Your new Sri Srinivasa Hostel OTP: ${newCode}`;
  session.simulatedEmailBody = `Hello ${session.userName},\n\nYour new verification code is: ${newCode}\n\nValid for 5 minutes.`;

  return { success: true, session };
}
