import type { AxiosResponse } from 'axios';
import api from './api';
import type { Project, PaginatedResponse, CreateProjectInput } from '../types';

export const projectService = {
  getProjects: (): Promise<AxiosResponse<PaginatedResponse<Project>>> =>
    api.get('/projects'),

  createProject: (data: CreateProjectInput): Promise<AxiosResponse<Project>> =>
    api.post('/projects', data),

  deleteProject: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/projects/${id}`),

  batchDeleteProjects: (ids: string[]): Promise<AxiosResponse<{ deleted: number }>> =>
    api.post('/projects/batch-delete', { ids }),
};
