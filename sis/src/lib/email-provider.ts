import nodemailer from "nodemailer";

export type EmailSendResult = { providerMsgId: string };

export async function sendEmail(to: string, subject: string, html: string): Promise<EmailSendResult> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || "no-reply@example.com";

  if (!host || !user || !pass) {
    // Fallback dummy
    return { providerMsgId: `dummy-email-${Date.now()}` };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  const info = await transporter.sendMail({ from, to, subject, html });
  return { providerMsgId: info.messageId };
}

