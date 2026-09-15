/**
 * Reformata o corpo de erro do NestJS ({message, error, statusCode}) para o
 * contrato consumido pelo frontend: {detail}. Cópia 1:1 de
 * backend-presidente/src/http-exception.filter.ts.
 */
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();

    const detail =
      typeof body === 'string' ? body : ((body as { message?: string | string[] }).message ?? exception.message);

    response.status(status).json({ detail: Array.isArray(detail) ? detail.join(' ') : detail });
  }
}
