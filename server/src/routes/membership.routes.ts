import { Router } from 'express';
import * as membershipController from '../controllers/membership.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/my', authenticate, membershipController.myMemberships);
router.post('/join/:orgId', authenticate, membershipController.join);
router.delete('/leave/:orgId', authenticate, membershipController.leave);
router.patch('/:id/approve', authenticate, requireAdmin, membershipController.approve);
router.patch('/:id/reject', authenticate, requireAdmin, membershipController.reject);

export default router;
