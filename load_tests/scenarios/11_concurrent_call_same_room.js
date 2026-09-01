import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../lib/config.js';

const { sessions: allSessions } = JSON.parse(open('../setup/sessions.json'));

const GROUP_NAME = 'load_test_room';
const JOIN_CALL_LABEL = 'Entrar a la sala';
const END_CALL_LABEL = 'Finalizar llamada';
const REJECTION_TEXTS = [
  'No se pudo entrar a la llamada: acceso no autorizado.',
  'No se pudo conectar a la llamada. Inténtalo de nuevo.',
  'No se pudo contactar con el servidor de llamadas. Revisa tu conexión a internet e inténtalo de nuevo.',
];
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
      maxDuration: '2m',
      options: { browser: { type: 'chromium' } },
    },
  },
};

async function retryClick(page, evalFn, arg, timeoutMs) {
  const start = Date.now();
  let clicked = false;
  while (Date.now() - start < timeoutMs && !clicked) {
    clicked = await page.evaluate(evalFn, arg);
    if (!clicked) {
      await page.waitForTimeout(100);
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
      20000
    );
    check(clickedRoom, { [`${session.nickname}: sala ${GROUP_NAME} visible`]: (v) => v });

    if (!clickedRoom && __VU === 1) {
      await page.screenshot({ path: 'debug_chat_page.png' });
      const navHtml = await page.evaluate(() => {
        const nav = document.querySelector('[aria-label="Conversaciones"]');
        return nav ? nav.outerHTML : 'NAV_NOT_FOUND';
      });
      console.log(navHtml);
    }

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
      20000
    );
    check(clickedJoin, { [`${session.nickname}: botón entrar a la sala visible`]: (v) => v });

    const waitStart = Date.now();
    let inCall = false;
    let rejectedWithMessage = false;
    while (Date.now() - waitStart < 30000) {
      inCall = await page.evaluate(
        (label) => !!document.querySelector(`[aria-label="${label}"]`),
        END_CALL_LABEL
      );
      if (inCall) break;

      rejectedWithMessage = await page.evaluate(
        (texts) =>
          Array.from(document.querySelectorAll('.ant-message-notice-content')).some((el) =>
            texts.some((t) => el.textContent && el.textContent.includes(t))
          ),
        REJECTION_TEXTS
      );
      if (rejectedWithMessage) break;

      await page.waitForTimeout(100);
    }
    callJoinDuration.add(Date.now() - start);

    check(inCall || rejectedWithMessage, {
      [`${session.nickname}: entra a la llamada o recibe un mensaje de rechazo claro`]: (v) => v,
    });
    check(true, {
      [`${session.nickname}: resultado = ${inCall ? 'conectado' : rejectedWithMessage ? 'rechazado con mensaje' : 'sin respuesta clara (colgado)'}`]:
        () => inCall || rejectedWithMessage,
    });
  } finally {
    await context.close();
  }
}
