import { NextFunction, Request, Response } from 'express';

import config from '../config';
import paths from '../constants/paths';
import { sessionMock } from '../test-utils/testMocks';

import { checkSessionTimeout } from './setupSessionTimeout';

describe('setupSessionTimeout', () => {
  const createMockResponse = () => {
    const response = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
    } as unknown as Response;

    return response;
  };

  const runMiddleware = (request: Partial<Request>, response: Response) => {
    const next = jest.fn() as NextFunction;
    checkSessionTimeout(request as Request, response, next);
    return next;
  };

  it('should render the session timeout page for protected journey routes without a session', () => {
    const request = {
      path: paths.OTHER_OPTIONS,
      originalUrl: paths.OTHER_OPTIONS,
      method: 'GET',
      session: { completedSteps: [], pageHistory: [] },
      __: jest.fn().mockReturnValue('Session timed out'),
    } as unknown as Request;
    const response = createMockResponse();

    const next = runMiddleware(request, response);

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.render).toHaveBeenCalledWith('pages/errors/timeOut', expect.any(Object));
  });

  it('should inject session timeout config for active journeys', () => {
    const request = {
      path: paths.DOMESTIC_ABUSE,
      originalUrl: paths.DOMESTIC_ABUSE,
      method: 'GET',
      session: { completedSteps: [paths.CHILD_SAFETY], pageHistory: [paths.START, paths.CHILD_SAFETY] },
    } as unknown as Request;
    const response = createMockResponse();

    const next = runMiddleware(request, response);

    expect(next).toHaveBeenCalled();
    expect(response.locals.sessionTimeoutMs).toBe(config.session.expiryMinutes * 60 * 1000);
    expect(response.locals.sessionTimeoutSeconds).toBe(config.session.expiryMinutes * 60);
    expect(response.locals.sessionTimeoutPath).toBe(`${paths.SESSION_TIMED_OUT}?lang=en`);
  });

  it('should inject a Welsh session timeout path when the session language is Welsh', () => {
    const request = {
      path: paths.DOMESTIC_ABUSE,
      originalUrl: paths.DOMESTIC_ABUSE,
      method: 'GET',
      session: {
        completedSteps: [paths.CHILD_SAFETY],
        pageHistory: [paths.START, paths.CHILD_SAFETY],
        lang: 'cy',
      },
    } as unknown as Request;
    const response = createMockResponse();

    const next = runMiddleware(request, response);

    expect(next).toHaveBeenCalled();
    expect(response.locals.sessionTimeoutPath).toBe(`${paths.SESSION_TIMED_OUT}?lang=cy`);
  });

  it('should not inject session timeout config on the timeout page', () => {
    const request = {
      path: paths.SESSION_TIMED_OUT,
      originalUrl: paths.SESSION_TIMED_OUT,
      method: 'GET',
      session: { completedSteps: [paths.CHILD_SAFETY], pageHistory: [paths.START, paths.CHILD_SAFETY] },
    } as unknown as Request;
    const response = createMockResponse();

    const next = runMiddleware(request, response);

    expect(next).toHaveBeenCalled();
    expect(response.locals.sessionTimeoutMs).toBeUndefined();
  });

  it('should allow access to the start page without a session', () => {
    const request = {
      path: paths.START,
      originalUrl: paths.START,
      method: 'GET',
      session: { completedSteps: [], pageHistory: [] },
    } as unknown as Request;
    const response = createMockResponse();

    const next = runMiddleware(request, response);

    expect(next).toHaveBeenCalled();
    expect(response.render).not.toHaveBeenCalled();
  });
});
