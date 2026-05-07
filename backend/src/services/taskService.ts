import type { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { AppError } from '../utils/errors';
import { setDependencies, assertDependenciesMet } from './dependencyService';
import {
  TASK_INCLUDE,
  ALLOWED_TRANSITIONS,
  STATUS_REQUIRES_DEPS_MET,
  TaskStatus,
} from '../types';
import type {
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskFilterParams,
  TaskResponse,
  TaskWithIncludes,
  PaginatedResponse,
  AuditAction,
  CreateAuditLogEntry,
  CreateTaskOptions,
  UpdateTaskOptions,
} from '../types';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatTask(task: TaskWithIncludes): TaskResponse {
  const { dependsOn, ...rest } = task;
  return {
    ...rest,
    dependencies: dependsOn.map((d) => d.dependsOnTaskId),
  };
}

function validateStatusTransition(current: string, next: string): void {
  if (current === next) return;

  const allowed = ALLOWED_TRANSITIONS[current as TaskStatus];
  if (!allowed || !allowed.has(next as TaskStatus)) {
    throw new AppError(`Invalid status transition: ${current} -> ${next}`, 400);
  }
}

async function writeAuditLog(
  taskId: string,
  action: AuditAction,
  field: string | null,
  oldValue: string | null,
  newValue: string | null,
  userId: string | null = null,
): Promise<void> {
  await prisma.auditLog.create({
    data: { taskId, action, field, oldValue, newValue, userId },
  });
}

// ── List ────────────────────────────────────────────────────────────────────

async function list(filters: TaskFilterParams = {}): Promise<PaginatedResponse<TaskResponse>> {
  const where: Prisma.TaskWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.system) {
    where.system = filters.system;
  }
  if (filters.assignedUserId) {
    where.assignedUserId = filters.assignedUserId;
  }
  if (filters.projectId) {
    where.projectId = filters.projectId;
  }

  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(500, Math.max(1, Number(filters.limit) || 100));
  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy: { sequenceNumber: 'asc' },
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return { data: (tasks as TaskWithIncludes[]).map(formatTask), total, page, limit };
}

// ── Get by ID ───────────────────────────────────────────────────────────────

async function getById(id: string): Promise<TaskResponse> {
  const task = await prisma.task.findUnique({
    where: { id },
    include: TASK_INCLUDE,
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  return formatTask(task as TaskWithIncludes);
}

// ── Create ──────────────────────────────────────────────────────────────────

async function create(data: CreateTaskDTO, opts: CreateTaskOptions = {}): Promise<TaskResponse> {
  const { dependencies, ...taskData } = data;
  const userId = opts.userId ?? null;

  if (!taskData.projectId) {
    throw new AppError('projectId is required', 400);
  }

  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: taskData.projectId },
  });
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Generate sequenceNumber atomically within a transaction
  const task = await prisma.$transaction(async (tx) => {
    const lastTask = await tx.task.findFirst({
      where: { projectId: taskData.projectId },
      orderBy: { sequenceNumber: 'desc' },
    });

    const nextSeq = (lastTask?.sequenceNumber ?? 0) + 1;

    return tx.task.create({
      data: {
        ...taskData,
        sequenceNumber: nextSeq,
      },
      include: TASK_INCLUDE,
    });
  });

  await writeAuditLog(task.id, 'CREATED', null, null, null, userId);

  if (dependencies && dependencies.length > 0) {
    await setDependencies(task.id, dependencies);
    await writeAuditLog(
      task.id,
      'UPDATED',
      'dependencies',
      null,
      dependencies.join(','),
      userId,
    );
    return getById(task.id);
  }

  return formatTask(task as TaskWithIncludes);
}

// ── Update ──────────────────────────────────────────────────────────────────

async function update(id: string, data: UpdateTaskDTO, opts: UpdateTaskOptions = {}): Promise<TaskResponse> {
  const existing = await prisma.task.findUnique({
    where: { id },
    include: TASK_INCLUDE,
  });

  if (!existing) {
    throw new AppError('Task not found', 404);
  }

  if (existing.status === TaskStatus.Completed) {
    throw new AppError('Cannot modify a completed task', 400);
  }

  const { dependencies, ...taskFields } = data;

  // Defense-in-depth: reject projectId changes even if they somehow bypass Zod
  const rawData = data as Record<string, unknown>;
  if ('projectId' in rawData && rawData['projectId'] !== existing.projectId) {
    throw new AppError('Cannot change projectId after task creation', 400);
  }

  // Validate status transition
  if (taskFields.status && taskFields.status !== existing.status) {
    validateStatusTransition(existing.status, taskFields.status);

    // Defense-in-depth: verify dependency completion for advancing statuses.
    // The API middleware already checks, but the service layer must enforce
    // independently (scheduler and worker also call this service).
    if (STATUS_REQUIRES_DEPS_MET.has(taskFields.status)) {
      // Skip re-query if middleware already validated
      if (!opts.dependencyPreChecked) {
        await assertDependenciesMet(id);
      }
    }
  }

  const userId = opts.userId ?? null;

  // Build audit entries for changed fields.
  // Uses Record cast because we're iterating dynamic keys — the type system
  // can't statically verify which properties we're comparing, but at runtime
  // these are always valid Task field names from the validated UpdateTaskDTO.
  const existingRecord = existing as unknown as Record<string, unknown>;
  const auditEntries: CreateAuditLogEntry[] = [];

  for (const [key, value] of Object.entries(taskFields)) {
    const oldVal = existingRecord[key];
    if (oldVal !== value && value !== undefined) {
      auditEntries.push({
        taskId: id,
        action: 'UPDATED',
        field: key,
        oldValue: oldVal == null ? null : String(oldVal),
        newValue: value == null ? null : String(value),
        userId,
      });
    }
  }

  // Apply update + audit in a transaction
  const hasFieldUpdates = Object.keys(taskFields).length > 0;

  await prisma.$transaction(async (tx) => {
    if (hasFieldUpdates) {
      await tx.task.update({ where: { id }, data: taskFields as Prisma.TaskUpdateInput });
    }
    if (auditEntries.length > 0) {
      await tx.auditLog.createMany({ data: auditEntries });
    }
  });

  // Handle dependency changes outside the transaction (has its own)
  if (dependencies !== undefined) {
    const oldDeps = (existing as TaskWithIncludes).dependsOn.map((d) => d.dependsOnTaskId).sort();
    const newDeps = [...dependencies].sort();
    const changed =
      oldDeps.length !== newDeps.length ||
      oldDeps.some((v, i) => v !== newDeps[i]);

    if (changed) {
      await setDependencies(id, dependencies);
      await writeAuditLog(
        id,
        'UPDATED',
        'dependencies',
        oldDeps.join(',') || null,
        newDeps.join(',') || null,
        userId,
      );
    }
  }

  return getById(id);
}

// ── Delete ──────────────────────────────────────────────────────────────────

async function remove(id: string): Promise<void> {
  const existing = await prisma.task.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('Task not found', 404);
  }

  await prisma.task.delete({ where: { id } });

  logger.info({ taskId: id }, 'Task deleted');
}

export { list, getById, create, update, remove };
