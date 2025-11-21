// Server-side email service helper. This file should NOT be imported into client-side bundles.
// Use it from Node scripts or serverless functions only.

type SendMailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export const sendEmail = async (opts: SendMailOptions) => {
  // Dynamically import nodemailer to avoid bundling it into the client app
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer');

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 465);
    const secure = (process.env.SMTP_SECURE || 'true') === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) throw new Error('Missing SMTP configuration in env');

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });

    const info = await transporter.sendMail({
      from: `EvoManager <${user}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html
    });

    return info;
  } catch (e) {
    console.error('sendEmail error', e);
    throw e;
  }
};
