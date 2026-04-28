import { Request, Response, NextFunction } from "express";
export declare function securityHeaders(req: Request, res: Response, next: NextFunction): void;
export declare function validateInput(req: Request, res: Response, next: NextFunction): any;
export declare function sanitizeOutput(req: Request, res: Response, next: NextFunction): void;
export declare function errorHandler(err: Record<string, unknown>, req: Request, res: Response): void;
//# sourceMappingURL=security.d.ts.map