// Se queda escuchando mensajes de buddy123 y mide cuánto
// tardan en llegar, sin ninguna otra carga (línea base).
import { browser } from 'k6/x/browser';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../lib/config.js';

const receiverSession = JSON.parse(open('../setup/eva_session.json'));
const SENDER_NICKNAME = 'buddy123';
const EXPECTED_MESSAGES = Number(__ENV.ITERATIONS || 10);
const RUN_DURATION_S = Number(__ENV.RECEIVER_DURATION_S || 90);

const messageLatency = new Trend('baseline_message_latency_ms', true);

export const options = {
  scenarios: {
    baseline_message_latency_receiver: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: `${RUN_DURATION_S + 30}s`,
      options: { browser: { type: 'chromium' } },
    },
  },
};

export default async function () {
  const context = await browser.newContext();
  try {
    await context.addCookies(receiverSession.cookies);
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
      SENDER_NICKNAME
    );
    if (!opened) {
      throw new Error(`no se pudo abrir la conversación con ${SENDER_NICKNAME}`);
    }

    const seen = new Set();
    let received = 0;
    const watchStart = Date.now();
    const deadline = watchStart + RUN_DURATION_S * 1000;

    while (Date.now() < deadline && received < EXPECTED_MESSAGES) {
      const texts = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.chat-bubble')).map((el) => el.textContent)
      );
      for (const text of texts) {
        const match = text && text.match(/baseline-(\d{13})/);
        if (!match || seen.has(match[0])) continue;
        const sentAt = Number(match[1]);
        if (sentAt < watchStart) continue;
        seen.add(match[0]);
        const latency = Date.now() - sentAt;
        messageLatency.add(latency);
        received += 1;
        console.log(`LATENCY_MS:${latency}`);
      }
      await page.waitForTimeout(20);
    }

    console.log(`RECEIVED:${received}/${EXPECTED_MESSAGES}`);
  } finally {
    await context.close();
  }
}
