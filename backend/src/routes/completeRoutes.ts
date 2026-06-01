import { Router } from 'express';
import * as completeController from '../controllers/completeController';
import rateLimiter from '../middleware/rateLimiter';

const router = Router();

// Public endpoint (no JWT auth) — protected by signed token + rate limiting.
// 15 requests per IP per minute to prevent brute-force token guessing.
router.get(
  '/',
  rateLimiter({ windowMs: 60_000, max: 15, keyPrefix: 'rl:complete' }),
  completeController.complete,
);

export = router;
