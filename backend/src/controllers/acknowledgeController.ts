import type { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { verifyAckToken } from '../utils/token';
import { canTaskExecute } from '../services/dependencyService';
import type { AcknowledgeSuccessResponse } from '../types';

export const acknowledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.query.task_id as string | undefined;
    const token = req.query.token as string | undefined;

    if (!taskId || !token) {
      res.status(400).json({ error: 'Missing task_id or token' });
      return;
    }

    // 1. Verify token
    try {
      verifyAckToken(taskId, token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ taskId, reason: message }, 'Ack token rejected');
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
        actualStartTime: true,
      },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // 3. Idempotency — already acknowledged or further along
    if (task.status === 'Acknowledged' || task.status === 'Completed') {
      const body: AcknowledgeSuccessResponse = {
        message: `Task already ${task.status.toLowerCase()}`,
        taskId: task.id,
        taskName: task.taskName,
        status: task.status,
        actualStartTime: task.actualStartTime,
      };
      res.status(200).json(body);
      return;
    }

    // Only Triggered tasks can be acknowledged
    if (task.status !== 'Triggered') {
      res.status(409).json({
        error: `Cannot acknowledge — task is ${task.status}`,
        currentStatus: task.status,
      });
      return;
    }

    // 3b. Dependency gate — re-verify dependencies haven't reverted
    const depCheck = await canTaskExecute(taskId);
    if (!depCheck.executable) {
      const blockers = depCheck.blockingTasks
        .map((t) => `${t.taskName} (${t.status})`)
        .join(', ');
      logger.warn({ taskId, blockers }, 'Ack blocked — dependencies not met');
      res.status(409).json({
        error: `Cannot acknowledge — dependencies not completed: ${blockers}`,
        blockingTasks: depCheck.blockingTasks,
      });
      return;
    }

    // 4. Transition + audit in a transaction
    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'Acknowledged',
          actualStartTime: now,
        },
      });

      await tx.auditLog.createMany({
        data: [
          {
            taskId,
            action: 'UPDATED',
            field: 'status',
            oldValue: 'Triggered',
            newValue: 'Acknowledged',
          },
          {
            taskId,
            action: 'UPDATED',
            field: 'actualStartTime',
            oldValue: null,
            newValue: now.toISOString(),
          },
        ],
      });

      return result;
    });

    logger.info({ taskId, taskName: task.taskName }, 'Task acknowledged');

    const body: AcknowledgeSuccessResponse = {
      message: 'Task acknowledged successfully',
      taskId: updated.id,
      taskName: updated.taskName,
      status: updated.status,
      actualStartTime: updated.actualStartTime,
    };
    res.status(200).json(body);
  } catch (err) {
    next(err);
  }
};
