import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
    return;
  }

  // Prisma errors
  if (err.constructor.name === 'PrismaClientInitializationError') {
    res.status(500).json({
      success: false,
      message: 'Database connection failed for a Prisma-backed endpoint. Configure DATABASE_URL or migrate that endpoint to Supabase queries.',
    });
    return;
  }

  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as unknown as { code: string; meta?: { target?: string[] } };
    if (prismaErr.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: `Unique constraint failed on: ${prismaErr.meta?.target?.join(', ')}`,
      });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Record not found' });
      return;
    }
  }

  logger.error('Unhandled error:', { message: err.message, stack: err.stack });
  res.status(500).json({ success: false, message: 'Internal server error' });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ success: false, message: 'Route not found' });
}
