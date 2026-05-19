// ── Task statuses ────────────────────────────────────────────────────────────

export type TaskStatus = 'Pending' | 'Triggered' | 'Acknowledged' | 'Completed' | 'Blocked';

// ── Domain models (match backend API response shapes) ────────────────────────

export interface TaskAssignedUser {
  id: string;
  name: string;
  email: string;
}

export interface TaskProjectRef {
  id: string;
  code: string;
  name: string;
}

/** Task as returned by the API (dates are ISO strings over the wire) */
export interface Task {
  id: string;
  system: string;
  taskName: string;
  description: string | null;
  assignedTeam: string | null;
  assignedUserId: string | null;
  plannedStartTime: string | null;
  plannedEndTime: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  status: TaskStatus;
  notes: string | null;
  projectId: string;
  sequenceNumber: number;
  createdAt: string;
  updatedAt: string;
  dependencies: string[];
  assignedUser: TaskAssignedUser | null;
  project: TaskProjectRef;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePicture?: string | null;
  oauthProvider?: string | null;
}

// ── API payloads ─────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: UserSummary;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AcknowledgeResponse {
  message: string;
  taskId: string;
  taskName: string;
  status: string;
  actualStartTime: string | null;
}

// ── Input types for API calls ────────────────────────────────────────────────

export interface CreateTaskInput {
  system: string;
  taskName: string;
  description?: string;
  assignedTeam?: string;
  assignedUserId?: string;
  plannedStartTime?: string;
  plannedEndTime?: string;
  notes?: string;
  projectId: string;
  dependencies?: string[];
}

export interface UpdateTaskInput {
  system?: string;
  taskName?: string;
  description?: string | null;
  assignedTeam?: string | null;
  assignedUserId?: string | null;
  plannedStartTime?: string | null;
  plannedEndTime?: string | null;
  notes?: string | null;
  status?: TaskStatus;
  dependencies?: string[];
}

export interface CreateProjectInput {
  name: string;
  code: string;
  description?: string;
}

// ── Context types ────────────────────────────────────────────────────────────

export interface ProjectContextType {
  projects: Project[];
  selectedProjectId: string | null;
  setSelectedProjectId: React.Dispatch<React.SetStateAction<string | null>>;
  refreshProjects: (newProjectData?: CreateProjectInput) => Promise<Project | void>;
  projectsLoading: boolean;
}

// ── Toast types ──────────────────────────────────────────────────────────────

export type ToastType = 'error' | 'success' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

// ── Utility ──────────────────────────────────────────────────────────────────

export interface StatusColors {
  bg: string;
  text: string;
}
