import type { Request } from 'express';
import type { JwtPayload } from './auth';
import type { DependencyCheckResult } from './task';

// ── Response wrappers ───────────────────────────────────────────────────────

/** Generic API success response (single entity or envelope) */
export interface ApiResponse<T> {
  data: T;
}

/** Paginated list response — matches the shape returned by service list() methods */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/** Standard API error response */
export interface ApiErrorResponse {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

// ── Acknowledge endpoint responses ──────────────────────────────────────────

export interface AcknowledgeSuccessResponse {
  message: string;
  taskId: string;
  taskName: string;
  status: string;
  actualStartTime: Date | null;
}

export interface AcknowledgeConflictResponse {
  error: string;
  currentStatus?: string;
  blockingTasks?: Array<{ id: string; taskName: string; status: string }>;
}

// ── Express augmentation ────────────────────────────────────────────────────

/**
 * Express Request with authenticated user attached by auth middleware.
 * Also carries optional dependencyCheck from validateDependencies middleware.
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  dependencyCheck?: DependencyCheckResult;
}

/** Decoded acknowledgement token payload */
export interface AckTokenData {
  taskId: string;
  exp: number;
}
