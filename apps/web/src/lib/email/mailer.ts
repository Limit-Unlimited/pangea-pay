import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST  ?? "localhost",
  port:   parseInt(process.env.SMTP_PORT ?? "1025", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth:   process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

const FROM = process.env.SMTP_FROM ?? "Pangea Pay <no-reply@pangea.pay>";

export async function sendEmailVerificationOtp(email: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: "Verify your email — Pangea Pay",
    text:    `Your verification code is: ${otp}\n\nThis code expires in 15 minutes.`,
    html: `
      <p>Your Pangea Pay verification code is:</p>
      <h2 style="letter-spacing:0.15em;font-size:32px;">${otp}</h2>
      <p>This code expires in 15 minutes. Do not share it with anyone.</p>
    `,
  });
}

export async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: "Welcome to Pangea Pay",
    text:    `Hi ${firstName},\n\nYour email has been verified. You can now complete your profile and identity verification.\n\nThe Pangea Pay team`,
    html: `
      <p>Hi ${firstName},</p>
      <p>Your email has been verified. You can now complete your profile and identity verification to activate your account.</p>
      <p>The Pangea Pay team</p>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: "Reset your password — Pangea Pay",
    text:    `You requested a password reset.\n\nClick the link below to set a new password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}" style="color:#1E4D8C;font-weight:bold;">Reset your password</a></p>
      <p>This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>
    `,
  });
}

export async function sendOnboardingStatusEmail(
  email: string,
  firstName: string,
  status: "approved" | "rejected",
  reason?: string
): Promise<void> {
  const subject =
    status === "approved"
      ? "Your account has been approved — Pangea Pay"
      : "Update on your application — Pangea Pay";

  const body =
    status === "approved"
      ? `Hi ${firstName},\n\nGreat news — your identity verification has been approved and your account is now active. You can sign in and start sending money.\n\nThe Pangea Pay team`
      : `Hi ${firstName},\n\nWe were unable to verify your identity at this time${reason ? `: ${reason}` : ""}. Please contact support if you have questions.\n\nThe Pangea Pay team`;

  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject,
    text:    body,
  });
}
