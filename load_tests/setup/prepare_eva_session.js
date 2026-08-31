import { browser } from 'k6/x/browser';
import { BASE_URL } from '../lib/config.js';

const EVA_EMAIL = 'eva@gmail.com';
const EVA_PASSWORD = 'eva12345';

export const options = {
  scenarios: {
    prepare_eva_session: {
      executor: 'per-vu-iterations',
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
    while (!page.url().includes('/chat') && elapsed < 5000) {
      await page.waitForTimeout(50);
      elapsed += 50;
    }
    if (!page.url().includes('/chat')) {
      throw new Error('no se pudo autenticar a eva123');
    }

    const cookies = await context.cookies();
    console.log('SESSION_JSON:' + JSON.stringify({ nickname: 'eva123', cookies }));
  } finally {
    await context.close();
  }
}
