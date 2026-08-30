import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../lib/config.js';

const VUS = Number(__ENV.VUS || 20);
const RUN_ID = Date.now().toString().slice(-8);
const signupDuration = new Trend('signup_duration_ms', true);

export const options = {
  scenarios: {
    concurrent_signup: {
      executor: 'per-vu-iterations',
      vus: VUS,
      iterations: 1,
      maxDuration: '1m',
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

function currentUrl(page) {
  try {
    return page.url();
  } catch (err) {
    return '';
  }
}

export default async function () {
  const unique = `${RUN_ID}${__VU}`;
  const email = `loadtest.concurrent.${unique}@example.com`;
  const nickname = `ltc${unique}`;
  const context = await browser.newContext();
  try {
    const page = await context.newPage();

    const start = Date.now();
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' });
    await page.locator('#normal_signup_email').type(email);
    await page.locator('#normal_signup_password').type('LoadTest12345');
    await page.locator('#normal_signup_confirmPassword').type('LoadTest12345');
    await page.locator('#normal_signup_nickname').type(nickname);
    await page.locator('button[type="submit"]').click();

    let elapsed = 0;
    while (!currentUrl(page).includes('/chat') && elapsed < 30000) {
      await page.waitForTimeout(50);
      elapsed += 50;
    }
    signupDuration.add(Date.now() - start);

    check(currentUrl(page), {
      [`VU${__VU}: signup redirige a /chat`]: (url) => url.includes('/chat'),
    });
  } finally {
    await context.close();
  }
}
