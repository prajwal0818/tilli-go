/** Shared test constants */

export const API_URL = process.env.API_URL || 'http://localhost:3001';
export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export const TEST_PASSWORD = 'TestPass1234';

export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
}

export function uniqueName(): string {
  return `E2E User ${Date.now()}`;
}

export function uniqueProjectCode(): string {
  return `E2E${Date.now()}`.slice(0, 20);
}

export function uniqueProjectName(): string {
  return `E2E Project ${Date.now()}`;
}

export const TASK_STATUSES = ['Pending', 'Triggered', 'Acknowledged', 'Completed', 'Blocked'] as const;
export const SYSTEMS = ['FOL', 'SAP GW', 'Fiserv'] as const;

export type TaskStatusType = (typeof TASK_STATUSES)[number];

/**
 * Create a task and advance it through valid transitions to reach the target status.
 * Transition chain: Pending → Triggered → Acknowledged → Completed
 * Special: Pending → Blocked
 */
export async function createTaskAtStatus(
  apiHelper: import('./api.helper').ApiHelper,
  projectId: string,
  taskName: string,
  targetStatus: TaskStatusType,
): Promise<{ id: string; status: string; [key: string]: unknown }> {
  const task = await apiHelper.createTask(projectId, taskName);

  if (targetStatus === 'Pending') return task;

  if (targetStatus === 'Blocked') {
    return apiHelper.setTaskStatus(task.id, 'Blocked');
  }

  // Pending → Triggered
  const triggered = await apiHelper.setTaskStatus(task.id, 'Triggered');
  if (targetStatus === 'Triggered') return triggered;

  // Triggered → Acknowledged
  const acknowledged = await apiHelper.setTaskStatus(task.id, 'Acknowledged');
  if (targetStatus === 'Acknowledged') return acknowledged;

  // Acknowledged → Completed
  const completed = await apiHelper.setTaskStatus(task.id, 'Completed');
  return completed;
}
