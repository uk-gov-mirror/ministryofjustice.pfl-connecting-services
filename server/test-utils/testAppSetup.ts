import express, { Express, Router } from 'express';
import createError from 'http-errors';

import errorHandler from '../errorHandler';
import setupPageVisitAnalytics from '../logging/setupPageVisitAnalytics';
import setupRequestLogging from '../logging/setupRequestLogging';
import setupAnalytics from '../middleware/setupAnalytics';
import setupAuthentication from '../middleware/setupAuthentication';
import setUpHealthCheck from '../middleware/setUpHealthCheck';
import setupHistory from '../middleware/setupHistory';
import setUpi18n, { setUpLocaleFromSession } from '../middleware/setUpi18n';
import setUpWebRequestParsing from '../middleware/setupRequestParsing';
import setupServiceNoLongerAvailable from '../middleware/setupServiceNoLongerAvailable';
import setupSessionTimeout from '../middleware/setupSessionTimeout';
import routes from '../routes';
import unauthenticatedRoutes from '../routes/unauthenticatedRoutes';
import nunjucksSetup from '../utils/nunjucksSetup';

import { flashMock, sessionMock } from './testMocks';

const testAppSetup = (): Express => {
  const app = express();
  
  app.disable('x-powered-by');
  app.use(setUpi18n());
  nunjucksSetup(app);
  app.use((request, _response, next) => {
    request.session = sessionMock;
    request.session.destroy = (callback) => {
      Object.keys(sessionMock).forEach((key) => {
        delete sessionMock[key as keyof typeof sessionMock];
      });
      if (callback) {
        callback(undefined as never);
      }
      return sessionMock as unknown as ReturnType<NonNullable<typeof request.session.destroy>>;
    };
    request.flash = flashMock;
    next();
  });
  app.use(setUpLocaleFromSession());
  app.use(setupSessionTimeout());
  app.use(setUpHealthCheck());
  app.use(setUpWebRequestParsing());
  app.use(setupAnalytics());
  app.use(setupHistory());
  app.use(setupServiceNoLongerAvailable());
  app.use(unauthenticatedRoutes());
  app.use(setupPageVisitAnalytics());
  app.use(setupRequestLogging());
  app.use(setupAuthentication());
  app.use(routes());

  const testRouter = Router();
  testRouter.get('/create-error', (_request, _response, next) => {
    next(new Error('An error happened!'));
  });
  testRouter.get('/create-timeout', (_request, _response, next) => {
    next(createError(403));
  });
  app.use(testRouter);

  app.use((_request, _response, next) => next(createError(404)));
  app.use(errorHandler());

  return app;
};

export default testAppSetup;
