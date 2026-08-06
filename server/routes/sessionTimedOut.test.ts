import { JSDOM } from 'jsdom';
import request from 'supertest';

import config from '../config';
import paths from '../constants/paths';
import testAppSetup from '../test-utils/testAppSetup';
import { sessionMock } from '../test-utils/testMocks';

const app = testAppSetup();

const TIMEOUT_TITLE = "Sorry, you'll have to start again";
const WELSH_TIMEOUT_TITLE = "Mae'n ddrwg gennym, mae'n rhaid i chi ddechrau eto";
const YOUR_SESSION_TEXT =
  "Your session automatically ends if you don’t use the service for 120 minutes.";
const PERSONAL_INFO_TEXT = "We haven’t saved any personal information.";
const START_AGAIN_TEXT = "You need to start again.";
const START_AGAIN_BUTTON_TEXT = "Start again";
const WELSH_START_AGAIN_BUTTON_TEXT = "Dechrau eto";

describe('timeOut page', () => {
  describe(`GET ${paths.SESSION_TIMED_OUT}`, () => {
    it('should render the session timeout page with 403 status', async () => {
      await request(app)
        .get(paths.SESSION_TIMED_OUT)
        .expect(403)
        .expect('Content-Type', /html/);
    });

    it('should render the session timeout heading', async () => {
      const response = await request(app).get(paths.SESSION_TIMED_OUT).expect(403);
      const dom = new JSDOM(response.text);

      expect(dom.window.document.querySelector('h1')).toHaveTextContent(TIMEOUT_TITLE);
    });

    it('should display session timeout guidance', async () => {
      const response = await request(app).get(paths.SESSION_TIMED_OUT).expect(403);

      expect(response.text).toContain(YOUR_SESSION_TEXT);
      expect(response.text).toContain(PERSONAL_INFO_TEXT);
      expect(response.text).toContain(START_AGAIN_TEXT);
    });

    it('should provide a start again button linking to child safety', async () => {
      const response = await request(app).get(paths.SESSION_TIMED_OUT).expect(403);
      const dom = new JSDOM(response.text);
      const startAgainButton = dom.window.document.querySelector('a.govuk-button');

      expect(startAgainButton).not.toBeNull();
      expect(startAgainButton?.textContent).toContain(START_AGAIN_BUTTON_TEXT);
      expect(startAgainButton?.getAttribute('href')).toBe(`${paths.CHILD_SAFETY}?lang=en`);
    });

    it('should render the timeout page in Welsh when lang query parameter is used', async () => {
      config.includeWelshLanguage = true;
      const welshApp = testAppSetup();

      const response = await request(welshApp).get(`${paths.SESSION_TIMED_OUT}?lang=cy`).expect(403);
      const dom = new JSDOM(response.text);

      expect(dom.window.document.querySelector('h1')).toHaveTextContent(WELSH_TIMEOUT_TITLE);
      expect(dom.window.document.querySelector('a.govuk-button')?.getAttribute('href')).toBe(
        `${paths.CHILD_SAFETY}?lang=cy`,
      );

      config.includeWelshLanguage = false;
    });

    it('should render the timeout page in Welsh when session language is Welsh', async () => {
      config.includeWelshLanguage = true;
      sessionMock.lang = 'cy';
      const welshApp = testAppSetup();

      const response = await request(welshApp).get(paths.SESSION_TIMED_OUT).expect(403);
      const dom = new JSDOM(response.text);

      expect(dom.window.document.querySelector('h1')).toHaveTextContent(WELSH_TIMEOUT_TITLE);
      expect(dom.window.document.querySelector('a.govuk-button')?.textContent).toContain(
        WELSH_START_AGAIN_BUTTON_TEXT,
      );
      expect(dom.window.document.querySelector('a.govuk-button')?.getAttribute('href')).toBe(
        `${paths.CHILD_SAFETY}?lang=cy`,
      );

      delete sessionMock.lang;
      config.includeWelshLanguage = false;
    });

    it('should have correct page title', async () => {
      const response = await request(app).get(paths.SESSION_TIMED_OUT).expect(403);
      const dom = new JSDOM(response.text);
      const title = dom.window.document.querySelector('title');

      expect(title).toHaveTextContent(TIMEOUT_TITLE);
      expect(title).toHaveTextContent('Get help finding a child arrangement option');
      expect(title).toHaveTextContent('GOV.UK');
    });

    it('should not expose the 403 status in production', async () => {
      config.production = true;

      const response = await request(app).get(paths.SESSION_TIMED_OUT).expect(403);

      expect(response.text).not.toContain('<h2>403</h2>');

      config.production = false;
    });

    it('should not render generic or not-found error pages', async () => {
      const response = await request(app).get(paths.SESSION_TIMED_OUT).expect(403);

      expect(response.text).not.toContain('Page not found');
      expect(response.text).not.toContain('Sorry, there is a problem with the service');
    });
  });

  describe('GET /create-timeout (error handler 403)', () => {
    it('should render the session timeout page with 403 status', async () => {
      await request(app)
        .get('/create-timeout')
        .expect(403)
        .expect('Content-Type', /html/);
    });

    it('should render the session timeout heading and guidance', async () => {
      const response = await request(app).get('/create-timeout').expect(403);
      const dom = new JSDOM(response.text);

      expect(dom.window.document.querySelector('h1')).toHaveTextContent(TIMEOUT_TITLE);
      expect(response.text).toContain(YOUR_SESSION_TEXT);
      expect(response.text).toContain(PERSONAL_INFO_TEXT);
      expect(response.text).toContain(START_AGAIN_TEXT);
    });

    it('should expose the 403 status in non-production environments', async () => {
      const response = await request(app).get('/create-timeout').expect(403);
      const dom = new JSDOM(response.text);

      expect(dom.window.document.querySelector('h2')).toHaveTextContent('403');
    });

    it('should provide a start again button linking to child safety', async () => {
      const response = await request(app).get('/create-timeout').expect(403);
      const dom = new JSDOM(response.text);
      const startAgainButton = dom.window.document.querySelector('a.govuk-button');

      expect(startAgainButton).not.toBeNull();
      expect(startAgainButton?.getAttribute('href')).toBe(`${paths.CHILD_SAFETY}?lang=en`);
    });
  });
});
