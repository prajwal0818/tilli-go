/**
 * Payload enqueued to task-queue by the scheduler.
 * Contains denormalized task fields so the worker can log
 * context without an immediate DB fetch.
 */
export interface TaskJobPayload {
  taskId: string;
  taskName: string;
  system: string;
  assignedTeam: string | null;
  assignedUserId: string | null;
}

/**
 * Input accepted by addTaskJob — a task-like object with `id`
 * (the DB primary key), mapped to `taskId` in the job payload.
 */
export interface TaskJobInput {
  id: string;
  taskName: string;
  system: string;
  assignedTeam: string | null;
  assignedUserId: string | null;
}

/** Payload enqueued to email-queue by the task processor */
export interface EmailJobPayload {
  taskId: string;
  type: 'triggered';
}

// ── Scheduler ───────────────────────────────────────────────────────────────

/** Stats exposed by GET /scheduler/status */
export interface SchedulerStats {
  lastRunAt: string | null;
  lastRunDurationMs: number | null;
  tasksEnqueued: number;
  tasksBlocked: number;
  tasksUnblocked: number;
  errors: number;
  running: boolean;
}
