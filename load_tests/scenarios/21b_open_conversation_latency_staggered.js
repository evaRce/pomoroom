// Igual que 21, pero los usuarios no abren el chat todos a
// la vez: entran poco a poco, como en el uso real.
import { browser } from 'k6/x/browser';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../lib/config.js';

const { sessions: allSessions } = JSON.parse(open('../setup/sessions.json'));
const CONV_TYPE = __ENV.CONV_TYPE || 'group';
const CONTACT_NAME = CONV_TYPE === 'group' ? 'load_test_room' : 'eva123';
const GROUP_MEMBER_NICKNAMES = Array.from({ length: 19 }, (_, i) => `buddy${127 + i}`);
const eligibleSessions =
  CONV_TYPE === 'group' ? allSessions.filter((s) => GROUP_MEMBER_NICKNAMES.includes(s.nickname)) : allSessions;
const sessions = eligibleSessions.slice(0, Number(__ENV.VUS || eligibleSessions.length));

// Only BATCH_SIZE browsers open at the very start; the rest trickle in one every
// STAGGER_INTERVAL_MS. This lets VUS go past ~9 without the test laptop itself
// running out of resources (which looks like an app failure but isn't) — real
// users don't all click at the exact same millisecond either.
const BATCH_SIZE = Number(__ENV.BATCH_SIZE || 3);
const STAGGER_INTERVAL_MS = Number(__ENV.STAGGER_INTERVAL_MS || 2000);

const openConversationDuration = new Trend('open_conversation_duration_ms', true);

export const options = {
  scenarios: {
    open_conversation_staggered: {
      executor: 'per-vu-iterations',
      vus: sessions.length,
      iterations: 1,
      maxDuration: '3m',
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default async function () {
  const session = sessions[(__VU - 1) % sessions.length];

  const wave = __VU <= BATCH_SIZE ? 0 : __VU - BATCH_SIZE;
  if (wave > 0) {
    sleep((wave * STAGGER_INTERVAL_MS) / 1000);
  }

  const context = await browser.newContext();
  try {
    await context.addCookies(session.cookies);
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'load' });

    const navDeadline = Date.now() + 10000;
    let navReady = false;
    while (Date.now() < navDeadline) {
      navReady = await page.evaluate(
        (name) => {
          const nav = document.querySelector('[aria-label="Conversaciones"]');
          if (!nav) return false;
          return Array.from(nav.querySelectorAll('[role="button"]')).some(
            (el) => el.textContent && el.textContent.includes(name)
          );
        },
        CONTACT_NAME
      );
      if (navReady) break;
      await page.waitForTimeout(50);
    }
    check(navReady, { [`${session.nickname}: ${CONTACT_NAME} visible en la barra lateral`]: (v) => v });

    const start = Date.now();
    const clicked = await page.evaluate(
      (name) => {
        const nav = document.querySelector('[aria-label="Conversaciones"]');
        if (!nav) return false;
        const item = Array.from(nav.querySelectorAll('[role="button"]')).find(
          (el) => el.textContent && el.textContent.includes(name)
        );
        if (!item) return false;
        item.click();
        return true;
      },
      CONTACT_NAME
    );

    const readyDeadline = Date.now() + 10000;
    let ready = false;
    while (Date.now() < readyDeadline) {
      ready = await page.evaluate(
        (name) => {
          const header = document.querySelector('header');
          return !!header && header.textContent.includes(name);
        },
        CONTACT_NAME
      );
      if (ready) break;
      await page.waitForTimeout(50);
    }
    openConversationDuration.add(Date.now() - start);

    check(clicked && ready, { [`${session.nickname}: conversación con ${CONTACT_NAME} abierta`]: (v) => v });
  } finally {
    await context.close();
  }
}
