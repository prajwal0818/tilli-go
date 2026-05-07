import { Router } from 'express';
import taskRoutes from './taskRoutes';
import authRoutes from './authRoutes';
import acknowledgeRoutes from './acknowledgeRoutes';
import projectRoutes from './projectRoutes';
import auth from '../middleware/auth';
import * as scheduler from '../services/schedulerService';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/projects', projectRoutes);
router.use('/acknowledge', acknowledgeRoutes);

router.get('/scheduler/status', auth, (_req, res) => {
  res.json(scheduler.getStats());
});

// Manual trigger for testing — POST only
router.post('/scheduler/trigger', auth, async (_req, res, next) => {
  try {
    await scheduler.tick();
    res.json(scheduler.getStats());
  } catch (err) {
    next(err);
  }
});

export = router;
