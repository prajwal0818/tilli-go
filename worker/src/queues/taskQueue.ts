import { Worker, type Job } from 'bullmq';
import connection from '../config/redis';
import logger from '../config/logger';
import taskProcessor from '../processors/taskProcessor';
import type { TaskJobPayload, TaskProcessorResult } from '../types';

export const taskWorker = new Worker<TaskJobPayload, TaskProcessorResult>(
  'task-queue',
  taskProcessor,
  { connection, concurrency: 5 },
);

taskWorker.on('completed', (job: Job<TaskJobPayload, TaskProcessorResult>, result: TaskProcessorResult) => {
  logger.info(
    { jobId: job.id, taskId: job.data.taskId, result },
    'Task job completed',
  );
});

taskWorker.on('failed', (job: Job<TaskJobPayload, TaskProcessorResult> | undefined, err: Error) => {
  const maxAttempts = job?.opts?.attempts ?? 3;
  const isFinal = (job?.attemptsMade ?? 0) >= maxAttempts;

  logger.error(
    {
      jobId: job?.id,
      taskId: job?.data?.taskId,
      err: err.message,
      attempts: job?.attemptsMade,
      final: isFinal,
    },
    isFinal ? 'Task job permanently failed — no more retries' : 'Task job failed',
  );
});
