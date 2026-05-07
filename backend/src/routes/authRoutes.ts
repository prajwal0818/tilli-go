import { Router } from 'express';
import * as authController from '../controllers/authController';
import rateLimiter from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/register',
  rateLimiter({ windowMs: 60_000, max: 5, keyPrefix: 'rl:register' }),
  authController.register,
);
router.post(
  '/login',
  rateLimiter({ windowMs: 60_000, max: 10, keyPrefix: 'rl:login' }),
  authController.login,
);

export = router;
