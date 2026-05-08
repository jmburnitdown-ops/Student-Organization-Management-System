import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { AuthenticatedRequest } from '../types';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({ success: true, message: 'Registration successful', data: result });
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.loginUser(req.body);
    res.json({ success: true, message: 'Login successful', data: result });
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) { next(err); }
}

export async function me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

export function logout(_req: Request, res: Response) {
  res.json({ success: true, message: 'Logged out successfully' });
}
