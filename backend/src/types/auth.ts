/** Input for user registration (matches Zod registerSchema output) */
export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
}

/** Input for user login (matches Zod loginSchema output) */
export interface LoginDTO {
  email: string;
  password: string;
}

/** Subset of User fields safe for API responses (no password hash) */
export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: string;
}

/** JWT payload embedded in the token (what jwt.sign receives) */
export interface JwtTokenPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Decoded JWT payload extracted by auth middleware.
 * Maps `sub` → `id` for convenience.
 */
export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/** Response from POST /auth/register and POST /auth/login */
export interface AuthResponse {
  token: string;
  user: UserSummary;
}
