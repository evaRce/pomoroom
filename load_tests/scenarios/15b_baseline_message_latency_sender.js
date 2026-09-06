// Envía mensajes a eva123 espaciados en el tiempo, sin
// carga, para tener una referencia de latencia normal.
import { browser } from 'k6/x/browser';
import { check, sleep } from 'k6';
import { BASE_URL } from '../lib/config.js';

const { sessions: allSessions } = JSON.parse(open('../setup/sessions.json'));
const senderSession = allSessions.find((s) => s.nickname === 'buddy123');
const RECEIVER_NICKNAME = 'eva123';
const ITERATIONS = Number(__ENV.ITERATIONS || 10);
const GAP_BETWEEN_MESSAGES_S = Number(__ENV.MESSAGE_GAP_S || 3);
const STARTUP_DELAY_S = Number(__ENV.SENDER_STARTUP_DELAY_S || 5);

export const options = {
  scenarios: {
    baseline_message_latency_sender: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: `${STARTUP_DELAY_S + ITERATIONS * GAP_BETWEEN_MESSAGES_S + 30}s`,
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default async function () {
  sleep(STARTUP_DELAY_S);

  const context = await browser.newContext();
  try {
    await context.addCookies(senderSession.cookies);
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle' });

    const opened = await page.evaluate(
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
      RECEIVER_NICKNAME
    );
    check(opened, { [`conversación con ${RECEIVER_NICKNAME} visible`]: (v) => v });

    const input = page.locator('[aria-label="Escribe un mensaje"]');
    await input.waitFor();

    for (let i = 0; i < ITERATIONS; i++) {
      const messageText = `baseline-${Date.now()}`;
      await input.type(messageText);
      await input.press('Enter');
      console.log(`SENT:${messageText}`);
      sleep(GAP_BETWEEN_MESSAGES_S);
    }
  } finally {
    await context.close();
  }
}
