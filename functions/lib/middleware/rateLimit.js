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
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = rateLimitMiddleware;
exports.submissionRateLimitMiddleware = submissionRateLimitMiddleware;
exports.logApiRequest = logApiRequest;
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const db = admin.firestore();
function getMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
}
function getNextMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}
async function rateLimitMiddleware(req, res, next) {
    try {
        const companyId = req.companyId;
        const apiKeyId = req.apiKeyId;
        if (!companyId || !apiKeyId) {
            next();
            return;
        }
        const keyRef = db
            .collection('api_keys')
            .doc(companyId)
            .collection('keys')
            .doc(apiKeyId);
        const keyDoc = await keyRef.get();
        if (!keyDoc.exists) {
            res.status(401).json({ error: 'API key not found' });
            return;
        }
        const keyData = keyDoc.data();
        if (!keyData) {
            res.status(401).json({ error: 'Invalid API key' });
            return;
        }
        const monthStart = getMonthStart();
        const lastReset = keyData.rateLimit?.lastResetAt?.toDate();
        let currentUsage = keyData.rateLimit?.currentMonthUsage || 0;
        if (!lastReset || lastReset < monthStart) {
            currentUsage = 0;
            await keyRef.update({
                'rateLimit.currentMonthUsage': 0,
                'rateLimit.lastResetAt': admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        const limit = keyData.rateLimit?.requestsPerMonth || 10000;
        if (currentUsage >= limit) {
            const nextMonth = getNextMonthStart();
            res.status(429).json({
                error: 'Rate limit exceeded',
                retryAfter: Math.floor(nextMonth.getTime() / 1000),
                limit,
                current: currentUsage,
            });
            return;
        }
        await keyRef.update({
            'rateLimit.currentMonthUsage': admin.firestore.FieldValue.increment(1),
        });
        res.set('X-RateLimit-Limit', limit.toString());
        res.set('X-RateLimit-Remaining', Math.max(0, limit - currentUsage - 1).toString());
        res.set('X-RateLimit-Reset', Math.floor(getNextMonthStart().getTime() / 1000).toString());
        next();
    }
    catch (error) {
        console.error('Rate limit error:', error);
        next();
    }
}
// Per-IP rate limit for the public submission endpoint.
// Limit and window are configurable via environment variables:
//   SUBMISSION_RATE_LIMIT  (default: 10)
//   SUBMISSION_RATE_WINDOW_HOURS (default: 24)
const SUBMISSION_LIMIT = parseInt(process.env.SUBMISSION_RATE_LIMIT || '10', 10);
const SUBMISSION_WINDOW_MS = parseInt(process.env.SUBMISSION_RATE_WINDOW_HOURS || '24', 10) * 60 * 60 * 1000;
async function submissionRateLimitMiddleware(req, res, next) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.ip ||
        'unknown';
    // Hash the IP so raw addresses are never stored
    const ipKey = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 24);
    const now = Date.now();
    const rateLimitRef = db.collection('_rate_limits').doc(`sub_${ipKey}`);
    try {
        let limited = false;
        let retryAfter = 0;
        await db.runTransaction(async (tx) => {
            const doc = await tx.get(rateLimitRef);
            if (doc.exists) {
                const data = doc.data();
                const windowStart = data.windowStart || 0;
                let count = data.count || 0;
                if (now - windowStart > SUBMISSION_WINDOW_MS) {
                    // New window: reset
                    tx.set(rateLimitRef, { windowStart: now, count: 1 });
                }
                else if (count >= SUBMISSION_LIMIT) {
                    limited = true;
                    retryAfter = Math.ceil((windowStart + SUBMISSION_WINDOW_MS - now) / 1000);
                }
                else {
                    tx.update(rateLimitRef, { count: count + 1 });
                }
            }
            else {
                tx.set(rateLimitRef, { windowStart: now, count: 1 });
            }
        });
        if (limited) {
            res.status(429).json({
                error: 'Too many submissions. Please try again later.',
                retryAfter,
                limit: SUBMISSION_LIMIT,
                window: `${SUBMISSION_WINDOW_MS / 3600000}h`,
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Submission rate limit error:', error);
        next(); // fail open to avoid blocking legitimate submissions
    }
}
async function logApiRequest(req, res, next) {
    const startTime = Date.now();
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        const companyId = req.companyId;
        const apiKeyId = req.apiKeyId;
        if (companyId && apiKeyId) {
            const logEntry = {
                id: admin.firestore.FieldValue.serverTimestamp(),
                companyId,
                keyId: apiKeyId,
                method: req.method,
                endpoint: req.path,
                statusCode: res.statusCode,
                responseTime: duration,
                requestSize: JSON.stringify(req.body).length,
                responseSize: JSON.stringify(data).length,
                ipAddress: req.ip || '',
                userAgent: req.get('user-agent') || '',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            db.collection('api_logs')
                .doc(companyId)
                .collection('logs')
                .add(logEntry)
                .catch((err) => console.error('Failed to log API request:', err));
        }
        return originalSend.call(this, data);
    };
    next();
}
//# sourceMappingURL=rateLimit.js.map