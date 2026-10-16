import { Router } from 'express';
import * as employeeController from '../controllers/employee.controller';
import { validate } from '../middleware/validate';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employee.validator';

const router = Router();

router.get('/', employeeController.getEmployees);
router.post('/', validate(createEmployeeSchema), employeeController.createEmployee);
router.get('/:id', employeeController.getEmployeeById);
router.put('/:id', validate(updateEmployeeSchema), employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

export default router;
