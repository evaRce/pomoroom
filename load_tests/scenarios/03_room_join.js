import { browser } from 'k6/x/browser';
import { check, sleep } from 'k6';
import { BASE_URL } from '../lib/config.js';

const EMAIL = 'eva@gmail.com';
const PASSWORD = 'eva12345';
const CONTACT_NAME = 'buddy123';

export const options = {
  scenarios: {
    room_join: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 3,
      maxDuration: '1m',
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default async function () {
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('#normal_login_email').type(EMAIL);
    await page.locator('#normal_login_password').type(PASSWORD);
    await page.locator('button[type="submit"]').click();

    let elapsed = 0;
    while (!page.url().includes('/chat') && elapsed < 5000) {
      await page.waitForTimeout(50);
      elapsed += 50;
    }
    await page.waitForTimeout(500);

    const start = Date.now();
    const clicked = await page.evaluate(
      (contactName) => {
        const nav = document.querySelector('[aria-label="Conversaciones"]');
        if (!nav) return false;
        const item = Array.from(nav.querySelectorAll('[role="button"]')).find(
          (el) => el.textContent && el.textContent.includes(contactName)
        );
        if (!item) return false;
        item.click();
        return true;
      },
      CONTACT_NAME
    );
    check(clicked, { 'conversación con buddy123 visible': (v) => v });

    let joinedElapsed = 0;
    let ready = false;
    while (joinedElapsed < 5000) {
      ready = await page.evaluate(
        (contactName) => {
          const header = document.querySelector('header');
          return !!header && header.textContent.includes(contactName);
        },
        CONTACT_NAME
      );
      if (ready) break;
      await page.waitForTimeout(50);
      joinedElapsed += 50;
    }
    const roomJoinDurationMs = Date.now() - start;

    check(ready, { 'UI de chat lista (nombre de contacto visible)': (v) => v });
    console.log(`room_join_duration_ms=${roomJoinDurationMs}`);
  } finally {
    await page.close();
  }

  sleep(20);
}
