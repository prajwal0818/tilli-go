import type { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/taskService';
import { canTaskExecute, getDependers } from '../services/dependencyService';
import type { TaskFilterParams, DependencyStatusResponse } from '../types';

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters: TaskFilterParams = {
      status: req.query.status as string | undefined,
      system: req.query.system as string | undefined,
      assignedUserId: req.query.assignedUserId as string | undefined,
      projectId: req.query.projectId as string | undefined,
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
    };
    const result = await taskService.list(filters);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await taskService.getById(req.params.id as string);
    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.body.projectId) {
      res.status(400).json({ error: 'projectId is required' });
      return;
    }
    const task = await taskService.create(req.body, { userId: req.user?.id ?? null });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // If the API middleware already validated dependencies, tell the
    // service layer so it can skip the redundant DB query.
    const opts = {
      dependencyPreChecked: !!req.dependencyCheck,
      userId: req.user?.id ?? null,
    };
    const task = await taskService.update(req.params.id as string, req.body, opts);
    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await taskService.remove(req.params.id as string);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// GET /tasks/:id/dependencies — full dependency status for a task
export const getDependencyStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id as string;

    // Verify task exists
    await taskService.getById(taskId);

    const executionCheck = await canTaskExecute(taskId);
    const dependers = await getDependers(taskId);

    const response: DependencyStatusResponse = {
      taskId,
      ...executionCheck,
      dependedOnBy: dependers,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
};
