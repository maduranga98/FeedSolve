import { Request, Response, NextFunction } from "express";
import type { UserRole } from "../types";
export interface PermissionRequest extends Request {
    user?: {
        uid: string;
        email: string;
        companyId: string;
        role: UserRole;
    };
}
export declare function verifyRBAC(req: PermissionRequest, res: Response, next: NextFunction): Promise<any>;
export declare function requirePermission(permission: string): (req: PermissionRequest, res: Response, next: NextFunction) => any;
export declare function requireRole(...roles: UserRole[]): (req: PermissionRequest, res: Response, next: NextFunction) => any;
export declare function canManageRole(userRole: UserRole, targetRole: UserRole): boolean;
export declare function auditLog(companyId: string, userId: string, action: string, changes: Record<string, unknown>, targetUserId?: string): Promise<void>;
export declare function onlyFields(allowedFields: string[]): (req: PermissionRequest, res: Response, next: NextFunction) => any;
//# sourceMappingURL=rbac.d.ts.map