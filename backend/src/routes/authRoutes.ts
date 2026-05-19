import { Router } from 'express';
import * as authController from '../controllers/authController';
import rateLimiter from '../middleware/rateLimiter';
import auth from '../middleware/auth';

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

// Microsoft OAuth routes (public — no JWT required)
router.get('/microsoft', authController.microsoftLogin);
router.get('/microsoft/callback', authController.microsoftCallback);
router.get('/microsoft/status', authController.microsoftStatus);

// Authenticated user profile
router.get('/me', auth, authController.getMe);

export = router;
