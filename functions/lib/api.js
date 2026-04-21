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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("./middleware/auth");
const rateLimit_1 = require("./middleware/rateLimit");
const apiKeys_1 = __importDefault(require("./routes/apiKeys"));
const submissions_1 = __importDefault(require("./routes/submissions"));
const boards_1 = __importDefault(require("./routes/boards"));
const stats_1 = __importDefault(require("./routes/stats"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// @ts-ignore
const openapi_json_1 = __importDefault(require("./openapi.json"));
admin.initializeApp();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://feedsolve.com',
        'https://*.feedsolve.com',
    ],
    credentials: true,
}));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API documentation
app.use('/api/docs', swagger_ui_express_1.default.serve);
app.get('/api/docs', swagger_ui_express_1.default.setup(openapi_json_1.default));
// OpenAPI spec
app.get('/api/openapi.json', (req, res) => {
    res.json(openapi_json_1.default);
});
// API authentication and rate limiting
app.use('/api/', auth_1.authenticateApiKey);
app.use('/api/', rateLimit_1.rateLimitMiddleware);
app.use('/api/', rateLimit_1.logApiRequest);
// Error handling for invalid API keys on protected routes
app.use('/api/', (err, req, res, next) => {
    if (err && err.status === 401) {
        res.status(401).json({ error: 'Invalid API key' });
        return;
    }
    next(err);
});
// Routes
app.use('/', apiKeys_1.default);
app.use('/', submissions_1.default);
app.use('/', boards_1.default);
app.use('/', stats_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
});
exports.default = app;
//# sourceMappingURL=api.js.map