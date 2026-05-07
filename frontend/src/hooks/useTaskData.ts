import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';
import { getErrorMessage } from '../services/api';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types';

export interface UseTaskDataReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  addTask: (data: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, data: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
}

export function useTaskData(projectId: string | null): UseTaskDataReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await taskService.list(projectId);
      // API returns { data: [...], total, page, limit }
      const payload = res.data;
      setTasks(Array.isArray(payload) ? payload : payload.data || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async (data: CreateTaskInput): Promise<Task> => {
    const res = await taskService.create(data);
    setTasks((prev) => [...prev, res.data]);
    return res.data;
  }, []);

  const updateTask = useCallback(async (id: string, data: UpdateTaskInput): Promise<Task> => {
    const res = await taskService.update(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    return res.data;
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    await taskService.remove(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loading, error, fetchTasks, addTask, updateTask, deleteTask };
}
