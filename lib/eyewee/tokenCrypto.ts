import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// accessTokenEncrypted/refreshTokenEncrypted must be encrypted at rest, never plaintext
// (docs/DEVELOPMENT_PLAN.md §6.4/§6.6). AES-256-GCM with a server-only key from
// EYEWEE_TOKEN_ENCRYPTION_KEY (32 raw bytes, base64-encoded). Output packs iv + authTag +
// ciphertext into one base64 string so storage/retrieval only ever handles a single opaque column.
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function loadKey(): Buffer {
  const encoded = process.env.EYEWEE_TOKEN_ENCRYPTION_KEY;
  if (!encoded) throw new Error("EYEWEE_TOKEN_ENCRYPTION_KEY is not set.");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("EYEWEE_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  return key;
}

export function encryptSecret(plaintext: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decryptSecret(packed: string): string {
  const key = loadKey();
  const raw = Buffer.from(packed, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = raw.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
