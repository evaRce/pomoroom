// Comprueba si el límite de 10 personas por videollamada se
// cumple. Los usuarios no entran todos a la vez: se van
// uniendo poco a poco y se quedan conectados, como en la vida real.
import { browser } from 'k6/x/browser';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { BASE_URL } from '../lib/config.js';

const { sessions: allSessions } = JSON.parse(open('../setup/sessions.json'));

const GROUP_NAME = 'load_test_room';
const JOIN_CALL_LABEL = 'Entrar a la sala';
const REJECTION_TEXTS = [
  'No se pudo entrar a la llamada: acceso no autorizado.',
  'No se pudo conectar a la llamada. Inténtalo de nuevo.',
  'No se pudo contactar con el servidor de llamadas. Revisa tu conexión a internet e inténtalo de nuevo.',
];
const GROUP_MEMBER_NICKNAMES = Array.from({ length: 19 }, (_, i) => `buddy${127 + i}`);
const groupSessions = allSessions.filter((s) => GROUP_MEMBER_NICKNAMES.includes(s.nickname));

const PARTICIPANTS = Number(__ENV.PARTICIPANTS || 11);
const BATCH_SIZE = Number(__ENV.BATCH_SIZE || 3);
const JOIN_INTERVAL_MS = Number(__ENV.JOIN_INTERVAL_MS || 8000);
const HOLD_AFTER_CONNECT_MS = Number(__ENV.HOLD_AFTER_CONNECT_MS || 5000);

const sessions = groupSessions.slice(0, PARTICIPANTS);

const callJoinDuration = new Trend('call_join_duration_ms', true);
const connectedCount = new Counter('call_connected_count');
const rejectedCount = new Counter('call_rejected_count');
const droppedAfterConnectCount = new Counter('call_dropped_after_connect_count');

export const options = {
  scenarios: {
    call_capacity_staggered: {
      executor: 'per-vu-iterations',
      vus: sessions.length,
      iterations: 1,
      maxDuration: '3m',
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

function joinOrderFor(vu) {
  // VUs 1..BATCH_SIZE join right away (a "first wave" arriving together);
  // the rest join one by one, JOIN_INTERVAL_MS apart, to find the real
  // capacity of the room instead of just measuring concurrent-join contention.
  return vu <= BATCH_SIZE ? 0 : vu - BATCH_SIZE;
}

export default async function () {
  const order = joinOrderFor(__VU);
  const delayMs = order * JOIN_INTERVAL_MS;
  const session = sessions[(__VU - 1) % sessions.length];
  const slot = __VU;

  // Delay opening the browser itself, not just the join click — otherwise every
  // wave's Chromium instance still launches at t=0 and the local machine running
  // k6 gets overloaded, which looks like an app failure but isn't.
  if (delayMs > 0) {
    sleep(delayMs / 1000);
  }

  const context = await browser.newContext({ ignoreHTTPSErrors: true });
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
    check(clickedRoom, { [`slot ${slot} (${session.nickname}): sala ${GROUP_NAME} visible`]: (v) => v });

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
    check(clickedJoin, { [`slot ${slot} (${session.nickname}): botón entrar a la sala visible`]: (v) => v });

    const waitStart = Date.now();
    let connected = false;
    let rejectedWithMessage = false;
    while (Date.now() - waitStart < 30000) {
      connected = await page.evaluate(
        () => document.querySelector('[data-call-connected]')?.getAttribute('data-call-connected') === 'true'
      );
      if (connected) break;

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

    let stillConnectedAfterHold = connected;
    if (connected) {
      connectedCount.add(1);
      await page.waitForTimeout(HOLD_AFTER_CONNECT_MS);
      stillConnectedAfterHold = await page.evaluate(
        () => document.querySelector('[data-call-connected]')?.getAttribute('data-call-connected') === 'true'
      );
      if (!stillConnectedAfterHold) {
        droppedAfterConnectCount.add(1);
      }
    } else if (rejectedWithMessage) {
      rejectedCount.add(1);
    }

    check(connected || rejectedWithMessage, {
      [`slot ${slot} (${session.nickname}): entra a la llamada o recibe un mensaje de rechazo claro`]: (v) => v,
    });
    check(true, {
      [`slot ${slot} (${session.nickname}), oleada +${delayMs}ms: resultado = ${
        connected
          ? stillConnectedAfterHold
            ? 'conectado'
            : 'conectado pero expulsado poco después'
          : rejectedWithMessage
            ? 'rechazado con mensaje'
            : 'sin respuesta clara (colgado)'
      }`]: () => connected || rejectedWithMessage,
    });
  } finally {
    await context.close();
  }
}
