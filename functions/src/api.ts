import express from "express";
import cors from "cors";
import { authenticateApiKey } from "./middleware/auth";
import { rateLimitMiddleware, logApiRequest } from "./middleware/rateLimit";
import {
  securityHeaders,
  validateInput,
  sanitizeOutput,
  errorHandler,
} from "./middleware/security";
import apiKeysRouter from "./routes/apiKeys";
import submissionsRouter from "./routes/submissions";
import boardsRouter from "./routes/boards";
import statsRouter from "./routes/stats";
import attachmentsRouter from "./routes/attachments";
import searchRouter from "./routes/search";
import filtersRouter from "./routes/filters";
import bulkOperationsRouter from "./routes/bulk-operations";
import swaggerUi from "swagger-ui-express";
import openapi from "./openapi.json";

const app = express();

// Security headers - apply first
app.use(securityHeaders);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(validateInput);
app.use(sanitizeOutput);
const EXPLICIT_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "https://feedsolve.com",
]);
// Matches any https subdomain of feedsolve.com (no wildcards in the cors package)
const SUBDOMAIN_RE = /^https:\/\/[a-z0-9-]+\.feedsolve\.com$/;

app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !origin ||
        EXPLICIT_ORIGINS.has(origin) ||
        SUBDOMAIN_RE.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Health check
app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API documentation
app.use("/api/docs", swaggerUi.serve);
app.get("/api/docs", swaggerUi.setup(openapi as Record<string, unknown>));

// OpenAPI spec
app.get("/api/openapi.json", (req: express.Request, res: express.Response) => {
  res.json(openapi);
});

// Public routes — mounted before auth middleware so /public/* paths are accessible without API key
app.use("/", attachmentsRouter);

// API authentication and rate limiting
app.use("/api/", authenticateApiKey);
app.use("/api/", rateLimitMiddleware);
app.use("/api/", logApiRequest);

// Error handling for invalid API keys on protected routes
app.use(
  "/api/",
  (
    err: Record<string, unknown>,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as Record<string, unknown>).status === 401
    ) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }
    next(err);
  },
);

// Routes
app.use("/", apiKeysRouter);
app.use("/", submissionsRouter);
app.use("/", boardsRouter);
app.use("/", statsRouter);
app.use("/", searchRouter);
app.use("/", filtersRouter);
app.use("/", bulkOperationsRouter);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use(errorHandler);

export default app;
