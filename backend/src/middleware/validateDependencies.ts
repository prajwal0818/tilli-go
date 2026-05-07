import type { Request, Response, NextFunction } from 'express';
import { canTaskExecute } from '../services/dependencyService';
import { STATUS_REQUIRES_DEPS_MET } from '../types';

/**
 * Express middleware — runs at the API layer BEFORE the controller.
 * If the request is advancing a task to a status that requires dependency
 * completion, this middleware checks and rejects early with a 400.
 */
const validateDependencies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const targetStatus = req.body?.status as string | undefined;

  // Only intercept status-advancing requests
  if (!targetStatus || !STATUS_REQUIRES_DEPS_MET.has(targetStatus as never)) {
    next();
    return;
  }

  const taskId = req.params.id as string | undefined;
  if (!taskId) {
    next();
    return;
  }

  try {
    const result = await canTaskExecute(taskId);

    if (!result.executable) {
      res.status(400).json({
        error: 'Dependencies not satisfied',
        blockedBy: result.blockingTasks,
      });
      return;
    }

    // Attach to req so the service layer can skip re-querying
    req.dependencyCheck = result;
    next();
  } catch (err) {
    next(err);
  }
};

export default validateDependencies;
