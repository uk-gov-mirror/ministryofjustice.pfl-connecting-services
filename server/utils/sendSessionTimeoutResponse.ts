import type { Request, Response } from 'express';

export default function sendSessionTimeoutResponse(
  request: Request,
  response: Response,
  locale?: string,
): void {
  const lang = locale || request.session?.lang;

  if (lang) {
    response.setLocale(lang);
  }

  response.status(403).render('pages/errors/timeOut', {
    title: request.__('errors.timeOut.title'),
  });
}
