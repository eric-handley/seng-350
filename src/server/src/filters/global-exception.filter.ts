import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { formatISO } from 'date-fns';

@Catch(HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Log the error for debugging (skip in test environment)
    if (process.env.SUPPRESS_LOGS !== 'true') {
      this.logger.error(
        `${exception.name} for ${request.method} ${request.url}`,
        {
          body: request.body,
          query: request.query,
          params: request.params,
          error: exceptionResponse,
        },
      );
    }

    // Format the error response for consistent format across all exceptions
    let errorMessage: string;
    let details: unknown;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, unknown>;

      if (Array.isArray(responseObj.message)) {
        // Validation errors from class-validator
        errorMessage = 'Validation failed';
        details = responseObj.message;
      } else if (responseObj.message) {
        // Standard HttpException with message
        errorMessage = responseObj.message as string;
        details = responseObj.error ?? exception.name;
      } else {
        errorMessage = exception.message ?? exception.name;
        details = responseObj;
      }
    } else {
      errorMessage = (exceptionResponse as string) ?? exception.message ?? exception.name;
      details = exception.name;
    }

    const errorResponse = {
      statusCode: status,
      message: errorMessage,
      error: details,
      timestamp: formatISO(new Date()),
      path: request.url,
      method: request.method,
    };

    response.status(status).json(errorResponse);
  }
}
