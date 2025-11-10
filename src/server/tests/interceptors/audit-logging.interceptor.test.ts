import { CallHandler, ExecutionContext, HttpException } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { AuditLoggingInterceptor } from '../../src/shared/interceptors/audit-logging.interceptor';
import { AuditLogsService } from '../../src/services/audit-logs.service';

const createExecutionContext = (request: Record<string, any>, response: Record<string, any>) =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  }) as ExecutionContext;

const createCallHandler = (observable: ReturnType<CallHandler['handle']>) =>
  ({ handle: () => observable } as CallHandler);

describe('AuditLoggingInterceptor', () => {
  let interceptor: AuditLoggingInterceptor;
  let auditLogsService: jest.Mocked<AuditLogsService>;

  beforeEach(() => {
    auditLogsService = {
      createAuditLog: jest.fn().mockResolvedValue(undefined),
      logApiError: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditLogsService>;

    interceptor = new AuditLoggingInterceptor(auditLogsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('logs successful requests with parsed route/query parameters', async () => {
    const request = {
      method: 'GET',
      route: { path: '/api/bookings/:id' },
      url: '/api/bookings/abc-123?force=true',
      body: { payload: 'value' },
      user: { id: 'user-1' },
    };
    const response = { statusCode: 200 };

    const result$ = interceptor.intercept(
      createExecutionContext(request, response),
      createCallHandler(of(null)),
    );

    await lastValueFrom(result$);

    expect(auditLogsService.createAuditLog).toHaveBeenCalledWith(
      'user-1',
      'READ',
      '/bookings',
      { force: 'true', id: 'abc-123' },
      request.body,
    );
  });

  it('skips audit logging for configured skip routes', async () => {
    const request = {
      method: 'POST',
      route: { path: '/api/auth/login' },
      url: '/api/auth/login',
      body: {},
    };
    const response = { statusCode: 200 };

    const result$ = interceptor.intercept(
      createExecutionContext(request, response),
      createCallHandler(of(null)),
    );

    await lastValueFrom(result$);

    expect(auditLogsService.createAuditLog).not.toHaveBeenCalled();
  });

  it('logs errors via auditLogsService when an unexpected error occurs', async () => {
    const error = new Error('boom');
    const request = {
      method: 'DELETE',
      route: { path: '/api/rooms/:id' },
      url: '/api/rooms/room-1',
      body: {},
    };
    const response = { statusCode: 500 };

    const result$ = interceptor.intercept(
      createExecutionContext(request, response),
      createCallHandler(throwError(() => error)),
    );

    await expect(lastValueFrom(result$)).rejects.toThrow(error);

    expect(auditLogsService.logApiError).toHaveBeenCalledWith(request, 500);
  });

  it('maps HttpException status to audit log error action', async () => {
    const httpException = new HttpException('bad', 400);
    const request = {
      method: 'PATCH',
      route: { path: '/api/buildings/:id' },
      url: '/api/buildings/bldg-1',
      body: {},
    };
    const response = { statusCode: 500 };

    const result$ = interceptor.intercept(
      createExecutionContext(request, response),
      createCallHandler(throwError(() => httpException)),
    );

    await expect(lastValueFrom(result$)).rejects.toThrow(httpException);

    expect(auditLogsService.logApiError).toHaveBeenCalledWith(request, 400);
  });
});
