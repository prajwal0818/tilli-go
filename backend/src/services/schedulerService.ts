import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { canTaskExecute } from './dependencyService';
import { addTaskJob } from './queueService';
import logger from '../config/logger';
import type { SchedulerStats } from '../types';

const INTERVAL_MS = 60_000; // 1 minute
let intervalHandle: ReturnType<typeof setInterval> | null = null;
let running = false;

// ── Stats (exposed for the status endpoint) ─────────────────────────────────

const stats: Omit<SchedulerStats, 'running'> = {
  lastRunAt: null,
  lastRunDurationMs: null,
  tasksEnqueued: 0,
  tasksBlocked: 0,
  tasksUnblocked: 0,
  errors: 0,
};

export function getStats(): SchedulerStats {
  return { ...stats, running: !!intervalHandle };
}

// ── Tick ─────────────────────────────────────────────────────────────────────
// Called every minute. Two phases:
//   1. Re-evaluate Blocked tasks → move back to Pending if deps now met
//   2. Find eligible Pending tasks → enqueue or mark Blocked

type DepWithStatus = Prisma.TaskDependencyGetPayload<{
  include: { dependsOn: { select: { id: true; status: true } } };
}>;

export async function tick(): Promise<void> {
  if (running) {
    logger.warn('Scheduler tick skipped — previous tick still running');
    return;
  }

  running = true;
  const start = Date.now();
  let enqueued = 0;
  let blocked = 0;
  let unblocked = 0;

  try {
    // ── Phase 1: Unblock ────────────────────────────────────────────────
    // Blocked tasks whose deps are ALL Completed should return to Pending
    // so they become eligible in phase 2 (same tick or next).

    const blockedTasks = await prisma.task.findMany({
      where: { status: 'Blocked' },
      select: { id: true, taskName: true },
    });

    for (const task of blockedTasks) {
      try {
        const depCheck = await canTaskExecute(task.id);
        if (depCheck.executable) {
          await prisma.task.update({
            where: { id: task.id },
            data: { status: 'Pending' },
          });
          await prisma.auditLog.create({
            data: {
              taskId: task.id,
              action: 'UPDATED',
              field: 'status',
              oldValue: 'Blocked',
              newValue: 'Pending',
            },
          });
          unblocked++;
          logger.info({ taskId: task.id }, 'Task unblocked → Pending');
        }
      } catch (err: unknown) {
        stats.errors++;
        logger.error(
          { taskId: task.id, err: err instanceof Error ? err.message : String(err) },
          'Unblock check failed'
        );
      }
    }

    // ── Phase 2: Evaluate eligible Pending tasks ────────────────────────
    // Conditions: status = Pending AND planned_start_time <= now

    const now = new Date();

    const candidates = await prisma.task.findMany({
      where: {
        status: 'Pending',
        plannedStartTime: { lte: now },
      },
      select: {
        id: true,
        taskName: true,
        system: true,
        assignedTeam: true,
        assignedUserId: true,
      },
    });

    // Batch-load all dependency info for candidates in a single query
    const candidateIds = candidates.map((t) => t.id);
    const allDeps: DepWithStatus[] =
      candidateIds.length > 0
        ? await prisma.taskDependency.findMany({
            where: { taskId: { in: candidateIds } },
            include: {
              dependsOn: { select: { id: true, status: true } },
            },
          })
        : [];

    // Group deps by taskId for O(1) lookup
    const depsByTaskId = new Map<string, DepWithStatus[]>();
    for (const dep of allDeps) {
      if (!depsByTaskId.has(dep.taskId)) depsByTaskId.set(dep.taskId, []);
      depsByTaskId.get(dep.taskId)!.push(dep);
    }

    for (const task of candidates) {
      try {
        const deps = depsByTaskId.get(task.id) || [];
        const blocking = deps.filter(
          (d) => d.dependsOn.status !== 'Completed'
        );
        const executable = blocking.length === 0;

        if (executable) {
          await addTaskJob(task);
          enqueued++;
        } else {
          // Deps not met → mark Blocked
          await prisma.task.update({
            where: { id: task.id },
            data: { status: 'Blocked' },
          });
          await prisma.auditLog.create({
            data: {
              taskId: task.id,
              action: 'UPDATED',
              field: 'status',
              oldValue: 'Pending',
              newValue: 'Blocked',
            },
          });
          blocked++;
          logger.info(
            { taskId: task.id, blockedBy: blocking.map((d) => d.dependsOn.id) },
            'Task blocked — dependencies not met'
          );
        }
      } catch (err: unknown) {
        stats.errors++;
        logger.error(
          { taskId: task.id, err: err instanceof Error ? err.message : String(err) },
          'Scheduler task processing failed'
        );
      }
    }

    const durationMs = Date.now() - start;
    stats.lastRunAt = now.toISOString();
    stats.lastRunDurationMs = durationMs;
    stats.tasksEnqueued += enqueued;
    stats.tasksBlocked += blocked;
    stats.tasksUnblocked += unblocked;

    if (enqueued > 0 || blocked > 0 || unblocked > 0) {
      logger.info(
        { enqueued, blocked, unblocked, durationMs },
        'Scheduler tick completed'
      );
    }
  } catch (err: unknown) {
    stats.errors++;
    logger.error(err, 'Scheduler tick failed');
  } finally {
    running = false;
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

export function start(): void {
  if (intervalHandle) return;
  logger.info({ intervalMs: INTERVAL_MS }, 'Scheduler started');
  tick(); // run immediately on startup
  intervalHandle = setInterval(tick, INTERVAL_MS);
}

export function stop(): void {
  if (!intervalHandle) return;
  clearInterval(intervalHandle);
  intervalHandle = null;
  logger.info('Scheduler stopped');
}
