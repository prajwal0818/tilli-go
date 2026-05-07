import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import validate from '../middleware/validate';
import { createProjectSchema } from '../validators/projectValidator';
import auth from '../middleware/auth';

const router = Router();

router.use(auth);

router.get('/', projectController.list);
router.get('/:id', projectController.getById);
router.post('/', validate(createProjectSchema), projectController.create);
router.delete('/:id', projectController.remove);

export = router;
