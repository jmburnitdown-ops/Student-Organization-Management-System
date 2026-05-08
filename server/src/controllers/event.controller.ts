import { Response, NextFunction } from 'express';
import * as eventService from '../services/event.service';
import { AuthenticatedRequest } from '../types';

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await eventService.listEvents(req.query as any);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await eventService.getEventById(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await eventService.createEvent(req.body);
    res.status(201).json({ success: true, message: 'Event created', data: result });
  } catch (err) { next(err); }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await eventService.updateEvent(req.params.id, req.body);
    res.json({ success: true, message: 'Event updated', data: result });
  } catch (err) { next(err); }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await eventService.deleteEvent(req.params.id);
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) { next(err); }
}
