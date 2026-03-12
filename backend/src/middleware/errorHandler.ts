import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? 500;
  const message = err.message ?? 'Internal Server Error';
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  } else {
    console.error(message, err.name);
  }
  res.status(status).json({
    error: status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
    status,
  });
}
