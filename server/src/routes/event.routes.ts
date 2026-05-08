import { Router } from 'express';
import { body } from 'express-validator';
import * as eventController from '../controllers/event.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/', authenticate, eventController.list);
router.get('/:id', authenticate, eventController.getById);

router.post('/', authenticate, requireAdmin, [
  body('title').trim().notEmpty(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('organizationId').isUUID(),
  validate,
], eventController.create);

router.put('/:id', authenticate, requireAdmin, [
  body('title').optional().trim().notEmpty(),
  validate,
], eventController.update);

router.delete('/:id', authenticate, requireAdmin, eventController.remove);

export default router;
