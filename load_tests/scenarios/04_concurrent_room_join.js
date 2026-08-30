import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../lib/config.js';

const { sessions: allSessions } = JSON.parse(open('../setup/sessions.json'));
const sessions = allSessions.slice(0, Number(__ENV.VUS || allSessions.length));

const CONTACT_NAME = 'eva123';
const roomJoinDuration = new Trend('room_join_duration_ms', true);

export const options = {
  scenarios: {
    concurrent_room_join: {
      executor: 'per-vu-iterations',
      vus: sessions.length,
      iterations: 1,
      maxDuration: '1m',
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default async function () {
  const session = sessions[(__VU - 1) % sessions.length];
  const context = await browser.newContext();
  try {
    await context.addCookies(session.cookies);
    const page = await context.newPage();

    const start = Date.now();
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle' });

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
    check(clicked, { [`${session.nickname}: conversación con ${CONTACT_NAME} visible`]: (v) => v });

    let elapsed = 0;
    let ready = false;
    while (elapsed < 5000) {
      ready = await page.evaluate(
        (contactName) => {
          const header = document.querySelector('header');
          return !!header && header.textContent.includes(contactName);
        },
        CONTACT_NAME
      );
      if (ready) break;
      await page.waitForTimeout(50);
      elapsed += 50;
    }
    roomJoinDuration.add(Date.now() - start);

    check(ready, { [`${session.nickname}: UI de chat lista`]: (v) => v });
  } finally {
    await context.close();
  }
}
