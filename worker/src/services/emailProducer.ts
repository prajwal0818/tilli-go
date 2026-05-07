import { Queue } from 'bullmq';
import config from '../config';
import logger from '../config/logger';
import type { EmailJobPayload } from '../types';

const emailQueue = new Queue<EmailJobPayload>('email-queue', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

export async function addEmailJob(data: EmailJobPayload): Promise<void> {
  const jobId = `email-${data.taskId}-triggered`;

  await emailQueue.add('send-email', data, {
    jobId,
    attempts: 5,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 7 * 86400 },
  });

  logger.info({ jobId, taskId: data.taskId }, 'Email job enqueued by worker');
}

export async function close(): Promise<void> {
  await emailQueue.close();
}
