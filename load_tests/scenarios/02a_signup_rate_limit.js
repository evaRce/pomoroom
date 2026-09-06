// Prueba que el límite de intentos de registro (3) funciona.
import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { BASE_URL } from '../lib/config.js';

const MAX_ATTEMPTS = 3;
const TOTAL_ATTEMPTS = Number(__ENV.ATTEMPTS || 10);

export const options = {
  scenarios: {
    signup_rate_limit: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: TOTAL_ATTEMPTS,
      maxDuration: '3m',
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
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' });
    await page.locator('#normal_signup_email').type('eva@gmail.com');
    await page.locator('#normal_signup_password').type('LoadTest12345');
    await page.locator('#normal_signup_confirmPassword').type('LoadTest12345');
    await page.locator('#normal_signup_nickname').type('ratelimittest');
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('p.sr-only[role="alert"]:not(:empty)');

    const message = (await page.locator('p.sr-only[role="alert"]').innerText()).trim();
    const shouldBeBlocked = __ITER >= MAX_ATTEMPTS;

    if (shouldBeBlocked) {
      check(message, {
        'intento extra bloqueado por rate limit': (m) => m.includes('Demasiados intentos'),
      });
    } else {
      check(message, {
        'intento dentro de cuota, rechazado por email duplicado': (m) =>
          m.length > 0 && !m.includes('Demasiados intentos'),
      });
    }
  } finally {
    await page.close();
  }
}
