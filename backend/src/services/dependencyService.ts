import prisma from '../config/prisma';
import { AppError } from '../utils/errors';
import { TaskStatus } from '../types';
import type { DependencyCheckResult, DependerTask } from '../types';

// ── canTaskExecute ──────────────────────────────────────────────────────────
// Core reusable function: checks whether ALL dependencies of a task
// have status "Completed". Returns a structured result usable by
// API middleware, service layer, scheduler, and worker.

export async function canTaskExecute(taskId: string): Promise<DependencyCheckResult> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true },
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const dependencies = await prisma.taskDependency.findMany({
    where: { taskId },
    include: {
      dependsOn: {
        select: { id: true, taskName: true, status: true, projectId: true },
      },
    },
  });

  if (dependencies.length === 0) {
    return { executable: true, blockingTasks: [] };
  }

  // Validate all dependencies are within the same project
  for (const dep of dependencies) {
    if (dep.dependsOn.projectId !== task.projectId) {
      throw new AppError('Cross-project dependencies are not allowed', 400);
    }
  }

  const blockingTasks = dependencies
    .filter((dep) => dep.dependsOn.status !== TaskStatus.Completed)
    .map((dep) => ({
      id: dep.dependsOn.id,
      taskName: dep.dependsOn.taskName,
      status: dep.dependsOn.status,
    }));

  return {
    executable: blockingTasks.length === 0,
    blockingTasks,
  };
}

// ── assertDependenciesMet ───────────────────────────────────────────────────
// Throws if any dependency is not Completed. Use as a guard in service /
// worker code where you want a hard failure.

export async function assertDependenciesMet(taskId: string): Promise<void> {
  const result = await canTaskExecute(taskId);

  if (!result.executable) {
    const names = result.blockingTasks
      .map((t) => `${t.taskName} (${t.status})`)
      .join(', ');
    throw new AppError(`Dependencies not completed: ${names}`, 400);
  }
}

// ── canTasksExecuteBatch ─────────────────────────────────────────────────────
// Batch version: checks dependency status for multiple candidate tasks in two
// queries total (one for tasks, one for all their deps). Returns a Map from
// taskId → { executable, blockingDepIds }. Also validates cross-project deps.

export interface BatchCheckResult {
  executable: boolean;
  blockingDepIds: string[];
}

export async function canTasksExecuteBatch(
  candidateIds: string[],
): Promise<Map<string, BatchCheckResult>> {
  const results = new Map<string, BatchCheckResult>();
  if (candidateIds.length === 0) return results;

  // Fetch all candidates with their projectId
  const candidates = await prisma.task.findMany({
    where: { id: { in: candidateIds } },
    select: { id: true, projectId: true },
  });
  const projectById = new Map(candidates.map((t) => [t.id, t.projectId]));

  // Batch-load all dependencies for these candidates
  const allDeps = await prisma.taskDependency.findMany({
    where: { taskId: { in: candidateIds } },
    include: {
      dependsOn: { select: { id: true, status: true, projectId: true } },
    },
  });

  // Group deps by taskId
  const depsByTaskId = new Map<string, typeof allDeps>();
  for (const dep of allDeps) {
    if (!depsByTaskId.has(dep.taskId)) depsByTaskId.set(dep.taskId, []);
    depsByTaskId.get(dep.taskId)!.push(dep);
  }

  for (const id of candidateIds) {
    const deps = depsByTaskId.get(id) || [];
    const taskProjectId = projectById.get(id);

    // Validate cross-project deps
    const hasCrossProject = deps.some(
      (d) => taskProjectId && d.dependsOn.projectId !== taskProjectId,
    );

    if (hasCrossProject) {
      // Cross-project dependency found — treat as not executable
      results.set(id, { executable: false, blockingDepIds: deps.map((d) => d.dependsOn.id) });
      continue;
    }

    const blocking = deps.filter(
      (d) => d.dependsOn.status !== TaskStatus.Completed,
    );

    results.set(id, {
      executable: blocking.length === 0,
      blockingDepIds: blocking.map((d) => d.dependsOn.id),
    });
  }

  return results;
}

