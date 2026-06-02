import crypto from 'crypto';
import nodemailer from 'nodemailer';
import config from '../config';
import logger from '../config/logger';
import { sendEmailViaGraph } from './graphEmailService';

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
  return `${config.frontendUrl}/#/acknowledge?task_id=${taskId}&token=${token}`;
}

// ── HTML escaping ────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
    `<h2>Task Triggered: ${escapeHtml(task.taskName)}</h2>`,
    `<p><strong>System:</strong> ${escapeHtml(task.system)}</p>`,
    `<p><strong>Team:</strong> ${escapeHtml(task.assignedTeam || 'Unassigned')}</p>`,
    task.description
      ? `<p><strong>Description:</strong> ${escapeHtml(task.description)}</p>`
      : '',
    '<br/>',
    `<p><a href="${ackUrl}" style="padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:4px;">Acknowledge Task</a></p>`,
    `<p style="color:#666;font-size:12px;">Or copy this link: ${ackUrl}</p>`,
  ].join('\n');
}

// ── Completion email ────────────────────────────────────────────────────────

export function buildCompleteUrl(taskId: string): string {
  const token = signAckToken(taskId);
  return `${config.frontendUrl}/#/complete?task_id=${taskId}&token=${token}`;
}

function buildCompletionEmailHtml(task: TaskForEmail, completeUrl: string): string {
  return [
    `<h2>Task Ready for Completion: ${escapeHtml(task.taskName)}</h2>`,
    `<p><strong>System:</strong> ${escapeHtml(task.system)}</p>`,
    `<p><strong>Team:</strong> ${escapeHtml(task.assignedTeam || 'Unassigned')}</p>`,
    task.description
      ? `<p><strong>Description:</strong> ${escapeHtml(task.description)}</p>`
      : '',
    '<br/>',
    `<p><a href="${completeUrl}" style="padding:10px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:4px;">Complete Task</a></p>`,
    `<p style="color:#666;font-size:12px;">Or copy this link: ${completeUrl}</p>`,
  ].join('\n');
}

// ── Main interface ───────────────────────────────────────────────────────────

export interface EmailResult {
  messageId: string;
}

// ── Shared send logic ────────────────────────────────────────────────────────

async function sendMailInternal(
  to: string,
  subject: string,
  html: string,
  logLabel: string,
): Promise<EmailResult> {
  if (config.microsoft.mailEnabled) {
    const messageId = await sendEmailViaGraph(to, subject, html);
    return { messageId };
  }

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
    isMock ? `MOCK ${logLabel}` : logLabel,
  );

  return { messageId };
}

// ── Public API ──────────────────────────────────────────────────────────────

function resolveRecipient(task: TaskForEmail): string {
  return (
    task.assignedUser?.email ||
    `${task.assignedTeam || config.email.fallbackTeam}@${config.email.domain}`
  );
}

export async function sendEmail(task: TaskForEmail): Promise<EmailResult> {
  const to = resolveRecipient(task);
  const subject = `[Tilli-go] Task triggered: ${task.taskName}`;
  const ackUrl = buildAckUrl(task.id);
  const html = buildTaskEmailHtml(task, ackUrl);
  return sendMailInternal(to, subject, html, 'EMAIL SENT');
}

export async function sendCompletionEmail(task: TaskForEmail): Promise<EmailResult> {
  const to = resolveRecipient(task);
  const subject = `[Tilli-go] Task ready for completion: ${task.taskName}`;
  const completeUrl = buildCompleteUrl(task.id);
  const html = buildCompletionEmailHtml(task, completeUrl);
  return sendMailInternal(to, subject, html, 'COMPLETION EMAIL SENT');
}

export { transporter };
