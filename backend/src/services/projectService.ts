import prisma from '../config/prisma';
import logger from '../config/logger';
import { AppError } from '../utils/errors';
import type { Project } from '@prisma/client';
import type { CreateProjectDTO, ProjectFilterParams, PaginatedResponse } from '../types';

export async function list(filters: ProjectFilterParams = {}): Promise<PaginatedResponse<Project>> {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(filters.limit) || 100));
  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.project.count(),
  ]);

  return { data: projects, total, page, limit };
}

export async function getById(id: string): Promise<Project> {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  return project;
}

export async function create(data: CreateProjectDTO): Promise<Project> {
  const existing = await prisma.project.findUnique({ where: { code: data.code } });
  if (existing) {
    throw new AppError('Project code already exists', 409);
  }
  return prisma.project.create({ data });
}

export async function remove(id: string): Promise<void> {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Project not found', 404);
  }
  await prisma.project.delete({ where: { id } });
  logger.info({ projectId: id, projectCode: existing.code }, 'Project deleted');
}

export async function removeMany(ids: string[]): Promise<number> {
  const result = await prisma.project.deleteMany({ where: { id: { in: ids } } });
  logger.info({ count: result.count, ids }, 'Projects batch deleted');
  return result.count;
}
