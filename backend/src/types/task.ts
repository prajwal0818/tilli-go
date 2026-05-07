/**
 * Task domain types.
 *
 * TaskStatus uses "const object + type" pattern instead of a TS enum because:
 *   1. Const objects are plain JS at runtime — no enum reverse-mapping bloat
 *   2. They work as both values (TaskStatus.Pending) and types (status: TaskStatus)
 *   3. They survive tree-shaking and are compatible with Zod/Prisma string unions
 */

import type {
  Task as PrismaTask,
  User as PrismaUser,
  Project as PrismaProject,
  TaskDependency as PrismaTaskDependency,
  AuditLog as PrismaAuditLog,
} from '@prisma/client';

// ── Re-exports of Prisma base models ────────────────────────────────────────
// Consumers should import from here, not directly from @prisma/client.
export type { PrismaTask, PrismaUser, PrismaProject, PrismaTaskDependency, PrismaAuditLog };

// ── TaskStatus ──────────────────────────────────────────────────────────────

export const TaskStatus = {
  Pending: 'Pending',
  Triggered: 'Triggered',
  Acknowledged: 'Acknowledged',
  Completed: 'Completed',
  Blocked: 'Blocked',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const VALID_STATUSES = [
  TaskStatus.Pending,
  TaskStatus.Triggered,
  TaskStatus.Acknowledged,
  TaskStatus.Completed,
  TaskStatus.Blocked,
] as const;

/**
 * Allowed status transitions.
 * Key = current status, Value = set of statuses it can transition to.
 * Completed has an empty set — it's an absorbing state.
 */
export const ALLOWED_TRANSITIONS: Readonly<Record<TaskStatus, ReadonlySet<TaskStatus>>> = {
  [TaskStatus.Pending]: new Set<TaskStatus>([TaskStatus.Triggered, TaskStatus.Blocked]),
  [TaskStatus.Blocked]: new Set<TaskStatus>([TaskStatus.Pending]),
  [TaskStatus.Triggered]: new Set<TaskStatus>([TaskStatus.Acknowledged]),
  [TaskStatus.Acknowledged]: new Set<TaskStatus>([TaskStatus.Completed]),
  [TaskStatus.Completed]: new Set<TaskStatus>(),
};

/**
 * Statuses that require ALL dependencies to be Completed before entry.
 * Used by: API middleware, service layer, scheduler, worker, acknowledge endpoint.
 */
export const STATUS_REQUIRES_DEPS_MET: ReadonlySet<TaskStatus> = new Set<TaskStatus>([
  TaskStatus.Triggered,
  TaskStatus.Acknowledged,
]);

// ── Task DTOs ───────────────────────────────────────────────────────────────

/** Input for creating a new task (matches Zod createTaskSchema output) */
export interface CreateTaskDTO {
  system: string;
  taskName: string;
  description?: string | null;
  assignedTeam?: string | null;
  assignedUserId?: string | null;
  plannedStartTime?: Date | null;
  plannedEndTime?: Date | null;
  notes?: string | null;
  projectId: string;
  dependencies?: string[];
}

/**
 * Input for updating an existing task (matches Zod updateTaskSchema output).
 * projectId is deliberately absent — it's immutable after creation.
 */
export interface UpdateTaskDTO {
  system?: string;
  taskName?: string;
  description?: string | null;
  assignedTeam?: string | null;
  assignedUserId?: string | null;
  plannedStartTime?: Date | null;
  plannedEndTime?: Date | null;
  notes?: string | null;
  status?: TaskStatus;
  dependencies?: string[];
}

/** Query parameters for listing tasks */
export interface TaskFilterParams {
  status?: string;
  system?: string;
  assignedUserId?: string;
  projectId?: string;
  page?: string | number;
  limit?: string | number;
}

// ── Task Response (API shape) ───────────────────────────────────────────────

/** User summary included on task responses */
export interface TaskAssignedUser {
  id: string;
  name: string;
  email: string;
}

/** Project summary included on task responses */
export interface TaskProjectRef {
  id: string;
  code: string;
  name: string;
}

/**
 * Task as returned by the API after formatTask().
 * Relations are eagerly loaded and dependencies are flattened to ID arrays.
 */
export interface TaskResponse {
  id: string;
  system: string;
  taskName: string;
  description: string | null;
  assignedTeam: string | null;
  assignedUserId: string | null;
  plannedStartTime: Date | null;
  plannedEndTime: Date | null;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  status: string;
  notes: string | null;
  projectId: string;
  sequenceNumber: number;
  createdAt: Date;
  updatedAt: Date;
  dependencies: string[];
  assignedUser: TaskAssignedUser | null;
  project: TaskProjectRef;
}

// ── Prisma include shape ────────────────────────────────────────────────────
// Matches the TASK_INCLUDE constant in taskService — typed so Prisma infers
// the correct return shape.

export const TASK_INCLUDE = {
  dependsOn: {
    select: { dependsOnTaskId: true },
  },
  assignedUser: {
    select: { id: true, name: true, email: true },
  },
  project: {
    select: { id: true, code: true, name: true },
  },
} as const;

/** Raw Prisma result when using TASK_INCLUDE */
export interface TaskWithIncludes extends PrismaTask {
  dependsOn: Array<{ dependsOnTaskId: string }>;
  assignedUser: TaskAssignedUser | null;
  project: TaskProjectRef;
}

// ── Dependency types ────────────────────────────────────────────────────────

/** A dependency task that is blocking execution */
export interface BlockingTask {
  id: string;
  taskName: string;
  status: string;
}

/** Result from canTaskExecute() — used across all 4 validation layers */
export interface DependencyCheckResult {
  executable: boolean;
  blockingTasks: BlockingTask[];
}

/** A task that depends ON a given task (downstream impact) */
export interface DependerTask {
  id: string;
  taskName: string;
  status: string;
}

/** Full dependency status returned by GET /tasks/:id/dependencies */
export interface DependencyStatusResponse {
  taskId: string;
  executable: boolean;
  blockingTasks: BlockingTask[];
  dependedOnBy: DependerTask[];
}

// ── Audit types ─────────────────────────────────────────────────────────────

export type AuditAction = 'CREATED' | 'UPDATED' | 'DELETED';

/** Shape for creating an audit log entry (Prisma create data) */
export interface CreateAuditLogEntry {
  taskId: string;
  action: AuditAction;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  userId?: string | null;
}

// ── Service-layer option types ──────────────────────────────────────────────

/** Options passed to taskService.create() */
export interface CreateTaskOptions {
  userId?: string | null;
}

/**
 * Options passed to taskService.update().
 * dependencyPreChecked: set true when API middleware already validated deps,
 * so the service skips the redundant DB query.
 */
export interface UpdateTaskOptions {
  dependencyPreChecked?: boolean;
  userId?: string | null;
}
