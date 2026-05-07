import { Queue } from 'bullmq';
import config from '../config';
import logger from '../config/logger';
import type { TaskJobPayload, TaskJobInput, EmailJobPayload } from '../types';

// BullMQ manages its own connections internally — pass config, not a
// shared IORedis instance, so each Queue gets an independent connection.
const redisOpts = {
  host: config.redis.host,
  port: config.redis.port,
};

export const taskQueue = new Queue<TaskJobPayload>('task-queue', { connection: redisOpts });
export const emailQueue = new Queue<EmailJobPayload>('email-queue', { connection: redisOpts });

/**
 * Enqueue a task for the worker to transition Pending → Triggered.
 * jobId = task UUID so BullMQ silently de-duplicates if the same task
 * is pushed again before the worker picks it up.
 */
export async function addTaskJob(task: TaskJobInput): Promise<void> {
  const jobId = `task-trigger-${task.id}`;

  await taskQueue.add(
    'process-task',
    {
      taskId: task.id,
      taskName: task.taskName,
      system: task.system,
      assignedTeam: task.assignedTeam,
      assignedUserId: task.assignedUserId,
    },
    {
      jobId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 86400 },   // keep 24h
      removeOnFail: { age: 7 * 86400 },   // keep 7d
    }
  );

  logger.info({ jobId, taskId: task.id }, 'Task job enqueued');
}

/**
 * Enqueue an email for the worker to send.
 * Called by the worker's task-processor after transitioning a task,
 * NOT by the scheduler or API.
 */
export async function addEmailJob(data: EmailJobPayload): Promise<void> {
  const jobId = `email-${data.taskId}-${data.type || 'notify'}`;

  await emailQueue.add(
    'send-email',
    data,
    {
      jobId,
      attempts: 5,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 7 * 86400 },
    }
  );

  logger.info({ jobId, taskId: data.taskId }, 'Email job enqueued');
}

export async function close(): Promise<void> {
  await taskQueue.close();
  await emailQueue.close();
}
