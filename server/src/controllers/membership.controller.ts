import { Response, NextFunction } from 'express';
import * as membershipService from '../services/membership.service';
import { AuthenticatedRequest } from '../types';

export async function join(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await membershipService.joinOrganization(req.user!.id, req.params.orgId);
    res.status(201).json({ success: true, message: 'Join request submitted', data: result });
  } catch (err) { next(err); }
}

export async function leave(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await membershipService.leaveOrganization(req.user!.id, req.params.orgId);
    res.json({ success: true, message: 'Left organization' });
  } catch (err) { next(err); }
}

export async function approve(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await membershipService.updateMembershipStatus(req.params.id, 'APPROVED');
    res.json({ success: true, message: 'Member approved', data: result });
  } catch (err) { next(err); }
}

export async function reject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await membershipService.updateMembershipStatus(req.params.id, 'REJECTED');
    res.json({ success: true, message: 'Member rejected', data: result });
  } catch (err) { next(err); }
}

export async function myMemberships(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await membershipService.getMyMemberships(req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}
