import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { BASE_URL } from '../lib/config.js';

const MAX_ATTEMPTS = 3;
const TOTAL_ATTEMPTS = Number(__ENV.ATTEMPTS || 10);

export const options = {
  scenarios: {
    login_rate_limit: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: TOTAL_ATTEMPTS,
      maxDuration: '1m',
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default async function () {
  const page = await browser.newPage({ ignoreHTTPSErrors: true });
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('#normal_login_email').type('eva@gmail.com');
    await page.locator('#normal_login_password').type('not-the-real-password');
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('[role="alert"]:not(:empty)');

    const message = (await page.locator('[role="alert"]').innerText()).trim();
    const shouldBeBlocked = __ITER >= MAX_ATTEMPTS;

    if (shouldBeBlocked) {
      check(message, {
        'intento extra bloqueado por rate limit': (m) => m.includes('Demasiados intentos'),
      });
    } else {
      check(message, {
        'intento dentro de cuota, rechazado por credenciales': (m) =>
          m.includes('no son válidos'),
      });
    }
  } finally {
    await page.close();
  }
}
