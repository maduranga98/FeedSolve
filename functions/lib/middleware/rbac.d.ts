import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../types';
export interface PermissionRequest extends Request {
    user?: {
        uid: string;
        email: string;
        companyId: string;
        role: UserRole;
    };
}
export declare function verifyRBAC(req: PermissionRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function requirePermission(permission: string): (req: PermissionRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function requireRole(...roles: UserRole[]): (req: PermissionRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function canManageRole(userRole: UserRole, targetRole: UserRole): boolean;
export declare function auditLog(companyId: string, userId: string, action: string, changes: Record<string, any>, targetUserId?: string): Promise<void>;
export declare function onlyFields(allowedFields: string[]): (req: PermissionRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=rbac.d.ts.map