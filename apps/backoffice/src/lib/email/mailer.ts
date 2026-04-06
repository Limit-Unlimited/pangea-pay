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
