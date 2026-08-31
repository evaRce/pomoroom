import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { BASE_URL } from '../lib/config.js';

const { sessions: allSessions } = JSON.parse(open('../setup/sessions.json'));
const senderSession = allSessions.find((s) => s.nickname === 'buddy123');
const RECEIVER_NICKNAME = 'eva123';

const ATTEMPTS = Number(__ENV.ATTEMPTS || 20);
const MAX_MESSAGES = Number(__ENV.MAX_MESSAGES || 10);
const EXPECTED_ALLOWED = Math.min(ATTEMPTS, MAX_MESSAGES);

export const options = {
  scenarios: {
    message_rate_limit: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '2m',
      options: { browser: { type: 'chromium' } },
    },
  },
};

async function waitForOutcome(page, messageText) {
  let elapsed = 0;
  while (elapsed < 1500) {
    const outcome = await page.evaluate((text) => {
      const sent = Array.from(document.querySelectorAll('.chat-bubble')).some((el) =>
        el.textContent.includes(text)
      );
      if (sent) return 'allowed';
      const blocked = document.body.textContent.includes('demasiado rápido');
      if (blocked) return 'blocked';
      return null;
    }, messageText);
    if (outcome) return outcome;
    await page.waitForTimeout(50);
    elapsed += 50;
  }
  return 'timeout';
}

export default async function () {
  const context = await browser.newContext();
  try {
    await context.addCookies(senderSession.cookies);
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle' });

    const opened = await page.evaluate((name) => {
      const nav = document.querySelector('[aria-label="Conversaciones"]');
      if (!nav) return false;
      const item = Array.from(nav.querySelectorAll('[role="button"]')).find(
        (el) => el.textContent && el.textContent.includes(name)
      );
      if (!item) return false;
      item.click();
      return true;
    }, RECEIVER_NICKNAME);
    check(opened, { [`conversación con ${RECEIVER_NICKNAME} visible`]: (v) => v });

    const input = page.locator('[aria-label="Escribe un mensaje"]');
    await input.waitFor();

    let allowedCount = 0;
    let blockedCount = 0;
    let timeoutCount = 0;

    for (let i = 0; i < ATTEMPTS; i++) {
      const messageText = `hammer-${i}-${Date.now()}`;
      await input.type(messageText);
      await input.press('Enter');

      const outcome = await waitForOutcome(page, messageText);
      console.log(`ATTEMPT:${i}:${outcome}`);
      if (outcome === 'allowed') allowedCount += 1;
      else if (outcome === 'blocked') blockedCount += 1;
      else timeoutCount += 1;
    }

    const correctlyAllowed = Math.min(allowedCount, EXPECTED_ALLOWED);
    const correctlyBlocked = Math.min(blockedCount, ATTEMPTS - EXPECTED_ALLOWED);
    const correctPct = ((correctlyAllowed + correctlyBlocked) / ATTEMPTS) * 100;

    console.log(
      `SUMMARY:attempts=${ATTEMPTS} expected_allowed=${EXPECTED_ALLOWED} allowed=${allowedCount} blocked=${blockedCount} timeout=${timeoutCount} correct_pct=${correctPct.toFixed(1)}`
    );

    check(allowedCount, { [`bloqueo correcto: ${EXPECTED_ALLOWED} mensajes permitidos`]: (v) => v === EXPECTED_ALLOWED });
  } finally {
    await context.close();
  }
}
