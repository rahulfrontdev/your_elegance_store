const nodemailer = require('nodemailer');

let transporterPromise = null;

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_FROM
  );
}

async function getTransporter() {
  if (!smtpConfigured()) {
    return null;
  }

  if (!transporterPromise) {
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure =
      process.env.SMTP_SECURE === 'false' ? false : port === 465 || process.env.SMTP_SECURE === 'true';

    transporterPromise = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporterPromise;
}

function mailFromAddress() {
  const address = String(process.env.MAIL_FROM || process.env.SMTP_USER || '').trim();
  const name = String(process.env.MAIL_FROM_NAME || 'Your Elegance Store').trim();
  return name ? `"${name}" <${address}>` : address;
}

async function sendMail({ to, subject, text, html }) {
  if (!to || !subject) {
    throw new Error('Email recipient and subject are required');
  }

  const transporter = await getTransporter();
  if (!transporter) {
    console.warn('[mail] SMTP is not configured — email not sent:', subject, '→', to);
    return { ok: false, skipped: true };
  }

  const info = await transporter.sendMail({
    from: mailFromAddress(),
    to,
    replyTo: process.env.MAIL_REPLY_TO || process.env.MAIL_FROM || undefined,
    subject,
    text,
    html,
  });

  return { ok: true, messageId: info.messageId };
}

function passwordResetEmailHtml({ name, resetUrl }) {
  const safeName = name ? String(name).trim() : 'there';
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 16px;">Reset your password</h2>
      <p>Hi ${safeName},</p>
      <p>We received a request to reset the password for your Your Elegance Store account.</p>
      <p style="margin:28px 0;">
        <a href="${resetUrl}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600;">
          Reset password
        </a>
      </p>
      <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
      <p style="word-break:break-all;color:#555;font-size:13px;">${resetUrl}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="font-size:12px;color:#666;">Your Elegance Store · info@yourelegancestore.com</p>
    </div>
  `.trim();
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const subject = 'Reset your Your Elegance Store password';
  const text = [
    `Hi ${name || 'there'},`,
    '',
    'We received a request to reset your password.',
    `Open this link to choose a new password (expires in 1 hour):`,
    resetUrl,
    '',
    'If you did not request this, ignore this email.',
  ].join('\n');

  return sendMail({
    to,
    subject,
    text,
    html: passwordResetEmailHtml({ name, resetUrl }),
  });
}

module.exports = {
  smtpConfigured,
  sendMail,
  sendPasswordResetEmail,
};
