// Mide enviar mensajes cuando cada usuario escribe en su
// propio chat privado, todos a la vez.
import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../lib/config.js';

const { sessions: allSessions } = JSON.parse(open('../setup/sessions.json'));
const sessions = allSessions.slice(0, Number(__ENV.VUS || allSessions.length));

const CONTACT_NAME = 'eva123';
const messageSendDuration = new Trend('message_send_duration_ms', true);

export const options = {
  scenarios: {
    concurrent_message_diff_rooms: {
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
  const messageText = `msg-${session.nickname}-${Date.now()}`;
  const context = await browser.newContext();
  try {
    await context.addCookies(session.cookies);
    const page = await context.newPage();

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

    const input = page.locator('[aria-label="Escribe un mensaje"]');
    await input.waitFor();
    await input.type(messageText);

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

    check(sent, { [`${session.nickname}: mensaje visible con ${CONTACT_NAME}`]: (v) => v });
  } finally {
    await context.close();
  }
}
