import { test, expect } from '../fixtures/auth.fixture';
import { uniqueProjectCode, uniqueProjectName } from '../helpers/constants';

test.describe('Cross-Project Dependency Validation', () => {
  let projectAId: string;
  let projectBId: string;

  test.beforeEach(async ({ apiHelper }) => {
    const projectA = await apiHelper.createProject(uniqueProjectName(), uniqueProjectCode());
    const projectB = await apiHelper.createProject(uniqueProjectName(), uniqueProjectCode());
    projectAId = projectA.id;
    projectBId = projectB.id;
  });

  test('API rejects setting dependency on task from different project', async ({ apiHelper }) => {
    const taskA = await apiHelper.createTask(projectAId, 'Task in Project A');
    const taskB = await apiHelper.createTask(projectBId, 'Task in Project B');

    const result = await apiHelper.updateTaskExpectError(taskA.id, {
      dependencies: [taskB.id],
    });

    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain('Cross-project dependencies are not allowed');
  });

  test('API rejects cross-project dependency in reverse direction', async ({ apiHelper }) => {
    const taskA = await apiHelper.createTask(projectAId, 'Task A');
    const taskB = await apiHelper.createTask(projectBId, 'Task B');

    const result = await apiHelper.updateTaskExpectError(taskB.id, {
      dependencies: [taskA.id],
    });

    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain('Cross-project dependencies are not allowed');
  });

  test('same-project dependency is accepted', async ({ apiHelper }) => {
    const taskA = await apiHelper.createTask(projectAId, 'Same Project A');
    const taskB = await apiHelper.createTask(projectAId, 'Same Project B');

    // Should succeed — same project
    const updated = await apiHelper.setTaskDependencies(taskB.id, [taskA.id]);
    expect(updated.dependencies).toContain(taskA.id);
  });

  test('mixed cross-project and same-project deps all rejected', async ({ apiHelper }) => {
    const taskA1 = await apiHelper.createTask(projectAId, 'A1');
    const taskA2 = await apiHelper.createTask(projectAId, 'A2');
    const taskB1 = await apiHelper.createTask(projectBId, 'B1');

    // Try to set taskA2 depending on both taskA1 (same project) and taskB1 (different project)
    const result = await apiHelper.updateTaskExpectError(taskA2.id, {
      dependencies: [taskA1.id, taskB1.id],
    });

    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain('Cross-project dependencies are not allowed');
  });
});
