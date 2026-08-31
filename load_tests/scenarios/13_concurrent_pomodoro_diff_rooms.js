import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../lib/config.js';

const { sessions: allSessions } = JSON.parse(open('../setup/sessions.json'));
const sessions = allSessions.slice(0, Number(__ENV.VUS || allSessions.length));

const CONTACT_NAME = 'eva123';
const PLUGIN_TAB_TITLE = 'Temporizador Pomodoro';

const pomodoroStartDuration = new Trend('pomodoro_start_duration_ms', true);

export const options = {
  scenarios: {
    concurrent_pomodoro_diff_rooms: {
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

async function retryClick(page, evalFn, arg, timeoutMs) {
  let elapsed = 0;
  let clicked = false;
  while (elapsed < timeoutMs && !clicked) {
    clicked = await page.evaluate(evalFn, arg);
    if (!clicked) {
      await page.waitForTimeout(100);
      elapsed += 100;
    }
  }
  return clicked;
}

export default async function () {
  const session = sessions[(__VU - 1) % sessions.length];
  const context = await browser.newContext();
  try {
    await context.addCookies(session.cookies);
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle' });

    const clickedRoom = await retryClick(
      page,
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
      CONTACT_NAME,
      5000
    );
    check(clickedRoom, { [`${session.nickname}: conversación con ${CONTACT_NAME} visible`]: (v) => v });

    const clickedTab = await retryClick(
      page,
      (title) => {
        const btn = Array.from(document.querySelectorAll('button')).find((el) => el.title === title);
        if (!btn) return false;
        btn.click();
        return true;
      },
      PLUGIN_TAB_TITLE,
      5000
    );
    check(clickedTab, { [`${session.nickname}: pestaña pomodoro visible`]: (v) => v });

    const start = Date.now();
    const clickedStart = await retryClick(
      page,
      () => {
        const btn = document.querySelector('[aria-label="Iniciar temporizador"]');
        if (!btn) return false;
        btn.click();
        return true;
      },
      null,
      5000
    );
    check(clickedStart, { [`${session.nickname}: botón iniciar disponible`]: (v) => v });

    let elapsed = 0;
    let running = false;
    while (elapsed < 10000) {
      running = await page.evaluate(
        () => !!document.querySelector('[aria-label="Pausar temporizador"]')
      );
      if (running) break;
      await page.waitForTimeout(50);
      elapsed += 50;
    }
    pomodoroStartDuration.add(Date.now() - start);

    check(running, { [`${session.nickname}: pomodoro propio corriendo`]: (v) => v });
  } finally {
    await context.close();
  }
}
