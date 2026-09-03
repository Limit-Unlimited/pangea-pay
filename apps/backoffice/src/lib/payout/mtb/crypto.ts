/**
 * MTB field-level encryption — AES-256-CBC with a dynamic per-value IV,
 * per "Remittance API_v3.2.pdf" §4.3 (Sensitive Data Encryption).
 *
 * ⚠️ KEY-DERIVATION CAVEAT: the source PDF's bit-width figures did not
 * survive text extraction (rendered as blank/garbled placeholders), so the
 * exact formula for combining the IV and the partner key is reconstructed
 * here rather than read verbatim. This reconstruction is the only one
 * consistent with the credentials MTB actually shared (a 16-character
 * Request Key, a 16-character Response Key, and "key offset = 16") and
 * with the stated "256 bit AES" requirement:
 *
 *   AES-256 key (32 bytes) = 16-byte random IV + 16-byte partner key
 *     (Request Key when encrypting outbound data, Response Key when
 *      decrypting inbound data — MTB's spec calls this partner key the
 *      "Key Offset" in its generic formula section)
 *
 * Verify this against MTB's UAT sandbox (or a known plaintext/ciphertext
 * pair from MTB support) before relying on it for a real transaction —
 * see apps/backoffice/src/lib/payout/mtb/client.ts's smoke-test notes.
 *
 * Per spec: sender generates a random IV, forms the AES key, encrypts,
 * then prefixes the IV to the ciphertext and base64-encodes the result.
 * The receiver reverses this by splitting the IV back off.
 */

import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const IV_LENGTH = 16;      // AES block size / CBC IV size
const KEY_PART_LENGTH = 16; // expected length of Request Key / Response Key ("key offset = 16")
const ALGORITHM = "aes-256-cbc";

function assertKeyLength(key: string, label: string) {
  if (Buffer.byteLength(key, "utf8") !== KEY_PART_LENGTH) {
    throw new Error(
      `MTB ${label} must be exactly ${KEY_PART_LENGTH} bytes — got ${Buffer.byteLength(key, "utf8")}. ` +
      "Check the credential was copied correctly.",
    );
  }
}

function deriveAesKey(iv: Buffer, keyPart: string): Buffer {
  return Buffer.concat([iv, Buffer.from(keyPart, "utf8")]);
}

/**
 * Encrypt one sensitive field for an outbound request.
 * @param plaintext value to encrypt
 * @param requestKey MTB's per-partner Request Key (16 bytes)
 * @returns base64(iv || ciphertext), ready to place in the request body
 */
export function encryptField(plaintext: string, requestKey: string): string {
  assertKeyLength(requestKey, "Request Key");

  const iv = randomBytes(IV_LENGTH);
  const aesKey = deriveAesKey(iv, requestKey);

  const cipher = createCipheriv(ALGORITHM, aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  return Buffer.concat([iv, encrypted]).toString("base64");
}

/**
 * Decrypt one sensitive field from an inbound response.
 * @param ciphertextB64 base64(iv || ciphertext) as received from MTB
 * @param responseKey MTB's per-partner Response Key (16 bytes)
 */
export function decryptField(ciphertextB64: string, responseKey: string): string {
  assertKeyLength(responseKey, "Response Key");

  const raw = Buffer.from(ciphertextB64, "base64");
  if (raw.length <= IV_LENGTH) {
    throw new Error(`MTB encrypted value too short to contain a ${IV_LENGTH}-byte IV: "${ciphertextB64}"`);
  }
  const iv         = raw.subarray(0, IV_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH);
  const aesKey      = deriveAesKey(iv, responseKey);

  const decipher = createDecipheriv(ALGORITHM, aesKey, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted.toString("utf8");
}
