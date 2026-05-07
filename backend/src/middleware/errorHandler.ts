import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../config/logger';
import { AppError } from '../utils/errors';

const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    logger.warn({ status: err.status, message: err.message }, 'App error');
    res.status(err.status).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const messages = err.issues.map((i) => i.message);
    res.status(400).json({ error: messages.join(', ') });
    return;
  }

  logger.error(err, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
};

export default errorHandler;
