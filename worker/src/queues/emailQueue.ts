import { Worker, type Job } from 'bullmq';
import connection from '../config/redis';
import logger from '../config/logger';
import emailProcessor from '../processors/emailProcessor';
import type { EmailJobPayload, EmailProcessorResult } from '../types';

export const emailWorker = new Worker<EmailJobPayload, EmailProcessorResult>(
  'email-queue',
  emailProcessor,
  { connection, concurrency: 3 },
);

emailWorker.on('completed', (job: Job<EmailJobPayload, EmailProcessorResult>, result: EmailProcessorResult) => {
  logger.info(
    { jobId: job.id, taskId: job.data.taskId, result },
    'Email job completed',
  );
});

emailWorker.on('failed', (job: Job<EmailJobPayload, EmailProcessorResult> | undefined, err: Error) => {
  const maxAttempts = job?.opts?.attempts ?? 5;
  const isFinal = (job?.attemptsMade ?? 0) >= maxAttempts;

  logger.error(
    {
      jobId: job?.id,
      taskId: job?.data?.taskId,
      err: err.message,
      attempts: job?.attemptsMade,
      final: isFinal,
    },
    isFinal ? 'Email job permanently failed — no more retries' : 'Email job failed',
  );
});
