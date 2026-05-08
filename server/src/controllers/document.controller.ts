import { Response, NextFunction } from 'express';
import * as documentService from '../services/document.service';
import { AuthenticatedRequest } from '../types';

export async function upload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'File is required' });
      return;
    }
    const { title, description, organizationId, isPublic } = req.body;
    const result = await documentService.uploadDocument(
      req.file,
      req.user!.id,
      title,
      description,
      organizationId,
      isPublic === 'true'
    );
    res.status(201).json({ success: true, message: 'Document uploaded', data: result });
  } catch (err) { next(err); }
}

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await documentService.listDocuments(req.user!.id, req.user!.role, req.query as any);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await documentService.deleteDocument(req.params.id, req.user!.id, req.user!.role);
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) { next(err); }
}
