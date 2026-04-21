import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import type { UserRole } from '../types';

export interface PermissionRequest extends Request {
  user?: {
    uid: string;
    email: string;
    companyId: string;
    role: UserRole;
  };
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  viewer: 1,
};

const ROLE_PERMISSIONS: Record<UserRole, Set<string>> = {
  owner: new Set([
    'submissions:read',
    'submissions:create',
    'submissions:update',
    'submissions:delete',
    'submissions:assign',
    'submissions:reply',
    'team:read',
    'team:invite',
    'team:manage',
    'team:remove',
    'webhooks:read',
    'webhooks:write',
    'integrations:read',
    'integrations:write',
    'analytics:read',
    'company:read',
    'company:update',
    'company:delete',
    'billing:read',
    'billing:manage',
    'audit:read',
  ]),
  admin: new Set([
    'submissions:read',
    'submissions:create',
    'submissions:update',
    'submissions:delete',
    'submissions:assign',
    'submissions:reply',
    'team:read',
    'team:invite',
    'team:manage',
    'team:remove',
    'webhooks:read',
    'webhooks:write',
    'integrations:read',
    'integrations:write',
    'analytics:read',
    'company:read',
    'audit:read',
  ]),
  manager: new Set([
    'submissions:read',
    'submissions:update',
    'submissions:assign',
    'submissions:reply',
    'team:read',
    'analytics:read',
    'audit:read',
  ]),
  viewer: new Set([
    'submissions:read',
    'analytics:read',
  ]),
};

export async function verifyRBAC(req: PermissionRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.slice(7);
    const decodedToken = await admin.auth().verifyIdToken(token);

    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data() as any;
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      companyId: userData.companyId,
      role: userData.role,
    };

    next();
  } catch (error) {
    console.error('RBAC verification error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export function requirePermission(permission: string) {
  return (req: PermissionRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const permissions = ROLE_PERMISSIONS[req.user.role];
    if (!permissions.has(permission)) {
      return res.status(403).json({
        error: `Permission denied: ${permission}`,
        userRole: req.user.role,
      });
    }

    next();
  };
}

export function requireRole(...roles: UserRole[]) {
  return (req: PermissionRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Required one of roles: ${roles.join(', ')}`,
        userRole: req.user.role,
      });
    }

    next();
  };
}

export function canManageRole(userRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}

export async function auditLog(
  companyId: string,
  userId: string,
  action: string,
  changes: Record<string, any>,
  targetUserId?: string
): Promise<void> {
  try {
    await admin.firestore().collection('companies').doc(companyId).collection('audit_logs').add({
      userId,
      action,
      targetUserId,
      changes,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: process.env.CLIENT_IP || 'unknown',
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

export function onlyFields(allowedFields: string[]) {
  return (req: PermissionRequest, res: Response, next: NextFunction) => {
    const bodyKeys = Object.keys(req.body || {});
    const invalidKeys = bodyKeys.filter(key => !allowedFields.includes(key));

    if (invalidKeys.length > 0) {
      return res.status(400).json({
        error: `Invalid fields: ${invalidKeys.join(', ')}`,
        allowedFields,
      });
    }

    next();
  };
}
