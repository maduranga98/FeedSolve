import { Request, Response, NextFunction } from 'express';
export declare function securityHeaders(req: Request, res: Response, next: NextFunction): void;
export declare function validateInput(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function sanitizeOutput(req: Request, res: Response, next: NextFunction): void;
export declare function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=security.d.ts.map