// ── wouldCreateCycle ────────────────────────────────────────────────────────
// Detect circular dependencies using iterative DFS.
// Loads the FULL dependency graph in a single query, then walks in-memory.
// Checks: if we add edges  taskId → each targetId, would taskId become
// reachable from itself?

export async function wouldCreateCycle(taskId: string, targetIds: string[]): Promise<boolean> {
  if (targetIds.length === 0) return false;
  if (targetIds.includes(taskId)) return true;

  // Scope graph to the task's project to avoid loading the entire DB
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });

  if (!task) return false;

  const projectTaskIds = await prisma.task.findMany({
    where: { projectId: task.projectId },
    select: { id: true },
  });
  const projectIds = new Set(projectTaskIds.map((t) => t.id));

  const allEdges = await prisma.taskDependency.findMany({
    where: {
      taskId: { in: [...projectIds] },
    },
    select: { taskId: true, dependsOnTaskId: true },
  });

  // Build adjacency list:  child → [parents it depends on]
  const adjList = new Map<string, string[]>();
  for (const edge of allEdges) {
    const existing = adjList.get(edge.taskId);
    if (existing) {
      existing.push(edge.dependsOnTaskId);
    } else {
      adjList.set(edge.taskId, [edge.dependsOnTaskId]);
    }
  }

  // DFS: starting from each targetId, walk existing "dependsOn" edges.
  // If we reach taskId, adding taskId → targetId creates a cycle.
  const visited = new Set<string>();
  const stack = [...targetIds];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === taskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = adjList.get(current) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  return false;
}

// ── validateDependenciesExist ───────────────────────────────────────────────

export async function validateDependenciesExist(dependencyIds: string[]): Promise<void> {
  if (dependencyIds.length === 0) return;

  const found = await prisma.task.findMany({
    where: { id: { in: dependencyIds } },
    select: { id: true },
  });

  const foundIds = new Set(found.map((t) => t.id));
  const missing = dependencyIds.filter((id) => !foundIds.has(id));

  if (missing.length > 0) {
    throw new AppError(`Dependency tasks not found: ${missing.join(', ')}`, 400);
  }
}

// ── setDependencies ─────────────────────────────────────────────────────────
// Replace all dependencies for a task with a new set.
// Validates: existence, self-reference, circular reference, same project.

export async function setDependencies(taskId: string, dependencyIds: string[]): Promise<void> {
  const unique = [...new Set(dependencyIds)];

  // Self-dependency check
  if (unique.includes(taskId)) {
    throw new AppError('A task cannot depend on itself', 400);
  }

  if (unique.length > 0) {
    // Fetch the task and all dependency tasks in parallel (2 queries instead of 3)
    const [task, depTasks] = await Promise.all([
      prisma.task.findUnique({
        where: { id: taskId },
        select: { projectId: true },
      }),
      prisma.task.findMany({
        where: { id: { in: unique } },
        select: { id: true, projectId: true },
      }),
    ]);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Validate all dependency tasks exist
    if (depTasks.length !== unique.length) {
      const foundIds = new Set(depTasks.map((t) => t.id));
      const missing = unique.filter((id) => !foundIds.has(id));
      throw new AppError(`Dependency tasks not found: ${missing.join(', ')}`, 400);
    }

    // Cross-project check
    for (const dep of depTasks) {
      if (dep.projectId !== task.projectId) {
        throw new AppError('Cross-project dependencies are not allowed', 400);
      }
    }

    if (await wouldCreateCycle(taskId, unique)) {
      throw new AppError('Circular dependency detected', 400);
    }
  }

  await prisma.$transaction([
    prisma.taskDependency.deleteMany({ where: { taskId } }),
    ...unique.map((depId) =>
      prisma.taskDependency.create({
        data: { taskId, dependsOnTaskId: depId },
      })
    ),
  ]);
}

// ── getDependers ────────────────────────────────────────────────────────────
// Returns tasks that depend ON the given taskId (downstream impact).

export async function getDependers(taskId: string): Promise<DependerTask[]> {
  const rows = await prisma.taskDependency.findMany({
    where: { dependsOnTaskId: taskId },
    include: {
      task: {
        select: { id: true, taskName: true, status: true },
      },
    },
  });

  return rows.map((r) => r.task);
}
