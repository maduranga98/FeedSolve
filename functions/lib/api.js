"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = require("./middleware/auth");
const rateLimit_1 = require("./middleware/rateLimit");
const security_1 = require("./middleware/security");
const apiKeys_1 = __importDefault(require("./routes/apiKeys"));
const submissions_1 = __importDefault(require("./routes/submissions"));
const boards_1 = __importDefault(require("./routes/boards"));
const stats_1 = __importDefault(require("./routes/stats"));
const attachments_1 = __importDefault(require("./routes/attachments"));
const search_1 = __importDefault(require("./routes/search"));
const filters_1 = __importDefault(require("./routes/filters"));
const bulk_operations_1 = __importDefault(require("./routes/bulk-operations"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const openapi_json_1 = __importDefault(require("./openapi.json"));
const app = (0, express_1.default)();
// Security headers - apply first
app.use(security_1.securityHeaders);
// Middleware
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ limit: "10mb", extended: true }));
app.use(security_1.validateInput);
app.use(security_1.sanitizeOutput);
const EXPLICIT_ORIGINS = new Set([
    "http://localhost:5173",
    "http://localhost:3000",
    "https://feedsolve.com",
    "https://app.feedsolve.com",
]);
// Matches any https subdomain of feedsolve.com (no wildcards in the cors package)
const SUBDOMAIN_RE = /^https:\/\/[a-z0-9-]+\.feedsolve\.com$/;
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin ||
            EXPLICIT_ORIGINS.has(origin) ||
            SUBDOMAIN_RE.test(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// API documentation
app.use("/api/docs", swagger_ui_express_1.default.serve);
app.get("/api/docs", swagger_ui_express_1.default.setup(openapi_json_1.default));
// OpenAPI spec
app.get("/api/openapi.json", (req, res) => {
    res.json(openapi_json_1.default);
});
// Public routes — mounted before auth middleware so /public/* paths are accessible without API key
app.use("/", attachments_1.default);
// API authentication and rate limiting
app.use("/api/", auth_1.authenticateApiKey);
app.use("/api/", rateLimit_1.rateLimitMiddleware);
app.use("/api/", rateLimit_1.logApiRequest);
// Error handling for invalid API keys on protected routes
app.use("/api/", (err, req, res, next) => {
    if (err &&
        typeof err === "object" &&
        "status" in err &&
        err.status === 401) {
        res.status(401).json({ error: "Invalid API key" });
        return;
    }
    next(err);
});
// Routes
app.use("/", apiKeys_1.default);
app.use("/", submissions_1.default);
app.use("/", boards_1.default);
app.use("/", stats_1.default);
app.use("/", search_1.default);
app.use("/", filters_1.default);
app.use("/", bulk_operations_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});
// Global error handler
app.use(security_1.errorHandler);
exports.default = app;
//# sourceMappingURL=api.js.map