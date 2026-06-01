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

/** Payload enqueued to email-queue by the task processor */
export interface EmailJobPayload {
  taskId: string;
  type?: 'triggered' | 'completion';
}

// ── Processor results ────────────────────────────────────────────────────────

export interface TaskProcessorResult {
  status: 'skipped' | 'triggered' | 'completion_enqueued';
  reason?: string;
  taskId?: string;
}

export interface EmailProcessorResult {
  status: 'skipped' | 'sent';
  reason?: string;
  messageId?: string;
}
