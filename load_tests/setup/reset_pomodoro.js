import { browser } from 'k6/x/browser';
import { BASE_URL } from '../lib/config.js';

const EVA_EMAIL = 'eva@gmail.com';
const EVA_PASSWORD = 'eva12345';
const GROUP_NAME = 'load_test_room';
const PLUGIN_TAB_TITLE = 'Temporizador Pomodoro';

export const options = {
  scenarios: {
    reset: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '30s',
      options: { browser: { type: 'chromium' } },
    },
  },
};

export default async function () {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('#normal_login_email').type(EVA_EMAIL);
    await page.locator('#normal_login_password').type(EVA_PASSWORD);
    await page.locator('button[type="submit"]').click();

    let elapsed = 0;
    while (!page.url().includes('/chat') && elapsed < 10000) {
      await page.waitForTimeout(50);
      elapsed += 50;
    }

    let navElapsed = 0;
    let clicked = false;
    while (navElapsed < 5000 && !clicked) {
      clicked = await page.evaluate((groupName) => {
        const nav = document.querySelector('[aria-label="Conversaciones"]');
        if (!nav) return false;
        const item = Array.from(nav.querySelectorAll('[role="button"]')).find(
          (el) => el.textContent && el.textContent.includes(groupName)
        );
        if (!item) return false;
        item.click();
        return true;
      }, GROUP_NAME);
      if (!clicked) {
        await page.waitForTimeout(100);
        navElapsed += 100;
      }
    }
    await page.waitForTimeout(500);

    await page.evaluate((title) => {
      const btn = Array.from(document.querySelectorAll('button')).find((el) => el.title === title);
      if (btn) btn.click();
    }, PLUGIN_TAB_TITLE);
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const pause = document.querySelector('[aria-label="Pausar temporizador"]');
      if (pause) pause.click();
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const reset = document.querySelector('[aria-label="Reiniciar temporizador"]');
      if (reset) reset.click();
    });
    await page.waitForTimeout(300);
  } finally {
    await context.close();
  }
}
