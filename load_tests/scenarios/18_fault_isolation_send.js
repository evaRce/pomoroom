// Envía un mensaje de una persona a otra concreta, para ver
// si un fallo en una sala afecta solo a esa sala o a todas.
import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { BASE_URL } from '../lib/config.js';

const { sessions: allSessions } = JSON.parse(open('../setup/sessions.json'));
const SENDER_NICKNAME = __ENV.SENDER_NICKNAME;
const TARGET_NAME = __ENV.TARGET_NAME;
const LABEL = __ENV.LABEL || 'send';

const senderSession = allSessions.find((s) => s.nickname === SENDER_NICKNAME);

export const options = {
  scenarios: {
    fault_isolation_send: {
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
    }, TARGET_NAME);
    check(opened, { [`${LABEL}: conversación ${TARGET_NAME} visible`]: (v) => v });

    if (!opened) {
      console.log(`RESULT:${LABEL}:conversation_not_found`);
      return;
    }

    const messageText = `fault-${LABEL}-${Date.now()}`;
    const input = page.locator('[aria-label="Escribe un mensaje"]');
    await input.waitFor({ timeout: 5000 });
    await input.type(messageText);
    await input.press('Enter');

    let elapsed = 0;
    let sent = false;
    while (elapsed < 8000) {
      sent = await page.evaluate(
        (text) => Array.from(document.querySelectorAll('.chat-bubble')).some((el) => el.textContent.includes(text)),
        messageText
      );
      if (sent) break;
      await page.waitForTimeout(50);
      elapsed += 50;
    }

    check(sent, { [`${LABEL}: mensaje visible`]: (v) => v });
    console.log(`RESULT:${LABEL}:${sent ? 'ok' : 'fail'}`);
  } finally {
    await context.close();
  }
}
