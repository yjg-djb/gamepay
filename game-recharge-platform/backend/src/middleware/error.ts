import type { NextFunction, Request, Response } from 'express';
import { logger } from '../logger';

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: 'not_found', message: `No route: ${req.method} ${req.path}` });
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  logger.error({ err }, 'Unhandled error');
  const status = typeof err?.status === 'number' ? err.status : 500;
  res.status(status).json({
    error: 'internal_error',
    message: status === 500 ? 'Internal server error' : err?.message,
  });
}













