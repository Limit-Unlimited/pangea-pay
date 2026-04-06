import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const APP_NAME = "Pangea Pay";

export function generateTotpSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

export function verifyTotp(token: string, secret: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      issuer:    APP_NAME,
      algorithm: "SHA1",
      digits:    6,
      period:    30,
      secret:    OTPAuth.Secret.fromBase32(secret),
    });
    // Returns the time delta if valid, null if invalid
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

export async function generateTotpQrCode(email: string, secret: string): Promise<string> {
  const totp = new OTPAuth.TOTP({
    issuer:    APP_NAME,
    label:     email,
    algorithm: "SHA1",
    digits:    6,
    period:    30,
    secret:    OTPAuth.Secret.fromBase32(secret),
  });
  return QRCode.toDataURL(totp.toString());
}
