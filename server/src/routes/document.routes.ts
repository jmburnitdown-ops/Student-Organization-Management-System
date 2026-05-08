import { Router } from 'express';
import { body } from 'express-validator';
import * as documentController from '../controllers/document.controller';
import { authenticate } from '../middleware/auth';
import { uploadDocument } from '../middleware/upload';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/', authenticate, documentController.list);

router.post('/upload', authenticate, uploadDocument.single('file'), [
  body('title').trim().notEmpty(),
  body('description').optional().trim(),
  body('organizationId').optional().isUUID(),
  validate,
], documentController.upload);

router.delete('/:id', authenticate, documentController.remove);

export default router;
