import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { validate } from '../middleware/validate';
import {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
} from '../validators/task.validator';

const router = Router();

router.get('/', taskController.getTasks);
router.post('/', validate(createTaskSchema), taskController.createTask);

// IMPORTANT: export.csv must be BEFORE /:id to avoid being caught as an id param
router.get('/export.csv', taskController.exportCsv);

router.get('/:id', taskController.getTaskById);
router.put('/:id', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.put('/:id/status', validate(updateStatusSchema), taskController.updateStatus);

export default router;
