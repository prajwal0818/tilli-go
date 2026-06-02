import app from './src/app';
import config from './src/config';
import logger from './src/config/logger';
import prisma from './src/config/prisma';
import * as scheduler from './src/services/schedulerService';
import * as queueService from './src/services/queueService';

const PORT = config.apiPort;
const SHUTDOWN_TIMEOUT_MS = 25_000;

const server = app.listen(PORT, () => {
  logger.info(`Tilli-go API running on port ${PORT}`);
  scheduler.start();
});

// Graceful shutdown with timeout
const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received — shutting down`);
  scheduler.stop();

  const forceExit = setTimeout(() => {
    logger.error('Shutdown timed out — forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  server.close(async () => {
    try {
      await queueService.close();
      await prisma.$disconnect();
      logger.info('Server closed');
    } finally {
      clearTimeout(forceExit);
      process.exit(0);
    }
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err: Error) => {
  logger.fatal(err, 'Uncaught exception — shutting down');
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (err: unknown) => {
  logger.error(err, 'Unhandled rejection');
});
