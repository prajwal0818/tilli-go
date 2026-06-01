import { Job } from 'bullmq';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { canTaskExecute } from '../services/dependencyChecker';
import { addEmailJob } from '../services/emailProducer';
import type { TaskJobPayload, TaskProcessorResult } from '../types';

/**
 * task-queue processor.
 *
 * Handles two job names:
 *   - process-task:       Pending → Triggered + trigger email
 *   - process-completion: Acknowledged → completion email (no status change here)
 */
const processor = async (job: Job<TaskJobPayload>): Promise<TaskProcessorResult> => {
  if (job.name === 'process-completion') {
    return processCompletion(job);
  }
  return processTrigger(job);
};

/**
 * process-task: Pending → Triggered
 *
 * Flow:
 *   1. Fetch task from DB
 *   2. Idempotency: skip if not Pending
 *   3. Dependency check (worker layer — per CLAUDE.md)
 *   4. Transition status → Triggered
 *   5. Audit log
 *   6. Enqueue email job (email processor handles token signing + sending)
 */
async function processTrigger(job: Job<TaskJobPayload>): Promise<TaskProcessorResult> {
  const { taskId } = job.data;
  const log = logger.child({ jobId: job.id, taskId });

  log.info('Processing task job');

  // ── 1. Fetch task ────────────────────────────────────────────────────
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignedUser: { select: { id: true, email: true, name: true } },
    },
  });

  if (!task) {
    log.warn('Task not found in DB — skipping');
    return { status: 'skipped', reason: 'task_not_found' };
  }

  // ── 2. Idempotency ──────────────────────────────────────────────────
  if (task.status !== 'Pending') {
    log.info({ currentStatus: task.status }, 'Task already processed — skipping');
    return { status: 'skipped', reason: 'already_processed' };
  }

  // ── 3. Dependency check (worker layer) ───────────────────────────────
  const depCheck = await canTaskExecute(taskId);
  if (!depCheck.executable) {
    const blockers = depCheck.blockingTasks.map((t) => t.taskName).join(', ');
    log.warn({ blockers }, 'Dependencies not met — will retry');
    throw new Error(`Dependencies not met: ${blockers}`);
  }

  // ── 4. Transition Pending → Triggered ────────────────────────────────
  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'Triggered' },
  });

  // ── 5. Audit log ────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      taskId,
      action: 'UPDATED',
      field: 'status',
      oldValue: 'Pending',
      newValue: 'Triggered',
    },
  });

  log.info('Task status → Triggered');

  // ── 6. Enqueue email ────────────────────────────────────────────────
  // Only taskId is passed — the email processor fetches the task,
  // signs the ack token, and sends via nodemailer.
  await addEmailJob({ taskId, type: 'triggered' });

  return { status: 'triggered', taskId };
}

/**
 * process-completion: Send completion email for Acknowledged tasks.
 *
 * No status transition here — the user clicks the link to complete.
 */
async function processCompletion(job: Job<TaskJobPayload>): Promise<TaskProcessorResult> {
  const { taskId } = job.data;
  const log = logger.child({ jobId: job.id, taskId });

  log.info('Processing completion job');

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, status: true, taskName: true },
  });

  if (!task) {
    log.warn('Task not found in DB — skipping');
    return { status: 'skipped', reason: 'task_not_found' };
  }

  // Idempotency: only send completion email for Acknowledged tasks
  if (task.status !== 'Acknowledged') {
    log.info({ currentStatus: task.status }, 'Task not Acknowledged — skipping completion');
    return { status: 'skipped', reason: 'not_acknowledged' };
  }

  await addEmailJob({ taskId, type: 'completion' });

  log.info('Completion email job enqueued');
  return { status: 'completion_enqueued', taskId };
}

export = processor;
