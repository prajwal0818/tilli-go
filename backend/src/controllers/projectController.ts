import type { Request, Response, NextFunction } from 'express';
import * as projectService from '../services/projectService';
import type { ProjectFilterParams } from '../types';

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters: ProjectFilterParams = {
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
    };
    const result = await projectService.list(filters);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await projectService.getById(req.params.id as string);
    res.json(project);
  } catch (err) {
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await projectService.create(req.body);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await projectService.remove(req.params.id as string);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const removeMany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id: unknown) => typeof id === 'string')) {
      res.status(400).json({ error: 'ids must be a non-empty array of strings' });
      return;
    }
    const deleted = await projectService.removeMany(ids);
    res.json({ deleted });
  } catch (err) {
    next(err);
  }
};
