import 'dotenv/config';
import logger from './src/config/logger';
import prisma from './src/config/prisma';
import { taskWorker } from './src/queues/taskQueue';
import { emailWorker } from './src/queues/emailQueue';
import * as emailProducer from './src/services/emailProducer';

logger.info('Tilli-go worker started');
logger.info(
  { queues: ['task-queue', 'email-queue'] },
  'Listening for jobs'
);

// Graceful shutdown with 25s timeout (Docker sends SIGKILL after 30s)
const SHUTDOWN_TIMEOUT_MS = 25_000;

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received — shutting down worker`);

  const forceExit = setTimeout(() => {
    logger.error('Shutdown timed out — forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    await Promise.all([
      taskWorker.close(),
      emailWorker.close(),
      emailProducer.close(),
    ]);
    await prisma.$disconnect();
    logger.info('Worker shut down cleanly');
    process.exit(0);
  } catch (err: unknown) {
    logger.error(err, 'Error during worker shutdown');
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err: Error) => {
  logger.fatal(err, 'Uncaught exception in worker — shutting down');
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (err: unknown) => {
  logger.error(err, 'Unhandled rejection in worker');
});
