import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    companyId?: string;
    apiKeyId?: string;
    permissions?: string[];
    userId?: string;
}
export declare function authenticateApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
export declare function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
export declare function hasPermission(requiredPermissions: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map