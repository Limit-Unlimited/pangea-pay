import { describe, it, expect } from "vitest";
import { encryptField, decryptField } from "./crypto";

const REQUEST_KEY  = "QfThWmZq4t7w!z%C"; // 16-byte example key, shape matches MTB's UAT credential
const RESPONSE_KEY = "D(G+KbPeSgVkYp3s"; // 16-byte example key, shape matches MTB's UAT credential

describe("MTB field encryption", () => {
  it("round-trips a plaintext value through encrypt then decrypt with matching keys", () => {
    const plaintext = "0460310075297"; // sample MTB account number from the spec's examples
    const encrypted = encryptField(plaintext, REQUEST_KEY);
    // encrypt with Request Key, "decrypt" with the same key to prove the
    // IV-prefix + AES-256-CBC round trip is correct in isolation
    const decrypted = decryptField(encrypted, REQUEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const plaintext = "125.25";
    const first  = encryptField(plaintext, REQUEST_KEY);
    const second = encryptField(plaintext, REQUEST_KEY);
    expect(first).not.toBe(second);
    expect(decryptField(first, REQUEST_KEY)).toBe(plaintext);
    expect(decryptField(second, REQUEST_KEY)).toBe(plaintext);
  });

  it("fails to decrypt with the wrong key (catches key-derivation ordering bugs)", () => {
    const encrypted = encryptField("Lionel Messi", REQUEST_KEY);
    // decrypting with a different 16-byte key should not silently succeed
    // with the correct plaintext — Node's AES-CBC will either throw on bad
    // padding or, rarely, produce garbage; assert it does not match.
    let decrypted: string | null = null;
    try {
      decrypted = decryptField(encrypted, RESPONSE_KEY);
    } catch {
      decrypted = null;
    }
    expect(decrypted).not.toBe("Lionel Messi");
  });

  it("round-trips request and response directions independently", () => {
    const requestPlaintext  = "500.00";
    const responsePlaintext = "MD. Osman Habib";

    const encryptedRequest  = encryptField(requestPlaintext, REQUEST_KEY);
    const encryptedResponse = encryptField(responsePlaintext, RESPONSE_KEY);

    expect(decryptField(encryptedRequest, REQUEST_KEY)).toBe(requestPlaintext);
    expect(decryptField(encryptedResponse, RESPONSE_KEY)).toBe(responsePlaintext);
  });

  it("rejects keys that are not exactly 16 bytes", () => {
    expect(() => encryptField("value", "too-short")).toThrow(/16 bytes/);
    expect(() => decryptField("aGVsbG8=", "way-too-long-for-16-bytes")).toThrow(/16 bytes/);
  });

  it("handles UTF-8 multi-byte plaintext (e.g. non-Latin beneficiary names)", () => {
    const plaintext = "মোঃ রাজিব বিন আহমেদ"; // Bangla name — MTB's own examples include Bangla customer names
    const encrypted = encryptField(plaintext, REQUEST_KEY);
    expect(decryptField(encrypted, REQUEST_KEY)).toBe(plaintext);
  });
});
