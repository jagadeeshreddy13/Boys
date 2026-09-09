import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { UserRole } from '@/lib/db/types';
import { getClientIp } from '@/lib/utils';
import {
  create2faChallenge,
  verify2faOtp,
  resend2faOtp,
  maskPhoneNumber,
  maskEmailAddress
} from '@/lib/auth/2fa';

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const role = searchParams.get('role') as UserRole | null;
  const userId = searchParams.get('userId');

  if (userId) {
    const user = db.users.find(u => u.id === userId);
    if (user) return NextResponse.json({ user, twoFactorPolicy: db.settings.twoFactorPolicy });
  }

  if (role) {
    const user = db.users.find(u => u.role === role);
    if (user) return NextResponse.json({ user, twoFactorPolicy: db.settings.twoFactorPolicy });
  }

  // Default to owner if none specified
  return NextResponse.json({
    user: db.users[0],
    availableUsers: db.users,
    twoFactorPolicy: db.settings.twoFactorPolicy || {
      enforceForAll: false,
      enforceForStaff: true,
      defaultMethod: 'BOTH',
      otpValidityMinutes: 5
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, role, currentRole, email, password, userId, targetUserId, newRole, tempToken, otp, method, enabled, policy } = body;
    const db = getDb();
    const clientIp = getClientIp(req);

    // ==========================================
    // 2FA STEP 2: VERIFY OTP CODE
    // ==========================================
    if (action === 'verify_2fa') {
      if (!tempToken || !otp) {
        return NextResponse.json({ error: 'Temporary session token and 6-digit OTP code are required' }, { status: 400 });
      }

      const result = verify2faOtp(tempToken, otp);
      if (!result.success || !result.session) {
        return NextResponse.json({ error: result.error || 'Verification failed' }, { status: 401 });
      }

      const verifiedUser = db.users.find(u => u.id === result.session!.userId);
      if (!verifiedUser) {
        return NextResponse.json({ error: 'User record no longer exists' }, { status: 404 });
      }

      // If this challenge was for activating 2FA on the account
      if (result.session.purpose === 'ENABLE_2FA') {
        verifiedUser.twoFactorEnabled = true;
        verifiedUser.twoFactorMethod = result.session.method || 'BOTH';
        verifiedUser.twoFactorVerifiedAt = new Date().toISOString();
        saveDb(db);

        addAuditLog(
          verifiedUser.id,
          verifiedUser.name,
          verifiedUser.role,
          'SECURITY_2FA_ENABLED',
          'USER_SECURITY',
          verifiedUser.id,
          `User ${verifiedUser.name} successfully activated 2FA via ${result.session.method}`,
          {
            ipAddress: clientIp,
            beforeData: { twoFactorEnabled: false },
            afterData: { twoFactorEnabled: true, twoFactorMethod: verifiedUser.twoFactorMethod },
            status: 'SUCCESS'
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Two-Factor Authentication successfully enabled on your account!',
          user: verifiedUser,
          token: `jwt-ssh-${verifiedUser.id}-${Date.now()}`
        });
      }

      // Standard Login or Persona Switch 2FA Verification Success
      const jwtToken = `jwt-ssh-${verifiedUser.id}-${Date.now()}`;

      addAuditLog(
        verifiedUser.id,
        verifiedUser.name,
        verifiedUser.role,
        'LOGIN_2FA_SUCCESS',
        'USER_SESSION',
        verifiedUser.id,
        `2FA verification passed for ${verifiedUser.name} (${verifiedUser.role}) using ${result.session.method}`,
        {
          ipAddress: clientIp,
          beforeData: null,
          afterData: { method: result.session.method, destination: result.session.method === 'SMS' ? result.session.userPhone : result.session.userEmail },
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({
        success: true,
        user: verifiedUser,
        token: jwtToken,
        message: `Welcome back, ${verifiedUser.name}!`
      });
    }

    // ==========================================
    // 2FA RESEND OTP
    // ==========================================
    if (action === 'resend_2fa_otp') {
      if (!tempToken) {
        return NextResponse.json({ error: 'Session token is required to resend OTP' }, { status: 400 });
      }

      const resendRes = resend2faOtp(tempToken, method);
      if (!resendRes.success || !resendRes.session) {
        return NextResponse.json({ error: resendRes.error || 'Failed to resend OTP' }, { status: 400 });
      }

      const sess = resendRes.session;
      addAuditLog(
        sess.userId,
        sess.userName,
        sess.userRole,
        '2FA_OTP_RESENT',
        'USER_SECURITY',
        sess.userId,
        `New OTP dispatched to ${sess.method === 'SMS' ? maskPhoneNumber(sess.userPhone) : maskEmailAddress(sess.userEmail)}`,
        {
          ipAddress: clientIp,
          beforeData: null,
          afterData: { method: sess.method },
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({
        success: true,
        message: `New verification code sent via ${sess.method}!`,
        method: sess.method,
        phoneMasked: maskPhoneNumber(sess.userPhone),
        emailMasked: maskEmailAddress(sess.userEmail),
        simulatedSmsMessage: sess.simulatedSmsMessage,
        simulatedEmailSubject: sess.simulatedEmailSubject,
        simulatedEmailBody: sess.simulatedEmailBody,
        demoOtp: sess.code
      });
    }

    // ==========================================
    // 2FA STEP 1: REQUEST ENABLE 2FA CHALLENGE
    // ==========================================
    if (action === 'request_enable_2fa') {
      const targetUser = db.users.find(u => u.id === (userId || targetUserId));
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const chosenMethod = method || targetUser.twoFactorMethod || 'BOTH';
      const challenge = create2faChallenge({
        userId: targetUser.id,
        userName: targetUser.name,
        userRole: targetUser.role,
        userEmail: targetUser.email,
        userPhone: targetUser.phone,
        method: chosenMethod,
        purpose: 'ENABLE_2FA',
        validityMinutes: 5
      });

      return NextResponse.json({
        success: true,
        requires2fa: true,
        tempToken: challenge.tempToken,
        method: challenge.method,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          phone: targetUser.phone
        },
        phoneMasked: maskPhoneNumber(targetUser.phone),
        emailMasked: maskEmailAddress(targetUser.email),
        simulatedSmsMessage: challenge.simulatedSmsMessage,
        simulatedEmailSubject: challenge.simulatedEmailSubject,
        simulatedEmailBody: challenge.simulatedEmailBody,
        demoOtp: challenge.code
      });
    }

    // ==========================================
    // 2FA CONFIGURATION: TOGGLE FOR USER
    // ==========================================
    if (action === 'toggle_user_2fa') {
      const target = db.users.find(u => u.id === (targetUserId || userId));
      if (!target) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const wasEnabled = !!target.twoFactorEnabled;
      const willBeEnabled = typeof enabled === 'boolean' ? enabled : !wasEnabled;
      target.twoFactorEnabled = willBeEnabled;
      if (method) target.twoFactorMethod = method;
      if (willBeEnabled) {
        target.twoFactorVerifiedAt = new Date().toISOString();
      }
      saveDb(db);

      const actingUser = db.users.find(u => u.id === userId) || target;

      addAuditLog(
        actingUser.id,
        actingUser.name,
        actingUser.role,
        willBeEnabled ? 'SECURITY_2FA_ENABLED' : 'SECURITY_2FA_DISABLED',
        'USER_SECURITY',
        target.id,
        `${actingUser.name} ${willBeEnabled ? 'enabled' : 'disabled'} 2FA for ${target.name}`,
        {
          ipAddress: clientIp,
          beforeData: { twoFactorEnabled: wasEnabled },
          afterData: { twoFactorEnabled: willBeEnabled, twoFactorMethod: target.twoFactorMethod },
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({
        success: true,
        message: `Two-Factor Authentication ${willBeEnabled ? 'enabled' : 'disabled'} for ${target.name}`,
        user: target
      });
    }

    // ==========================================
    // 2FA CONFIGURATION: ADMIN GLOBAL POLICY
    // ==========================================
    if (action === 'update_2fa_policy' && policy) {
      if (!db.settings.twoFactorPolicy) {
        db.settings.twoFactorPolicy = {
          enforceForAll: false,
          enforceForStaff: true,
          defaultMethod: 'BOTH',
          otpValidityMinutes: 5
        };
      }

      db.settings.twoFactorPolicy = {
        ...db.settings.twoFactorPolicy,
        ...policy
      };
      saveDb(db);

      const actingUser = db.users.find(u => u.id === userId) || db.users[0];
      addAuditLog(
        actingUser.id,
        actingUser.name,
        actingUser.role,
        'SECURITY_POLICY_UPDATE',
        'SYSTEM_SETTINGS',
        'policy-2fa',
        `Updated hostel 2FA policy: enforceForAll=${policy.enforceForAll}, enforceForStaff=${policy.enforceForStaff}`,
        {
          ipAddress: clientIp,
          beforeData: null,
          afterData: db.settings.twoFactorPolicy,
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({
        success: true,
        policy: db.settings.twoFactorPolicy,
        message: 'Hostel 2FA policy updated successfully'
      });
    }

    if (action === 'logout') {
      const user = db.users.find(u => u.id === userId) || {
        id: userId || 'usr-anon',
        name: body.userName || 'Anonymous User',
        role: (body.userRole || 'RESIDENT') as UserRole
      };

      addAuditLog(
        user.id,
        user.name,
        user.role as UserRole,
        'LOGOUT',
        'USER_SESSION',
        user.id,
        `User ${user.name} logged out from IP ${clientIp}`,
        {
          ipAddress: clientIp,
          beforeData: { userId: user.id, userName: user.name, role: user.role },
          afterData: null,
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({ success: true, message: 'Logged out successfully' });
    }

    if (action === 'switch_role' && role) {
      const targetUser = db.users.find(u => u.role === role);
      if (!targetUser) {
        return NextResponse.json({ error: 'User for role not found' }, { status: 404 });
      }

      // Check if 2FA is required for this switch
      const policy = db.settings.twoFactorPolicy;
      const enforceStaff = policy?.enforceForStaff && targetUser.role !== 'RESIDENT';
      const enforceAll = policy?.enforceForAll;
      const is2faActive = targetUser.twoFactorEnabled || enforceStaff || enforceAll;

      // If require2fa is explicitly requested or 2FA is active and not bypassed
      if (body.test2faChallenge || (is2faActive && body.enforce2faVerification)) {
        const challenge = create2faChallenge({
          userId: targetUser.id,
          userName: targetUser.name,
          userRole: targetUser.role,
          userEmail: targetUser.email,
          userPhone: targetUser.phone,
          method: targetUser.twoFactorMethod || policy?.defaultMethod || 'BOTH',
          purpose: 'SWITCH_USER'
        });

        return NextResponse.json({
          success: true,
          requires2fa: true,
          tempToken: challenge.tempToken,
          method: challenge.method,
          user: {
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
            phone: targetUser.phone
          },
          phoneMasked: maskPhoneNumber(targetUser.phone),
          emailMasked: maskEmailAddress(targetUser.email),
          simulatedSmsMessage: challenge.simulatedSmsMessage,
          simulatedEmailSubject: challenge.simulatedEmailSubject,
          simulatedEmailBody: challenge.simulatedEmailBody,
          demoOtp: challenge.code
        });
      }

      addAuditLog(
        targetUser.id,
        targetUser.name,
        targetUser.role,
        'USER_ROLE_CHANGE',
        'USER_SESSION',
        targetUser.id,
        `Switched session persona from ${currentRole || 'UNKNOWN'} to ${role} (${targetUser.name})`,
        {
          ipAddress: clientIp,
          beforeData: { previousRole: currentRole || null },
          afterData: { switchedRole: role, userName: targetUser.name, userId: targetUser.id },
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({
        success: true,
        user: targetUser,
        message: `Logged in as ${targetUser.name} (${targetUser.role})`
      });
    }

    if (action === 'create_user' && body.userData) {
      const { name, email, role: newRole, phone, twoFactorEnabled: user2fa, twoFactorMethod: userMethod } = body.userData;
      if (!name || !email || !newRole) {
        return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
      }

      const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
      }

      const newUser = {
        id: `usr-${Date.now()}`,
        name,
        email,
        role: newRole as UserRole,
        phone: phone || '+91 98480 22338',
        twoFactorEnabled: !!user2fa,
        twoFactorMethod: userMethod || 'SMS',
        createdAt: new Date().toISOString()
      };

      db.users.push(newUser);
      saveDb(db);

      const actingUser = db.users.find(u => u.id === userId) || db.users[0];

      addAuditLog(
        actingUser.id,
        actingUser.name,
        actingUser.role,
        'USER_ROLE_CHANGE',
        'USER',
        newUser.id,
        `Created new staff/operator account for ${newUser.name} with role ${newUser.role}`,
        {
          ipAddress: clientIp,
          beforeData: null,
          afterData: newUser,
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({ success: true, user: newUser });
    }

    if (action === 'update_user_role' && targetUserId && newRole) {
      const targetUser = db.users.find(u => u.id === targetUserId);
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const oldRole = targetUser.role;
      targetUser.role = newRole as UserRole;
      saveDb(db);

      const actingUser = db.users.find(u => u.id === userId) || db.users[0];

      addAuditLog(
        actingUser.id,
        actingUser.name,
        actingUser.role,
        'USER_ROLE_CHANGE',
        'USER',
        targetUser.id,
        `Changed role for ${targetUser.name} from ${oldRole} to ${newRole}`,
        {
          ipAddress: clientIp,
          beforeData: { userId: targetUser.id, name: targetUser.name, role: oldRole },
          afterData: { userId: targetUser.id, name: targetUser.name, role: newRole },
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({ success: true, user: targetUser });
    }

    // ==========================================
    // STANDARD LOGIN (BY EMAIL + PASSWORD)
    // ==========================================
    if (email || action === 'login') {
      const targetEmail = (email || body.username || '').toLowerCase().trim();
      const user = db.users.find(u => u.email.toLowerCase() === targetEmail);
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials. User email not found.' }, { status: 401 });
      }

      // Check if 2FA is required for this user
      const policy = db.settings.twoFactorPolicy;
      const enforceStaff = policy?.enforceForStaff && user.role !== 'RESIDENT';
      const enforceAll = policy?.enforceForAll;
      const is2faActive = user.twoFactorEnabled || enforceStaff || enforceAll;

      if (is2faActive) {
        const challenge = create2faChallenge({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          userEmail: user.email,
          userPhone: user.phone,
          method: user.twoFactorMethod || policy?.defaultMethod || 'BOTH',
          purpose: 'LOGIN'
        });

        addAuditLog(
          user.id,
          user.name,
          user.role,
          'LOGIN_2FA_CHALLENGE',
          'USER_SESSION',
          user.id,
          `2FA OTP Challenge dispatched for ${user.name} via ${challenge.method}`,
          {
            ipAddress: clientIp,
            beforeData: null,
            afterData: { method: challenge.method },
            status: 'SUCCESS'
          }
        );

        return NextResponse.json({
          success: true,
          requires2fa: true,
          tempToken: challenge.tempToken,
          method: challenge.method,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
          },
          phoneMasked: maskPhoneNumber(user.phone),
          emailMasked: maskEmailAddress(user.email),
          simulatedSmsMessage: challenge.simulatedSmsMessage,
          simulatedEmailSubject: challenge.simulatedEmailSubject,
          simulatedEmailBody: challenge.simulatedEmailBody,
          demoOtp: challenge.code
        });
      }

      // No 2FA required: Direct login
      addAuditLog(
        user.id,
        user.name,
        user.role,
        'LOGIN',
        'USER_SESSION',
        user.id,
        `User ${user.name} logged in with email ${targetEmail} (No 2FA required)`,
        {
          ipAddress: clientIp,
          beforeData: null,
          afterData: { email: user.email, role: user.role, name: user.name, id: user.id },
          status: 'SUCCESS'
        }
      );

      return NextResponse.json({
        success: true,
        user,
        token: `jwt-ssh-${user.id}-${Date.now()}`
      });
    }

    return NextResponse.json({ error: 'Invalid auth request' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Auth failure' }, { status: 500 });
  }
}

