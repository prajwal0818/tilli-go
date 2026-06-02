import { test, expect } from '../fixtures/auth.fixture';
import { uniqueProjectCode, uniqueProjectName } from '../helpers/constants';

test.describe('Scheduler', () => {
  let projectId: string;

  test.beforeEach(async ({ apiHelper }) => {
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), code);
    projectId = project.id;
  });

  test('scheduler trigger endpoint responds', async ({ apiHelper }) => {
    const result = await apiHelper.triggerScheduler();
    expect(result).toBeDefined();
  });

  test('eligible Pending task becomes Triggered after scheduler run', async ({ apiHelper }) => {
    // Create a task with no dependencies — eligible for triggering
    const task = await apiHelper.createTask(projectId, 'Scheduler Test');
    expect(task.status).toBe('Pending');

    // Set a past planned start time to make it eligible
    await apiHelper.updateTask(task.id, {
      plannedStartTime: new Date(Date.now() - 60000).toISOString(),
    });

    // Trigger the scheduler
    await apiHelper.triggerScheduler();

    // Wait for the worker to process the task
    await expect.poll(
      async () => {
        const updated = await apiHelper.getTask(task.id);
        return updated.status;
      },
      { timeout: 15_000, intervals: [500, 1000, 2000] },
    ).toBe('Triggered');
  });

  test('task with unmet dependency gets Blocked', async ({ apiHelper }) => {
    const blocker = await apiHelper.createTask(projectId, 'Blocker');
    const dependent = await apiHelper.createTask(projectId, 'Dependent');

    // Set dependency: dependent depends on blocker
    await apiHelper.setTaskDependencies(dependent.id, [blocker.id]);

    // Set past planned start time
    await apiHelper.updateTask(dependent.id, {
      plannedStartTime: new Date(Date.now() - 60000).toISOString(),
    });

    // Trigger scheduler
    await apiHelper.triggerScheduler();

    // Dependent should become Blocked (blocker is still Pending)
    await expect.poll(
      async () => {
        const updated = await apiHelper.getTask(dependent.id);
        return updated.status;
      },
      { timeout: 10_000, intervals: [500, 1000, 2000] },
    ).toBe('Blocked');
  });

  test('Blocked task transitions to Pending when dependency completes', async ({ apiHelper }) => {
    const blocker = await apiHelper.createTask(projectId, 'Dep Task');
    const dependent = await apiHelper.createTask(projectId, 'Waiting Task');

    // Set dependency
    await apiHelper.setTaskDependencies(dependent.id, [blocker.id]);

    // Block the dependent
    await apiHelper.setTaskStatus(dependent.id, 'Blocked');
    const blocked = await apiHelper.getTask(dependent.id);
    expect(blocked.status).toBe('Blocked');

    // Complete the blocker through valid transitions
    await apiHelper.setTaskStatus(blocker.id, 'Triggered');
    await apiHelper.setTaskStatus(blocker.id, 'Acknowledged');
    await apiHelper.setTaskStatus(blocker.id, 'Completed');

    // Trigger scheduler — should unblock the dependent
    await apiHelper.triggerScheduler();

    await expect.poll(
      async () => {
        const updated = await apiHelper.getTask(dependent.id);
        return updated.status;
      },
      { timeout: 10_000, intervals: [500, 1000, 2000] },
    ).toBe('Pending');
  });
});
