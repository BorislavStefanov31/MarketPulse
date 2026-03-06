import { Resend } from "resend";
import { env } from "../config.js";

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resend = new Resend(env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `marketpulse://reset-password?token=${token}`;

  await getResend().emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: "Reset your MarketPulse password",
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Use the code below in the app, or tap the link:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${token}</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `,
  });
}
