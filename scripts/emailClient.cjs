#!/usr/bin/env node
// Simple CLI to send a test email using SMTP settings from env
const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 465);
const secure = (process.env.SMTP_SECURE || 'true') === 'true';
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

if (!host || !user || !pass) {
  console.error('Missing SMTP configuration in env (SMTP_HOST, SMTP_USER, SMTP_PASS)');
  process.exit(1);
}

const to = process.env.TEST_EMAIL_TO || user;
const subject = process.env.TEST_EMAIL_SUBJECT || 'EvoManager - Test Email';
const text = process.env.TEST_EMAIL_TEXT || 'This is a test email from EvoManager emailClient.';

(async () => {
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });

    const info = await transporter.sendMail({
      from: `EvoManager <${user}>`,
      to,
      subject,
      text,
      html: `<p>${text}</p>`
    });

    console.log('Message sent:', info.messageId || info.response);
  } catch (e) {
    console.error('Failed to send test email:', e && e.message ? e.message : e);
    process.exit(2);
  }
})();
