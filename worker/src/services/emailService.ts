import crypto from 'crypto';
import nodemailer from 'nodemailer';
import config from '../config';
import logger from '../config/logger';

// ── Transport ────────────────────────────────────────────────────────────────
// Real SMTP when credentials are configured, otherwise jsonTransport mock.
const transporter = config.smtp.host && config.smtp.user
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    })
  : nodemailer.createTransport({ jsonTransport: true });

const isMock = !config.smtp.host || !config.smtp.user;

// ── Signed acknowledgement tokens (HMAC-SHA256) ─────────────────────────────

export function signAckToken(taskId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      taskId,
      exp: Date.now() + config.ackTokenExpiryMs,
    }),
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', config.ackTokenSecret)
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

export function buildAckUrl(taskId: string): string {
  const token = signAckToken(taskId);
  return `${config.frontendUrl}/acknowledge?task_id=${taskId}&token=${token}`;
}

// ── Email building ───────────────────────────────────────────────────────────

interface TaskForEmail {
  id: string;
  taskName: string;
  system: string;
  description: string | null;
  assignedTeam: string | null;
  assignedUser: { id: string; email: string; name: string } | null;
}

function buildTaskEmailHtml(task: TaskForEmail, ackUrl: string): string {
  return [
    `<h2>Task Triggered: ${task.taskName}</h2>`,
    `<p><strong>System:</strong> ${task.system}</p>`,
    `<p><strong>Team:</strong> ${task.assignedTeam || 'Unassigned'}</p>`,
    task.description
      ? `<p><strong>Description:</strong> ${task.description}</p>`
      : '',
    '<br/>',
    `<p><a href="${ackUrl}" style="padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:4px;">Acknowledge Task</a></p>`,
    `<p style="color:#666;font-size:12px;">Or copy this link: ${ackUrl}</p>`,
  ].join('\n');
}

// ── Main interface ───────────────────────────────────────────────────────────

export interface EmailResult {
  messageId: string;
}

export async function sendEmail(task: TaskForEmail): Promise<EmailResult> {
  const to =
    task.assignedUser?.email ||
    `${task.assignedTeam || config.email.fallbackTeam}@${config.email.domain}`;
  const subject = `[DeployFlow] Task triggered: ${task.taskName}`;
  const ackUrl = buildAckUrl(task.id);
  const html = buildTaskEmailHtml(task, ackUrl);

  const fromAddress = config.email.fromAddress || `noreply@${config.email.domain}`;
  const info = await transporter.sendMail({
    from: `"${config.email.fromName}" <${fromAddress}>`,
    to,
    subject,
    html,
  });

  const messageId: string = isMock
    ? info.messageId || `mock-${Date.now()}`
    : info.messageId;

  logger.info(
    { to, subject, messageId, mock: isMock },
    isMock ? 'MOCK EMAIL SENT' : 'EMAIL SENT',
  );

  return { messageId };
}

export { transporter };
