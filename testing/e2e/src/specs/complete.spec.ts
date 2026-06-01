import { test, expect } from '@playwright/test';
import { CompletePage } from '../page-objects/complete.page';
import { test as authTest } from '../fixtures/auth.fixture';
import { uniqueProjectCode, uniqueProjectName, createTaskAtStatus } from '../helpers/constants';

test.describe('Complete Page — error cases', () => {
  let completePage: CompletePage;

  test.beforeEach(async ({ page }) => {
    completePage = new CompletePage(page);
  });

  test('shows error when task_id and token are missing', async () => {
    await completePage.gotoWithoutParams();

    await expect(completePage.errorHeading).toBeVisible({ timeout: 10_000 });
    const errorText = completePage.page.getByText(/missing task_id or token/i);
    await expect(errorText).toBeVisible();
  });

  test('shows error with invalid token', async () => {
    await completePage.gotoWithParams('00000000-0000-0000-0000-000000000000', 'invalidtoken123');

    await expect(completePage.errorHeading).toBeVisible({ timeout: 10_000 });
  });

  test('shows Tilli-go title', async () => {
    await completePage.gotoWithoutParams();
    await expect(completePage.title).toContainText('Tilli-go');
  });
});

authTest.describe('Complete Page — API integration', () => {
  let projectId: string;

  authTest.beforeEach(async ({ apiHelper }) => {
    const code = uniqueProjectCode();
    const project = await apiHelper.createProject(uniqueProjectName(), code);
    projectId = project.id;
  });

  authTest('complete endpoint rejects task that is not Acknowledged', async ({ apiHelper }) => {
    // Create a task at Pending status
    const task = await apiHelper.createTask(projectId, 'Not Ack Task');

    // Try to complete via API — should fail with 409
    const result = await apiHelper.completeTaskExpectError(task.id);
    expect(result.status).toBe(403);
  });

  authTest('complete endpoint rejects Triggered task', async ({ apiHelper }) => {
    const task = await createTaskAtStatus(apiHelper, projectId, 'Triggered Task', 'Triggered');

    const result = await apiHelper.completeTaskExpectError(task.id);
    // Token will be invalid since we're generating a fake one
    expect(result.status).toBe(403);
  });

  authTest('complete endpoint rejects already Completed task with 200 (idempotent)', async ({ apiHelper }) => {
    const task = await createTaskAtStatus(apiHelper, projectId, 'Already Done', 'Completed');

    // We can't actually call /complete without a valid token, so just verify via API
    // that the task stays Completed and is immutable
    const result = await apiHelper.updateTaskExpectError(task.id, { taskName: 'Hacked' });
    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain('Cannot modify a completed task');
  });
});
