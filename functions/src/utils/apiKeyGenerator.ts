import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const API_KEY_PREFIX = 'fsk_';
const KEY_LENGTH = 32;
const BCRYPT_ROUNDS = 10;

export interface GeneratedApiKey {
  id: string;
  key: string;
  keyDisplay: string;
  keyHash: string;
}

export function generateApiKey(): GeneratedApiKey {
  const randomBytes = crypto.randomBytes(KEY_LENGTH).toString('hex');
  const key = API_KEY_PREFIX + randomBytes;
  const id = uuidv4();

  const keyDisplay = API_KEY_PREFIX + '...' + key.substring(key.length - 4);
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  return {
    id,
    key,
    keyDisplay,
    keyHash,
  };
}

export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, BCRYPT_ROUNDS);
}

export async function verifyApiKey(
  providedKey: string,
  hashedKey: string
): Promise<boolean> {
  return bcrypt.compare(providedKey, hashedKey);
}
