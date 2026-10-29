#!/usr/bin/env node
/**
 * Grant or revoke the `superAdmin` custom claim on a Firebase Auth user.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node scripts/set-super-admin.mjs you@example.com
 *   ... node scripts/set-super-admin.mjs you@example.com --revoke
 *
 * The user must sign out and back in (or refresh their ID token) afterwards.
 */
import { createRequire } from 'node:module';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const admin = require('firebase-admin');

const [email, flag] = process.argv.slice(2);
if (!email) {
  console.error('Usage: node scripts/set-super-admin.mjs <email> [--revoke]');
  process.exit(1);
}

admin.initializeApp();

const user = await admin.auth().getUserByEmail(email);
const claims = { ...(user.customClaims ?? {}) };
if (flag === '--revoke') delete claims.superAdmin;
else claims.superAdmin = true;

await admin.auth().setCustomUserClaims(user.uid, claims);
console.log(`${flag === '--revoke' ? 'Revoked' : 'Granted'} superAdmin for ${email} (${user.uid})`);
