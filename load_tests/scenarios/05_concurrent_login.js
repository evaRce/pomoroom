// Mide cuánto tardan varios usuarios en iniciar sesión a la vez.
import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../lib/config.js';
import { ALL_BUDDIES } from '../lib/buddies.js';

const buddies = ALL_BUDDIES.slice(0, Number(__ENV.VUS || ALL_BUDDIES.length));
const loginDuration = new Trend('login_duration_ms', true);

export const options = {
  scenarios: {
    concurrent_login: {
      executor: 'per-vu-iterations',
      vus: buddies.length,
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
  const buddy = buddies[(__VU - 1) % buddies.length];
  const context = await browser.newContext();
  try {
    const page = await context.newPage();

    const start = Date.now();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('#normal_login_email').type(buddy.email);
    await page.locator('#normal_login_password').type(buddy.password);
    await page.locator('button[type="submit"]').click();

    let elapsed = 0;
    while (!currentUrl(page).includes('/chat') && elapsed < 30000) {
      await page.waitForTimeout(50);
      elapsed += 50;
    }
    loginDuration.add(Date.now() - start);

    check(currentUrl(page), {
      [`${buddy.nickname}: login redirige a /chat`]: (url) => url.includes('/chat'),
    });
  } finally {
    await context.close();
  }
}
