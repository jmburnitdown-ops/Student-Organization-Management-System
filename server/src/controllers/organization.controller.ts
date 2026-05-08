import { Response, NextFunction } from 'express';
import * as orgService from '../services/organization.service';
import { AuthenticatedRequest } from '../types';

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await orgService.listOrganizations(req.query as any);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await orgService.getOrganizationById(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await orgService.createOrganization(req.body, req.user!.id);
    res.status(201).json({ success: true, message: 'Organization created', data: result });
  } catch (err) { next(err); }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await orgService.updateOrganization(req.params.id, req.body);
    res.json({ success: true, message: 'Organization updated', data: result });
  } catch (err) { next(err); }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await orgService.deleteOrganization(req.params.id);
    res.json({ success: true, message: 'Organization deactivated' });
  } catch (err) { next(err); }
}

export async function getMembers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await orgService.getOrgMembers(req.params.id, req.query as any);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}
