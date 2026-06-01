import type { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { verifyAckToken } from '../utils/token';
import type { CompleteSuccessResponse } from '../types';

export const complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.query.task_id as string | undefined;
    const token = req.query.token as string | undefined;

    if (!taskId || !token) {
      res.status(400).json({ error: 'Missing task_id or token' });
      return;
    }

    // 1. Verify token (same HMAC scheme as acknowledge)
    try {
      verifyAckToken(taskId, token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ taskId, reason: message }, 'Complete token rejected');
      res.status(403).json({ error: message });
      return;
    }

    // 2. Fetch task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        status: true,
        taskName: true,
        actualEndTime: true,
      },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // 3. Idempotency — already completed
    if (task.status === 'Completed') {
      const body: CompleteSuccessResponse = {
        message: 'Task already completed',
        taskId: task.id,
        taskName: task.taskName,
        status: task.status,
        actualEndTime: task.actualEndTime,
      };
      res.status(200).json(body);
      return;
    }

    // Only Acknowledged tasks can be completed via this endpoint
    if (task.status !== 'Acknowledged') {
      res.status(409).json({
        error: `Cannot complete — task is ${task.status}`,
        currentStatus: task.status,
      });
      return;
    }

    // 4. Transition + audit in a transaction
    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'Completed',
          actualEndTime: now,
        },
      });

      await tx.auditLog.createMany({
        data: [
          {
            taskId,
            action: 'UPDATED',
            field: 'status',
            oldValue: 'Acknowledged',
            newValue: 'Completed',
          },
          {
            taskId,
            action: 'UPDATED',
            field: 'actualEndTime',
            oldValue: null,
            newValue: now.toISOString(),
          },
        ],
      });

      return result;
    });

    logger.info({ taskId, taskName: task.taskName }, 'Task completed via email link');

    const body: CompleteSuccessResponse = {
      message: 'Task completed successfully',
      taskId: updated.id,
      taskName: updated.taskName,
      status: updated.status,
      actualEndTime: updated.actualEndTime,
    };
    res.status(200).json(body);
  } catch (err) {
    next(err);
  }
};
