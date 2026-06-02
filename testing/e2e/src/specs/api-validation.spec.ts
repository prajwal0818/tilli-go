import { test, expect } from '../fixtures/auth.fixture';
import { uniqueProjectCode, uniqueProjectName, createTaskAtStatus } from '../helpers/constants';

test.describe('API Validation & Edge Cases', () => {
  let projectId: string;

  test.beforeEach(async ({ apiHelper }) => {
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), code);
    projectId = project.id;
  });

  // ── Task creation validation ─────────────────────────────────────────

  test('task creation requires projectId', async ({ apiHelper }) => {
    const result = await apiHelper.updateTaskExpectError('nonexistent', { taskName: 'Orphan' });
    expect(result.status).toBeGreaterThanOrEqual(400);
  });

  test('task creation requires taskName', async ({ apiHelper }) => {
    // The createTask helper sends taskName, so we need raw fetch
    const res = await fetch(`${process.env.API_URL || 'http://localhost:3009'}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiHelper.getToken()}`,
      },
      body: JSON.stringify({ projectId, system: 'FOL' }),
    });
    expect(res.status).toBe(400);
  });

  // ── Status transition validation ──────────────────────────────────────

  test('Pending → Triggered is valid', async ({ apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'Valid Transition');
    const updated = await apiHelper.setTaskStatus(task.id, 'Triggered');
    expect(updated.status).toBe('Triggered');
  });

  test('Triggered → Acknowledged is valid', async ({ apiHelper }) => {
    const task = await createTaskAtStatus(apiHelper, projectId, 'To Ack', 'Triggered');
    const updated = await apiHelper.setTaskStatus(task.id, 'Acknowledged');
    expect(updated.status).toBe('Acknowledged');
  });

  test('Acknowledged → Completed is valid', async ({ apiHelper }) => {
    const task = await createTaskAtStatus(apiHelper, projectId, 'To Complete', 'Acknowledged');
    const updated = await apiHelper.setTaskStatus(task.id, 'Completed');
    expect(updated.status).toBe('Completed');
  });

  test('Triggered → Completed is rejected', async ({ apiHelper }) => {
    const task = await createTaskAtStatus(apiHelper, projectId, 'Skip Ack', 'Triggered');
    const result = await apiHelper.updateTaskExpectError(task.id, { status: 'Completed' });
    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain('Invalid status transition');
  });

  test('Completed → Pending is rejected', async ({ apiHelper }) => {
    const task = await createTaskAtStatus(apiHelper, projectId, 'Reopen Attempt', 'Completed');
    const result = await apiHelper.updateTaskExpectError(task.id, { status: 'Pending' });
    expect(result.status).toBe(400);
  });

  test('Completed task field updates are rejected', async ({ apiHelper }) => {
    const task = await createTaskAtStatus(apiHelper, projectId, 'Immutable Fields', 'Completed');
    const result = await apiHelper.updateTaskExpectError(task.id, { description: 'Changed' });
    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain('Cannot modify a completed task');
  });

  // ── Dependency validation ─────────────────────────────────────────────

  test('dependency on non-existent task is rejected', async ({ apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'Orphan Dep');
    const result = await apiHelper.updateTaskExpectError(task.id, {
      dependencies: ['00000000-0000-0000-0000-000000000000'],
    });
    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain('not found');
  });

  test('three-task circular dependency detected', async ({ apiHelper }) => {
    const taskA = await apiHelper.createTask(projectId, 'Chain A');
    const taskB = await apiHelper.createTask(projectId, 'Chain B');
    const taskC = await apiHelper.createTask(projectId, 'Chain C');

    // A → B
    await apiHelper.setTaskDependencies(taskA.id, [taskB.id]);
    // B → C
    await apiHelper.setTaskDependencies(taskB.id, [taskC.id]);
    // C → A would create cycle
    const result = await apiHelper.updateTaskExpectError(taskC.id, {
      dependencies: [taskA.id],
    });
    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain('Circular dependency');
  });

  // ── Project validation ────────────────────────────────────────────────

  test('duplicate project code is rejected', async ({ apiHelper }) => {
    const code = uniqueProjectCode();
    await apiHelper.createProject('First', code);

    try {
      await apiHelper.createProject('Second', code);
      // Should not reach here
      expect(true).toBe(false);
    } catch (err: unknown) {
      expect(String(err)).toContain('failed');
    }
  });

  // ── Task deletion ─────────────────────────────────────────────────────

  test('deleted task is no longer accessible', async ({ apiHelper }) => {
    const task = await apiHelper.createTask(projectId, 'Delete Me');
    await apiHelper.deleteTask(task.id);

    try {
      await apiHelper.getTask(task.id);
      expect(true).toBe(false);
    } catch (err: unknown) {
      expect(String(err)).toContain('failed');
    }
  });
});
