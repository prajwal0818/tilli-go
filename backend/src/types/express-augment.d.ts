import type { JwtPayload } from './auth';
import type { DependencyCheckResult } from './task';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      dependencyCheck?: DependencyCheckResult;
    }
  }
}
