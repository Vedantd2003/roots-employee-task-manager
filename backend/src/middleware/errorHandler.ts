import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Mongoose / MongoDB errors
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;

    // Mongoose ValidationError
    if (e['name'] === 'ValidationError' && e['errors']) {
      const errors = Object.values(e['errors'] as Record<string, { message: string }>).map(
        (ve) => ve.message
      );
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
      return;
    }

    // Mongoose CastError (bad ObjectId)
    if (e['name'] === 'CastError') {
      res.status(404).json({
        success: false,
        message: 'Resource not found (invalid ID format)',
      });
      return;
    }

    // MongoDB duplicate key
    if (e['code'] === 11000) {
      const keyValue = e['keyValue'] as Record<string, unknown> | undefined;
      const field = keyValue ? Object.keys(keyValue)[0] : 'field';
      res.status(409).json({
        success: false,
        message: `Duplicate value for ${field}`,
      });
      return;
    }
  }

  // Default 500
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
