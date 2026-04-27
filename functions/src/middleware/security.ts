import { Request, Response, NextFunction } from "express";

// Security headers middleware
export function securityHeaders(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection in older browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Content Security Policy — API responses are JSON so a strict policy is safe
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; script-src 'none'; object-src 'none'; frame-ancestors 'none'; base-uri 'none';",
  );

  // Referrer Policy - privacy-friendly
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy (formerly Feature Policy)
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  );

  // Enforce HTTPS
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );

  // Disable browser caching for sensitive pages
  if (req.path.includes("/api/")) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
}

// Input validation middleware
export function validateInput(req: Request, res: Response, next: NextFunction) {
  // Check request size
  if (
    req.headers["content-length"] &&
    parseInt(req.headers["content-length"]) > 10 * 1024 * 1024
  ) {
    return res.status(413).json({ error: "Request body too large" });
  }

  // Validate JSON content type for POST/PUT requests
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    if (!req.is("application/json")) {
      return res
        .status(415)
        .json({ error: "Content-Type must be application/json" });
    }
  }

  next();
}

// Sanitize output middleware
export function sanitizeOutput(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Store original send method
  const originalSend = res.send;

  res.send = function (data: Record<string, unknown>) {
    // Remove sensitive headers
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}

// Error handling middleware - don't leak stack traces
export function errorHandler(
  err: Record<string, unknown>,
  req: Request,
  res: Response,
) {
  const errObj = err as Record<string, unknown>;
  console.error("[ERROR]", {
    message: errObj.message,
    status: (errObj.status as number) || 500,
    path: req.path,
    method: req.method,
  });

  const statusCode = (errObj.status as number) || 500;
  const isProduction = process.env.NODE_ENV === "production";

  const response: Record<string, unknown> = {
    error: (errObj.message as string) || "Internal Server Error",
  };

  // Don't expose stack traces in production
  if (!isProduction) {
    response.stack = errObj.stack;
  }

  res.status(statusCode).json(response);
}
}
