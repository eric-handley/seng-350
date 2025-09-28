import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Log the validation error for debugging
    this.logger.error(
      `Validation failed for ${request.method} ${request.url}`,
      {
        body: request.body,
        query: request.query,
        params: request.params,
        error: exceptionResponse,
      },
    );

    // Format the error response for better user experience
    let errorMessage;
    let details;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, unknown>;
      
      if (Array.isArray(responseObj.message)) {
        // Validation errors from class-validator
        errorMessage = 'Validation failed';
        details = responseObj.message;
      } else if (responseObj.message) {
        errorMessage = responseObj.message;
        details = responseObj.error ?? 'Bad Request';
      } else {
        errorMessage = 'Bad Request';
        details = responseObj;
      }
    } else {
      errorMessage = exceptionResponse || 'Bad Request';
    }

    const errorResponse = {
      statusCode: status,
      error: errorMessage,
      details: details,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    response.status(status).json(errorResponse);
  }
}