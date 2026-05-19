import app from './src/app';
import config from './src/config';
import logger from './src/config/logger';
import prisma from './src/config/prisma';
import * as scheduler from './src/services/schedulerService';
import * as queueService from './src/services/queueService';

const PORT = config.apiPort;

const server = app.listen(PORT, () => {
  logger.info(`Tilli-go API running on port ${PORT}`);
  scheduler.start();
});

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received — shutting down`);
  scheduler.stop();
  server.close(async () => {
    await queueService.close();
    await prisma.$disconnect();
    logger.info('Server closed');
    process.exit(0);
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
