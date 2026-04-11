import nodemailer from "nodemailer";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
    auth:
      process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
  });
}

const FROM = process.env.EMAIL_FROM ?? "noreply@pangea.local";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const transport = createTransport();
  await transport.sendMail({
    from: `Pangea Pay <${FROM}>`,
    to,
    subject: "Reset your Pangea Pay password",
    text: `You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
    `,
  });
}

export async function sendPaymentCompletedEmail(
  to: string,
  firstName: string,
  referenceNumber: string,
  sendAmount: string,
  sendCurrency: string,
): Promise<void> {
  const transport = createTransport();
  await transport.sendMail({
    from:    `Pangea Pay <${FROM}>`,
    to,
    subject: `Payment completed — ${referenceNumber} — Pangea Pay`,
    text: `Hi ${firstName},\n\nYour payment of ${sendCurrency} ${sendAmount} (reference ${referenceNumber}) has been completed successfully.\n\nThank you for using Pangea Pay.\n\nThe Pangea Pay team`,
    html: `
      <p>Hi ${firstName},</p>
      <p>Your payment of <strong>${sendCurrency} ${sendAmount}</strong> (reference <strong>${referenceNumber}</strong>) has been completed successfully.</p>
      <p>Thank you for using Pangea Pay.</p>
      <p>The Pangea Pay team</p>
    `,
  });
}

export async function sendPaymentFailedEmail(
  to: string,
  firstName: string,
  referenceNumber: string,
  sendAmount: string,
  sendCurrency: string,
  reason?: string,
): Promise<void> {
  const transport = createTransport();
  await transport.sendMail({
    from:    `Pangea Pay <${FROM}>`,
    to,
    subject: `Payment unsuccessful — ${referenceNumber} — Pangea Pay`,
    text: `Hi ${firstName},\n\nUnfortunately your payment of ${sendCurrency} ${sendAmount} (reference ${referenceNumber}) could not be completed${reason ? `: ${reason}` : ""}.\n\nPlease contact our support team if you need help.\n\nThe Pangea Pay team`,
    html: `
      <p>Hi ${firstName},</p>
      <p>Unfortunately your payment of <strong>${sendCurrency} ${sendAmount}</strong> (reference <strong>${referenceNumber}</strong>) could not be completed${reason ? `: ${reason}` : ""}.</p>
      <p>Please contact our support team if you need help.</p>
      <p>The Pangea Pay team</p>
    `,
  });
}

export async function sendOnboardingStatusEmail(
  to: string,
  firstName: string,
  status: "approved" | "rejected",
  reason?: string,
): Promise<void> {
  const transport = createTransport();
  const subject =
    status === "approved"
      ? "Your account has been approved — Pangea Pay"
      : "Update on your application — Pangea Pay";

  const text =
    status === "approved"
      ? `Hi ${firstName},\n\nGreat news — your identity verification has been approved and your account is now active. You can sign in and start sending money.\n\nThe Pangea Pay team`
      : `Hi ${firstName},\n\nWe were unable to verify your identity at this time${reason ? `: ${reason}` : ""}. Please contact support if you have questions.\n\nThe Pangea Pay team`;

  await transport.sendMail({ from: `Pangea Pay <${FROM}>`, to, subject, text });
}

export async function sendUserInvitationEmail(to: string, activationUrl: string, tempPassword: string): Promise<void> {
  const transport = createTransport();
  await transport.sendMail({
    from: `Pangea Pay <${FROM}>`,
    to,
    subject: "Your Pangea Pay account invitation",
    text: `You have been invited to Pangea Pay. Click the link below to activate your account within 48 hours.\n\n${activationUrl}\n\nTemporary password: ${tempPassword}\n\nYou will be required to change your password on first login.`,
    html: `
      <p>You have been invited to Pangea Pay.</p>
      <p><a href="${activationUrl}">Activate your account</a></p>
      <p>Temporary password: <strong>${tempPassword}</strong></p>
      <p>This link expires in 48 hours. You will be required to change your password on first login.</p>
    `,
  });
}
