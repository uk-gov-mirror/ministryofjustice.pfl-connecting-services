import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';

import config from '../config';
import paths from '../constants/paths';
import logger from '../logging/logger';
import { hasUserStartedJourney } from '../utils/formProgressHelpers';
import sendSessionTimeoutResponse from '../utils/sendSessionTimeoutResponse';

const EXEMPT_PATH_PREFIXES = ['/assets', '/api/'];
const EXEMPT_PATHS = new Set<string>([paths.SESSION_TIMED_OUT, '/health', '/create-timeout', '/create-error']);

const ALWAYS_ALLOWED_PATHS = new Set<string>([paths.START, paths.CHILD_SAFETY, paths.PASSWORD]);

const STATIC_PAGE_PATHS = new Set<string>([
  paths.ACCESSIBILITY_STATEMENT,
  paths.CONTACT_US,
  paths.COOKIES,
  paths.PRIVACY_NOTICE,
  paths.TERMS_AND_CONDITIONS,
]);

const isExemptPath = (path: string): boolean =>
  EXEMPT_PATH_PREFIXES.some((prefix) => path.startsWith(prefix)) || EXEMPT_PATHS.has(path);

const isStaticPage = (path: string): boolean => STATIC_PAGE_PATHS.has(path);

const isSessionProtectedPath = (path: string): boolean =>
  !isExemptPath(path) && !ALWAYS_ALLOWED_PATHS.has(path) && !isStaticPage(path);

export const checkSessionTimeout = (request: Request, response: Response, next: NextFunction): void => {
  const path = request.path;
  const completedSteps: string[] = request.session?.completedSteps || [];
  const pageHistory: string[] = request.session?.pageHistory || [];
  const journeyStarted = hasUserStartedJourney(completedSteps, pageHistory);

  if (journeyStarted && path !== paths.SESSION_TIMED_OUT) {
    const locale = request.session?.lang || 'en';

    response.locals.sessionTimeoutMs = config.session.expiryMinutes * 60 * 1000;
    response.locals.sessionTimeoutSeconds = config.session.expiryMinutes * 60;
    response.locals.sessionTimeoutPath = `${paths.SESSION_TIMED_OUT}?lang=${locale}`;
  }

  if (
    journeyStarted &&
    request.session.cookie?.expires &&
    new Date() > new Date(request.session.cookie.expires)
  ) {
    logger.info('Session timed out for ' + request.originalUrl);
    const locale = request.session?.lang;

    request.session.destroy((error) => {
      if (error) {
        logger.error('Error destroying session after timeout', error);
      }
      sendSessionTimeoutResponse(request, response, locale);
    });
    return;
  }

  if (
    isSessionProtectedPath(path) &&
    !journeyStarted &&
    (request.method === 'GET' || request.method === 'POST')
  ) {
    logger.info('Session timed out for ' + request.originalUrl);
    sendSessionTimeoutResponse(request, response);
    return;
  }

  next();
};

const setupSessionTimeout = (): Router => {
  const router = Router();
  router.use(checkSessionTimeout);
  return router;
};

export default setupSessionTimeout;
