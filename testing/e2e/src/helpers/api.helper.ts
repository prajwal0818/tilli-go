import { API_URL, TEST_PASSWORD } from './constants';

interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string; role: string };
}

interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface Task {
  id: string;
  system: string;
  taskName: string;
  status: string;
  sequenceNumber: number;
  projectId: string;
  dependencies: string[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Direct fetch() wrapper for test setup/teardown.
 * Not for testing UI — only for creating test data via the API.
 */
export class ApiHelper {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl: string = API_URL) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return undefined as T;

    const json = await res.json();
    if (!res.ok) {
      throw new Error(`API ${method} ${path} failed (${res.status}): ${JSON.stringify(json)}`);
    }
    return json as T;
  }

  // ── Auth ──────────────────────────────────────────────────────────────

  static async register(
    email: string,
    password: string,
    name: string,
    baseUrl: string = API_URL,
  ): Promise<{ helper: ApiHelper; user: AuthResponse['user'] }> {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const json = (await res.json()) as AuthResponse;
    if (!res.ok) throw new Error(`Register failed: ${JSON.stringify(json)}`);
    return { helper: new ApiHelper(json.token, baseUrl), user: json.user };
  }

  static async login(
    email: string,
    password: string = TEST_PASSWORD,
    baseUrl: string = API_URL,
  ): Promise<{ helper: ApiHelper; token: string; user: AuthResponse['user'] }> {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = (await res.json()) as AuthResponse;
    if (!res.ok) throw new Error(`Login failed: ${JSON.stringify(json)}`);
    return {
      helper: new ApiHelper(json.token, baseUrl),
      token: json.token,
      user: json.user,
    };
  }

  // ── Projects ──────────────────────────────────────────────────────────

  async createProject(name: string, code: string, description?: string): Promise<Project> {
    return this.request<Project>('POST', '/api/projects', { name, code, description });
  }

  async listProjects(limit: number = 200): Promise<PaginatedResponse<Project>> {
    return this.request<PaginatedResponse<Project>>('GET', `/api/projects?limit=${limit}`);
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>('DELETE', `/api/projects/${id}`);
  }

  // ── Tasks ─────────────────────────────────────────────────────────────

  async createTask(projectId: string, taskName: string, system: string = 'FOL'): Promise<Task> {
    return this.request<Task>('POST', '/api/tasks', { projectId, taskName, system });
  }

  async getTask(id: string): Promise<Task> {
    return this.request<Task>('GET', `/api/tasks/${id}`);
  }

  async updateTask(id: string, data: Record<string, unknown>): Promise<Task> {
    return this.request<Task>('PUT', `/api/tasks/${id}`, data);
  }

  async deleteTask(id: string): Promise<void> {
    return this.request<void>('DELETE', `/api/tasks/${id}`);
  }

  async listTasks(projectId: string): Promise<PaginatedResponse<Task>> {
    return this.request<PaginatedResponse<Task>>('GET', `/api/tasks?projectId=${projectId}`);
  }

  // ── Convenience wrappers ─────────────────────────────────────────────

  async setTaskDependencies(taskId: string, dependencyIds: string[]): Promise<Task> {
    return this.updateTask(taskId, { dependencies: dependencyIds });
  }

  async setTaskStatus(taskId: string, status: string): Promise<Task> {
    return this.updateTask(taskId, { status });
  }

  /**
   * Raw fetch that returns { status, body } instead of throwing.
   * Useful for negative tests that expect specific error codes.
   */
  async updateTaskExpectError(
    id: string,
    data: Record<string, unknown>,
  ): Promise<{ status: number; body: Record<string, unknown> }> {
    const res = await fetch(`${this.baseUrl}/api/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    return { status: res.status, body };
  }

  // ── Scheduler ─────────────────────────────────────────────────────────

  async triggerScheduler(): Promise<unknown> {
    return this.request<unknown>('POST', '/api/scheduler/trigger');
  }

  // ── Token ─────────────────────────────────────────────────────────────

  getToken(): string {
    return this.token;
  }
}
