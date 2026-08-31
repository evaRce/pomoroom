import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { BASE_URL } from '../lib/config.js';

export const options = {
  scenarios: {
    signup_latency: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 3,
      maxDuration: '1m',
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
    browser_http_req_duration: ['p(95)<2000'],
  },
};

export default async function () {
  const page = await browser.newPage({ ignoreHTTPSErrors: true });
  try {
    const unique = `${Date.now()}${__ITER}`;
    const email = `loadtest.${unique}@example.com`;
    const nickname = `lt${unique}`.slice(0, 20);

    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' });
    await page.locator('#normal_signup_email').type(email);
    await page.locator('#normal_signup_password').type('LoadTest12345');
    await page.locator('#normal_signup_confirmPassword').type('LoadTest12345');
    await page.locator('#normal_signup_nickname').type(nickname);

    const start = Date.now();
    await page.locator('button[type="submit"]').click();

    let elapsed = 0;
    while (!page.url().includes('/chat') && elapsed < 5000) {
      await page.waitForTimeout(50);
      elapsed += 50;
    }
    const signupDurationMs = Date.now() - start;

    check(page.url(), {
      'signup redirige a /chat': (url) => url.includes('/chat'),
    });
    console.log(`signup_duration_ms=${signupDurationMs}`);
  } finally {
    await page.close();
  }
}
