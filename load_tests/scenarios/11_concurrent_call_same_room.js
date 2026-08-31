import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../lib/config.js';

const { sessions: allSessions } = JSON.parse(open('../setup/sessions.json'));

const GROUP_NAME = 'load_test_room';
const JOIN_CALL_LABEL = 'Entrar a la sala';
const END_CALL_LABEL = 'Finalizar llamada';
const GROUP_MEMBER_NICKNAMES = Array.from({ length: 19 }, (_, i) => `buddy${127 + i}`);
const groupSessions = allSessions.filter((s) => GROUP_MEMBER_NICKNAMES.includes(s.nickname));
const sessions = groupSessions.slice(0, Number(__ENV.VUS || groupSessions.length));

const callJoinDuration = new Trend('call_join_duration_ms', true);

export const options = {
  scenarios: {
    concurrent_call_same_room: {
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
      GROUP_NAME,
      5000
    );
    check(clickedRoom, { [`${session.nickname}: sala ${GROUP_NAME} visible`]: (v) => v });

    const start = Date.now();
    const clickedJoin = await retryClick(
      page,
      (label) => {
        const btn = document.querySelector(`[aria-label="${label}"]`);
        if (!btn) return false;
        btn.click();
        return true;
      },
      JOIN_CALL_LABEL,
      5000
    );
    check(clickedJoin, { [`${session.nickname}: botón entrar a la sala visible`]: (v) => v });

    let elapsed = 0;
    let inCall = false;
    while (elapsed < 15000) {
      inCall = await page.evaluate(
        (label) => !!document.querySelector(`[aria-label="${label}"]`),
        END_CALL_LABEL
      );
      if (inCall) break;
      await page.waitForTimeout(100);
      elapsed += 100;
    }
    callJoinDuration.add(Date.now() - start);

    check(inCall, { [`${session.nickname}: conectado a la llamada`]: (v) => v });
  } finally {
    await context.close();
  }
}
