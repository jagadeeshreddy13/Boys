import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, addAuditLog } from '@/lib/db/store';
import { UserRole } from '@/lib/db/types';
import { getClientIp } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const role = searchParams.get('role') as UserRole | null;
  const userId = searchParams.get('userId');

  if (userId) {
    const user = db.users.find(u => u.id === userId);
    if (user) return NextResponse.json({ user });
  }

  if (role) {
    const user = db.users.find(u => u.role === role);
    if (user) return NextResponse.json({ user });
  }

  // Default to owner if none specified
  return NextResponse.json({
    user: db.users[0],
    availableUsers: db.users
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, role, currentRole, email, password, userId, targetUserId, newRole } = body;
    const db = getDb();
    const clientIp = getClientIp(req);

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
      const { name, email, role: newRole, phone } = body.userData;
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

    if (email) {
      // Find user by email
      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials. Check seed users.' }, { status: 401 });
      }

      addAuditLog(
        user.id,
        user.name,
        user.role,
        'LOGIN',
        'USER_SESSION',
        user.id,
        `User ${user.name} logged in with email ${email}`,
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
