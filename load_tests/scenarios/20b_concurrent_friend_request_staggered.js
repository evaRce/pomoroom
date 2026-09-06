// Igual que 20, pero las solicitudes no se envían todas a
// la vez: van llegando poco a poco, como en el uso real.
import { browser } from 'k6/x/browser';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../lib/config.js';
import { ALL_BUDDIES } from '../lib/buddies.js';

const { sessions: allSessions } = JSON.parse(open('../setup/sessions.json'));
const VUS = Number(__ENV.VUS || 3);
const RECEIVER_OFFSET = Number(__ENV.RECEIVER_OFFSET || Math.floor(ALL_BUDDIES.length / 2));
const PAIR_START = Number(__ENV.PAIR_START || 0);

// Only BATCH_SIZE browsers open at the very start; the rest trickle in one every
// STAGGER_INTERVAL_MS, so VUS can go past ~9 without the test laptop itself
// running out of resources, and so the load matches real usage (people don't all
// send a friend request at the exact same instant).
const BATCH_SIZE = Number(__ENV.BATCH_SIZE || 3);
const STAGGER_INTERVAL_MS = Number(__ENV.STAGGER_INTERVAL_MS || 2000);

const friendRequestDuration = new Trend('friend_request_duration_ms', true);

function sessionFor(nickname) {
  return allSessions.find((s) => s.nickname === nickname);
}

const SENDER_POOL = ALL_BUDDIES.filter((b) => sessionFor(b.nickname));

export const options = {
  scenarios: {
    concurrent_friend_request_staggered: {
      executor: 'per-vu-iterations',
      vus: VUS,
      iterations: 1,
      maxDuration: '3m',
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
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
  const senderIndex = (PAIR_START + __VU - 1) % SENDER_POOL.length;
  const receiverIndex = (senderIndex + RECEIVER_OFFSET) % ALL_BUDDIES.length;
  const sender = SENDER_POOL[senderIndex];
  const receiverNickname = ALL_BUDDIES[receiverIndex].nickname;
  const session = sessionFor(sender.nickname);

  const wave = __VU <= BATCH_SIZE ? 0 : __VU - BATCH_SIZE;
  if (wave > 0) {
    sleep((wave * STAGGER_INTERVAL_MS) / 1000);
  }

  const context = await browser.newContext();
  try {
    await context.addCookies(session.cookies);
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle' });

    const clickedAddContact = await retryClick(
      page,
      () => {
        const btn = document.querySelector('button[aria-label="Añadir contacto"]');
        if (!btn) return false;
        btn.click();
        return true;
      },
      null,
      10000
    );
    check(clickedAddContact, { [`${sender.nickname}: botón Añadir contacto visible`]: (v) => v });

    const input = page.locator('[aria-label="Añade tu próximo contacto"]');
    await input.waitFor();
    await input.type(receiverNickname);

    const start = Date.now();
    const clickedAdd = await retryClick(
      page,
      () => {
        const btn = Array.from(document.querySelectorAll('button')).find(
          (el) => el.textContent && el.textContent.trim() === 'Añadir'
        );
        if (!btn) return false;
        btn.click();
        return true;
      },
      null,
      5000
    );
    check(clickedAdd, { [`${sender.nickname}: botón Añadir visible`]: (v) => v });

    let found = false;
    while (Date.now() - start < 10000) {
      found = await page.evaluate((name) => {
        const nav = document.querySelector('[aria-label="Conversaciones"]');
        if (!nav) return false;
        return Array.from(nav.querySelectorAll('[role="button"]')).some(
          (el) => el.textContent && el.textContent.includes(name)
        );
      }, receiverNickname);
      if (found) break;
      await page.waitForTimeout(50);
    }
    friendRequestDuration.add(Date.now() - start);

    check(found, {
      [`${sender.nickname}: ${receiverNickname} visible en la barra lateral`]: (v) => v,
    });
  } finally {
    await context.close();
  }
}
