import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key from environment variable
 * The key should be a 32-byte (256-bit) hex string
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  // If key is hex encoded (64 chars), decode it; otherwise use as-is
  if (key.length === 64) {
    return Buffer.from(key, "hex");
  }
  // If key is 32 chars, use directly as buffer
  if (key.length === 32) {
    return Buffer.from(key, "utf8");
  }
  throw new Error(
    "ENCRYPTION_KEY must be either a 64-character hex string or 32-character string",
  );
}

/**
 * Encrypt an API key using AES-256-GCM
 * @param plainKey - The plain text API key to encrypt
 * @returns The encrypted key as a base64 string (format: iv:authTag:encryptedData)
 */
export function encryptApiKey(plainKey: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Combine iv, authTag, and encrypted data
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, "hex"),
  ]).toString("base64");

  return combined;
}

/**
 * Decrypt an API key using AES-256-GCM
 * @param encryptedKey - The encrypted key (base64 format: iv:authTag:encryptedData)
 * @returns The decrypted plain text API key
 */
export function decryptApiKey(encryptedKey: string): string {
  const key = getEncryptionKey();

  // Decode the combined base64 string
  const combined = Buffer.from(encryptedKey, "base64");

  // Extract iv, authTag, and encrypted data
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Mask an API key for display (show only first 4 and last 4 characters)
 * @param apiKey - The API key to mask
 * @returns The masked API key (e.g., "sk-a***xyz")
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return "****";
  }
  const prefix = apiKey.substring(0, 4);
  const suffix = apiKey.substring(apiKey.length - 4);
  return `${prefix}****${suffix}`;
}
