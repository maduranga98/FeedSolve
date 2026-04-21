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
exports.generateApiKey = generateApiKey;
exports.hashApiKey = hashApiKey;
exports.verifyApiKey = verifyApiKey;
const crypto = __importStar(require("crypto"));
const bcrypt = __importStar(require("bcrypt"));
const uuid_1 = require("uuid");
const API_KEY_PREFIX = 'fsk_';
const KEY_LENGTH = 32;
const BCRYPT_ROUNDS = 10;
function generateApiKey() {
    const randomBytes = crypto.randomBytes(KEY_LENGTH).toString('hex');
    const key = API_KEY_PREFIX + randomBytes;
    const id = (0, uuid_1.v4)();
    const keyDisplay = API_KEY_PREFIX + '...' + key.substring(key.length - 4);
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    return {
        id,
        key,
        keyDisplay,
        keyHash,
    };
}
async function hashApiKey(key) {
    return bcrypt.hash(key, BCRYPT_ROUNDS);
}
async function verifyApiKey(providedKey, hashedKey) {
    return bcrypt.compare(providedKey, hashedKey);
}
//# sourceMappingURL=apiKeyGenerator.js.map