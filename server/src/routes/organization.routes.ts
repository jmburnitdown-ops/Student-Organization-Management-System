import { Router } from 'express';
import { body } from 'express-validator';
import * as orgController from '../controllers/organization.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/', authenticate, orgController.list);
router.get('/:id', authenticate, orgController.getById);
router.get('/:id/members', authenticate, requireAdmin, orgController.getMembers);

router.post('/', authenticate, requireAdmin, [
  body('name').trim().notEmpty(),
  body('category').trim().notEmpty(),
  body('description').optional().trim(),
  validate,
], orgController.create);

router.put('/:id', authenticate, requireAdmin, [
  body('name').optional().trim().notEmpty(),
  body('category').optional().trim().notEmpty(),
  validate,
], orgController.update);

router.delete('/:id', authenticate, requireAdmin, orgController.remove);

export default router;
