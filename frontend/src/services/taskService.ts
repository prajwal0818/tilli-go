import type { AxiosResponse } from 'axios';
import api from './api';
import type { Task, PaginatedResponse, CreateTaskInput, UpdateTaskInput } from '../types';

export const taskService = {
  list: (projectId?: string): Promise<AxiosResponse<PaginatedResponse<Task>>> =>
    api.get('/tasks', { params: projectId ? { projectId } : {} }),

  getById: (id: string): Promise<AxiosResponse<Task>> =>
    api.get(`/tasks/${id}`),

  create: (data: CreateTaskInput): Promise<AxiosResponse<Task>> =>
    api.post('/tasks', data),

  update: (id: string, data: UpdateTaskInput): Promise<AxiosResponse<Task>> =>
    api.put(`/tasks/${id}`, data),

  remove: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/tasks/${id}`),
};
