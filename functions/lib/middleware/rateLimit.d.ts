import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
export declare function rateLimitMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
export declare function logApiRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=rateLimit.d.ts.map