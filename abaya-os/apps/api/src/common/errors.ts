import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

export class AppError extends HttpException {
  constructor(status: number, code: string, message?: string, details?: unknown) {
    super({ error: { code, message: message ?? code, details } }, status);
  }
}
export const notFound = (entity = 'resource') => new AppError(404, 'NOT_FOUND', `${entity} not found`);
export const badRequest = (code: string, message?: string, details?: unknown) => new AppError(400, code, message, details);
export const conflict = (code: string, message?: string) => new AppError(409, code, message);
export const forbidden = (code = 'FORBIDDEN', message?: string) => new AppError(403, code, message);
export const integrationNotConnected = (provider: string) =>
  new AppError(503, 'INTEGRATION_NOT_CONNECTED', `${provider} is not connected and verified for this store`, { provider });

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body && 'error' in body && typeof (body as any).error === 'object') {
        return res.status(status).json(body);
      }
      const message = typeof body === 'string' ? body : (body as any).message ?? exception.message;
      const code = status === 429 ? 'RATE_LIMITED' : HttpStatus[status] ?? 'ERROR';
      return res.status(status).json({ error: { code, message: Array.isArray(message) ? message.join(', ') : message } });
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        const target = (exception.meta?.target as string[] | string | undefined) ?? [];
        return res.status(409).json({ error: { code: 'UNIQUE_VIOLATION', message: 'Duplicate value', details: { fields: target } } });
      }
      if (exception.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Record not found' } });
      if (exception.code === 'P2003') return res.status(409).json({ error: { code: 'IN_USE', message: 'Record is referenced by other data' } });
    }
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } });
  }
}
