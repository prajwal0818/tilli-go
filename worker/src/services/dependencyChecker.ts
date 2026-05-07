import prisma from '../config/prisma';

interface BlockingTask {
  id: string;
  taskName: string;
  status: string;
}

interface DependencyCheckResult {
  executable: boolean;
  blockingTasks: BlockingTask[];
}

export async function canTaskExecute(taskId: string): Promise<DependencyCheckResult> {
  const dependencies = await prisma.taskDependency.findMany({
    where: { taskId },
    include: {
      dependsOn: {
        select: { id: true, taskName: true, status: true },
      },
    },
  });

  if (dependencies.length === 0) {
    return { executable: true, blockingTasks: [] };
  }

  const blockingTasks = dependencies
    .filter((dep) => dep.dependsOn.status !== 'Completed')
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
