// Mide iniciar el Pomodoro cuando todos lo hacen a la vez
// en la misma sala de grupo.
import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../lib/config.js';

const { sessions: allSessions } = JSON.parse(open('../setup/sessions.json'));

const GROUP_NAME = 'load_test_room';
const PLUGIN_TAB_TITLE = 'Temporizador Pomodoro';
const GROUP_MEMBER_NICKNAMES = Array.from({ length: 19 }, (_, i) => `buddy${127 + i}`);
const groupSessions = allSessions.filter((s) => GROUP_MEMBER_NICKNAMES.includes(s.nickname));
const sessions = groupSessions.slice(0, Number(__ENV.VUS || groupSessions.length));

const pomodoroStartDuration = new Trend('pomodoro_start_duration_ms', true);

export const options = {
  scenarios: {
    concurrent_pomodoro_start: {
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

    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle' });

    const clickedRoom = await page.evaluate(
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
    check(clickedRoom, { [`${session.nickname}: sala ${GROUP_NAME} visible`]: (v) => v });

    let tabElapsed = 0;
    let clickedTab = false;
    while (tabElapsed < 5000 && !clickedTab) {
      clickedTab = await page.evaluate((title) => {
        const btn = Array.from(document.querySelectorAll('button')).find(
          (el) => el.title === title
        );
        if (!btn) return false;
        btn.click();
        return true;
      }, PLUGIN_TAB_TITLE);
      if (!clickedTab) {
        await page.waitForTimeout(100);
        tabElapsed += 100;
      }
    }
    check(clickedTab, { [`${session.nickname}: pestaña pomodoro visible`]: (v) => v });

    let startElapsed = 0;
    let startAttempted = false;
    while (startElapsed < 5000 && !startAttempted) {
      startAttempted = await page.evaluate(() => {
        const startBtn = document.querySelector('[aria-label="Iniciar temporizador"]');
        if (startBtn) {
          startBtn.click();
          return true;
        }
        return !!document.querySelector('[aria-label="Pausar temporizador"]');
      });
      if (!startAttempted) {
        await page.waitForTimeout(100);
        startElapsed += 100;
      }
    }

    const start = Date.now();
    check(startAttempted, {
      [`${session.nickname}: botón de control del temporizador disponible`]: (v) => v,
    });

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

    check(running, { [`${session.nickname}: pomodoro corriendo tras concurrencia`]: (v) => v });
  } finally {
    await context.close();
  }
}
