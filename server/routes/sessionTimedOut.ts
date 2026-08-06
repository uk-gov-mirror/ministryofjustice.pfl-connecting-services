import type { Router } from 'express-serve-static-core';

import paths from '../constants/paths';
import logger from '../logging/logger';
import sendSessionTimeoutResponse from '../utils/sendSessionTimeoutResponse';

const sessionTimedOutRoutes = (router: Router) => {
  router.get(paths.SESSION_TIMED_OUT, (request, response) => {
    if (!request.session) {
      return sendSessionTimeoutResponse(request, response);
    }

    const locale = request.session.lang;

    request.session.destroy((error) => {
      if (error) {
        logger.error('Error destroying session after timeout', error);
      }

      sendSessionTimeoutResponse(request, response, locale);
    });
  });
};

export default sessionTimedOutRoutes;
