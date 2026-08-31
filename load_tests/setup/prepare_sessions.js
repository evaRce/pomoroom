import { browser } from 'k6/x/browser';
import { sleep } from 'k6';
import { BASE_URL } from '../lib/config.js';
import { ALL_BUDDIES } from '../lib/buddies.js';

const LOGIN_RATE_LIMIT_COOLDOWN_S = 22;

const CONCURRENT_USERS = Math.min(Number(__ENV.CONCURRENT_USERS || 20), ALL_BUDDIES.length);
const BUDDIES = ALL_BUDDIES.slice(0, CONCURRENT_USERS);

export const options = {
  scenarios: {
    prepare_sessions: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: `${BUDDIES.length * (LOGIN_RATE_LIMIT_COOLDOWN_S + 10) + 30}s`,
      options: { browser: { type: 'chromium' } },
    },
  },
};

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.locator('#normal_login_email').type(email);
  await page.locator('#normal_login_password').type(password);
  await page.locator('button[type="submit"]').click();
  let elapsed = 0;
  while (!page.url().includes('/chat') && elapsed < 5000) {
    await page.waitForTimeout(50);
    elapsed += 50;
  }
  return page.url().includes('/chat');
}

export default async function () {
  const sessions = [];

  for (let i = 0; i < BUDDIES.length; i++) {
    if (i > 0) {
      sleep(LOGIN_RATE_LIMIT_COOLDOWN_S);
    }
    const buddy = BUDDIES[i];
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      const loggedIn = await login(page, buddy.email, buddy.password);
      if (!loggedIn) {
        throw new Error(`no se pudo autenticar a ${buddy.nickname}`);
      }
      const cookies = await context.cookies();
      sessions.push({ nickname: buddy.nickname, cookies });
    } finally {
      await context.close();
    }
  }

  console.log('SESSIONS_JSON:' + JSON.stringify({ sessions }));
}
