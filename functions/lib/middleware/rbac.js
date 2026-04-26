"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRBAC = verifyRBAC;
exports.requirePermission = requirePermission;
exports.requireRole = requireRole;
exports.canManageRole = canManageRole;
exports.auditLog = auditLog;
exports.onlyFields = onlyFields;
const admin = __importStar(require("firebase-admin"));
const ROLE_HIERARCHY = {
    owner: 4,
    admin: 3,
    manager: 2,
    viewer: 1,
};
const ROLE_PERMISSIONS = {
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
async function verifyRBAC(req, res, next) {
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
        const userData = userDoc.data();
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            companyId: userData.companyId,
            role: userData.role,
        };
        next();
    }
    catch (error) {
        console.error('RBAC verification error:', error);
        res.status(401).json({ error: 'Unauthorized' });
    }
}
function requirePermission(permission) {
    return (req, res, next) => {
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
function requireRole(...roles) {
    return (req, res, next) => {
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
function canManageRole(userRole, targetRole) {
    return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}
async function auditLog(companyId, userId, action, changes, targetUserId) {
    try {
        await admin.firestore().collection('companies').doc(companyId).collection('audit_logs').add({
            userId,
            action,
            targetUserId,
            changes,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            ipAddress: process.env.CLIENT_IP || 'unknown',
        });
    }
    catch (error) {
        console.error('Failed to write audit log:', error);
    }
}
function onlyFields(allowedFields) {
    return (req, res, next) => {
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
//# sourceMappingURL=rbac.js.map