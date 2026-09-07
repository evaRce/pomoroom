// Igual que 07, pero los usuarios no escriben todos a la
// vez: acceden poco a poco, como en el uso real de la app.
import { browser } from 'k6/x/browser';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../lib/config.js';

const { sessions: allSessions } = JSON.parse(open('../setup/sessions.json'));

const GROUP_NAME = 'load_test_room';
const GROUP_MEMBER_NICKNAMES = Array.from({ length: 19 }, (_, i) => `buddy${127 + i}`);
const groupSessions = allSessions.filter((s) => GROUP_MEMBER_NICKNAMES.includes(s.nickname));
const sessions = groupSessions.slice(0, Number(__ENV.VUS || groupSessions.length));

// Only BATCH_SIZE people hit "send" at (roughly) the same instant; the rest space
// their own send out over SEND_INTERVAL_MS, like a real conversation where people
// don't all type in perfect lockstep — some overlap, most don't.
const BATCH_SIZE = Number(__ENV.BATCH_SIZE || 2);
const SEND_INTERVAL_MS = Number(__ENV.SEND_INTERVAL_MS || 1500);

const messageSendDuration = new Trend('message_send_duration_ms', true);

export const options = {
  scenarios: {
    message_staggered_same_room: {
      executor: 'per-vu-iterations',
      vus: sessions.length,
      iterations: 1,
      maxDuration: '2m',
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default async function () {
  const session = sessions[(__VU - 1) % sessions.length];
  const messageText = `msg-${session.nickname}-${Date.now()}`;

  const context = await browser.newContext();
  try {
    await context.addCookies(session.cookies);
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle' });

    const clicked = await page.evaluate(
      (groupName) => {
        const nav = document.querySelector('[aria-label="Conversaciones"]');
        if (!nav) return false;
        const item = Array.from(nav.querySelectorAll('[role="button"]')).find(
          (el) => el.textContent && el.textContent.includes(groupName)
        );
        if (!item) return false;
        item.click();
        return true;
      },
      GROUP_NAME
    );
    check(clicked, { [`${session.nickname}: sala ${GROUP_NAME} visible`]: (v) => v });

    const input = page.locator('[aria-label="Escribe un mensaje"]');
    await input.waitFor();
    await input.type(messageText);

    // Wait to send is staggered per VU, but the browser/page is already open and
    // ready beforehand — only the moment of pressing Enter is spaced out, which is
    // what actually matters for "do people send at the same time or not".
    const wave = __VU <= BATCH_SIZE ? 0 : __VU - BATCH_SIZE;
    if (wave > 0) {
      sleep((wave * SEND_INTERVAL_MS) / 1000);
    }

    const start = Date.now();
    await input.press('Enter');

    let sent = false;
    while (Date.now() - start < 10000) {
      sent = await page.evaluate(
        (text) => Array.from(document.querySelectorAll('.chat-bubble')).some((el) => el.textContent.includes(text)),
        messageText
      );
      if (sent) break;
      await page.waitForTimeout(50);
    }
    messageSendDuration.add(Date.now() - start);

    check(sent, { [`slot ${__VU} (${session.nickname}), oleada +${wave * SEND_INTERVAL_MS}ms: mensaje visible en ${GROUP_NAME}`]: (v) => v });
  } finally {
    await context.close();
  }
}
