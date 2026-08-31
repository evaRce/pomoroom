import { browser } from 'k6/x/browser';
import { check, sleep } from 'k6';
import { BASE_URL } from '../lib/config.js';

const EMAIL = 'eva@gmail.com';
const PASSWORD = 'eva12345';

export const options = {
  scenarios: {
    login_latency: {
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
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('#normal_login_email').type(EMAIL);
    await page.locator('#normal_login_password').type(PASSWORD);

    const start = Date.now();
    await page.locator('button[type="submit"]').click();

    let elapsed = 0;
    while (!page.url().includes('/chat') && elapsed < 5000) {
      await page.waitForTimeout(50);
      elapsed += 50;
    }
    const loginDurationMs = Date.now() - start;

    check(page.url(), {
      'login redirige a /chat': (url) => url.includes('/chat'),
    });
    console.log(`login_duration_ms=${loginDurationMs}`);
  } finally {
    await page.close();
  }

  sleep(20);
}
