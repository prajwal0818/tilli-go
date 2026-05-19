// ── Task domain ─────────────────────────────────────────────────────────────
export {
  TaskStatus,
  VALID_STATUSES,
  ALLOWED_TRANSITIONS,
  STATUS_REQUIRES_DEPS_MET,
  TASK_INCLUDE,
} from './task';

export type {
  PrismaTask,
  PrismaUser,
  PrismaProject,
  PrismaTaskDependency,
  PrismaAuditLog,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskFilterParams,
  TaskAssignedUser,
  TaskProjectRef,
  TaskResponse,
  TaskWithIncludes,
  BlockingTask,
  DependencyCheckResult,
  DependerTask,
  DependencyStatusResponse,
  AuditAction,
  CreateAuditLogEntry,
  CreateTaskOptions,
  UpdateTaskOptions,
} from './task';

// ── Project domain ──────────────────────────────────────────────────────────
export type { CreateProjectDTO, ProjectFilterParams } from './project';

// ── Auth domain ─────────────────────────────────────────────────────────────
export type {
  RegisterDTO,
  LoginDTO,
  UserSummary,
  JwtTokenPayload,
  JwtPayload,
  AuthResponse,
} from './auth';

// ── API layer ───────────────────────────────────────────────────────────────
export type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
  AcknowledgeSuccessResponse,
  AcknowledgeConflictResponse,
  AuthenticatedRequest,
  AckTokenData,
} from './api';

// ── Queue / scheduler ───────────────────────────────────────────────────────
export type {
  TaskJobPayload,
  TaskJobInput,
  EmailJobPayload,
  SchedulerStats,
} from './queue';

// ── Config ──────────────────────────────────────────────────────────────────
export type { Config, RedisConfig, SmtpConfig, MicrosoftOAuthConfig } from './config';
