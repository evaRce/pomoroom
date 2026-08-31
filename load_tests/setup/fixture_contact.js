import { browser } from 'k6/x/browser';
import { check, sleep } from 'k6';
import { BASE_URL } from '../lib/config.js';

const LOGIN_RATE_LIMIT_COOLDOWN_S = 22;

const EVA_EMAIL = 'eva@gmail.com';
const EVA_PASSWORD = 'eva12345';
const EVA_NICKNAME = 'eva123';

const BUDDIES = [
  { email: 'buddy@example.com', password: 'Buddy12345', nickname: 'buddy123' },
  { email: 'buddy2@example.com', password: 'Buddy12345', nickname: 'buddy124' },
  { email: 'buddy3@example.com', password: 'Buddy12345', nickname: 'buddy125' },
  { email: 'buddy4@example.com', password: 'Buddy12345', nickname: 'buddy126' },
];

export const options = {
  scenarios: {
    fixture: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '8m',
      options: { browser: { type: 'chromium' } },
    },
  },
};

function currentUrl(page) {
  try {
    return page.url();
  } catch (err) {
    return '';
  }
}

async function waitForChat(page) {
  let elapsed = 0;
  while (!currentUrl(page).includes('/chat') && elapsed < 5000) {
    await page.waitForTimeout(50);
    elapsed += 50;
  }
}

async function tryClickByText(page, selector, text) {
  return page.evaluate(
    ({ selector, text }) => {
      const candidates = Array.from(document.querySelectorAll(selector));
      const el = candidates.find((e) => e.textContent && e.textContent.trim().includes(text));
      if (!el) return false;
      el.click();
      return true;
    },
    { selector, text }
  );
}

async function clickByText(page, selector, text) {
  if (!(await tryClickByText(page, selector, text))) {
    throw new Error(`no se encontró un elemento "${selector}" con texto "${text}"`);
  }
}

async function waitAndClickByText(page, selector, text, timeoutMs) {
  let elapsed = 0;
  while (elapsed < timeoutMs) {
    if (await tryClickByText(page, selector, text)) {
      return;
    }
    await page.waitForTimeout(200);
    elapsed += 200;
  }
  throw new Error(`no se encontró un elemento "${selector}" con texto "${text}" tras ${timeoutMs}ms`);
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.locator('#normal_login_email').type(email);
  await page.locator('#normal_login_password').type(password);
  await page.locator('button[type="submit"]').click();
  await waitForChat(page);
  return currentUrl(page).includes('/chat');
}

async function ensureBuddyExists(page, buddy) {
  const loggedIn = await login(page, buddy.email, buddy.password);
  if (loggedIn) {
    return true;
  }

  await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' });
  await page.locator('#normal_signup_email').type(buddy.email);
  await page.locator('#normal_signup_password').type(buddy.password);
  await page.locator('#normal_signup_confirmPassword').type(buddy.password);
  await page.locator('#normal_signup_nickname').type(buddy.nickname);
  await page.locator('button[type="submit"]').click();
  await waitForChat(page);
  if (!currentUrl(page).includes('/chat')) {
    const errorText = await page.evaluate(() => {
      const alerts = Array.from(document.querySelectorAll('[role="alert"], .ant-form-item-explain-error'));
      return alerts.map((e) => e.textContent).join(' | ');
    });
    console.log(`fallo el signup de ${buddy.nickname}: ${errorText}`);
  }
  return currentUrl(page).includes('/chat');
}

async function sendFriendRequests(page, buddyNicknames) {
  await page.locator(`button[aria-label="Otros"]`).click();
  await page.waitForTimeout(300);
  await clickByText(page, '.ant-dropdown-menu-item', 'Añadir contacto');

  for (const buddyNickname of buddyNicknames) {
    const input = page.locator('[aria-label="Añade tu próximo contacto"]');
    await input.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await input.type(buddyNickname);
    await clickByText(page, 'button', 'Añadir');
    await page.waitForTimeout(1000);
  }
}

async function acceptFriendRequestFrom(page, fromNickname) {
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const clicked = await page.evaluate((fromNickname) => {
    const nav = document.querySelector('[aria-label="Conversaciones"]');
    if (!nav) return false;
    const item = Array.from(nav.querySelectorAll('[role="button"]')).find(
      (el) => el.textContent && el.textContent.includes(fromNickname)
    );
    if (!item) return false;
    item.click();
    return true;
  }, fromNickname);
  if (!clicked) {
    throw new Error(`no hay ninguna solicitud pendiente de ${fromNickname}`);
  }

  let detailsElapsed = 0;
  let detailsLoaded = false;
  while (detailsElapsed < 5000) {
    detailsLoaded = await page.evaluate(
      (fromNickname) =>
        Array.from(document.querySelectorAll('strong')).some(
          (el) => el.textContent.trim() === fromNickname
        ),
      fromNickname
    );
    if (detailsLoaded) break;
    await page.waitForTimeout(100);
    detailsElapsed += 100;
  }
  if (!detailsLoaded) {
    throw new Error(`el panel de solicitud de ${fromNickname} no cargó a tiempo`);
  }

  await waitAndClickByText(page, 'button', 'Aceptar', 5000);
  await page.waitForTimeout(1000);
}

async function getConversationEntries(page) {
  await page.waitForTimeout(1000);
  return page.evaluate(() => {
    const nav = document.querySelector('[aria-label="Conversaciones"]');
    if (!nav) return [];
    return Array.from(nav.querySelectorAll('[role="button"]')).map((el) => ({
      name: el.textContent.trim(),
      pending: el.textContent.includes('Pendiente'),
    }));
  });
}

export default async function () {
  let context = await browser.newContext();
  let existingEntries = [];
  try {
    const evaPage = await context.newPage();
    await login(evaPage, EVA_EMAIL, EVA_PASSWORD);
    existingEntries = await getConversationEntries(evaPage);
  } finally {
    await context.close();
  }

  const findEntry = (nickname) => existingEntries.find((entry) => entry.name.includes(nickname));

  const notStarted = BUDDIES.filter((buddy) => !findEntry(buddy.nickname));
  const alreadyPending = BUDDIES.filter((buddy) => findEntry(buddy.nickname)?.pending);
  for (const buddy of BUDDIES) {
    const entry = findEntry(buddy.nickname);
    if (entry && !entry.pending) {
      check(true, { [`${buddy.nickname} ya era contacto aceptado, omitido`]: (v) => v });
    }
  }

  const readyBuddies = [];
  for (const buddy of notStarted) {
    sleep(LOGIN_RATE_LIMIT_COOLDOWN_S);
    context = await browser.newContext();
    try {
      const buddyPage = await context.newPage();
      const buddyReady = await ensureBuddyExists(buddyPage, buddy);
      check(buddyReady, { [`usuario ${buddy.nickname} disponible`]: (v) => v });
      if (buddyReady) {
        readyBuddies.push(buddy);
      }
    } finally {
      await context.close();
    }
  }

  if (readyBuddies.length > 0) {
    sleep(LOGIN_RATE_LIMIT_COOLDOWN_S);
    context = await browser.newContext();
    try {
      const evaPage = await context.newPage();
      await login(evaPage, EVA_EMAIL, EVA_PASSWORD);
      await sendFriendRequests(evaPage, readyBuddies.map((buddy) => buddy.nickname));
    } finally {
      await context.close();
    }
  }

  const toAccept = readyBuddies.concat(alreadyPending);
  for (const buddy of toAccept) {
    sleep(LOGIN_RATE_LIMIT_COOLDOWN_S);
    context = await browser.newContext();
    try {
      const buddyPage = await context.newPage();
      await login(buddyPage, buddy.email, buddy.password);
      await acceptFriendRequestFrom(buddyPage, EVA_NICKNAME);
    } finally {
      await context.close();
    }
  }

  if (toAccept.length === 0) {
    return;
  }

  sleep(LOGIN_RATE_LIMIT_COOLDOWN_S);
  context = await browser.newContext();
  try {
    const evaPage = await context.newPage();
    await login(evaPage, EVA_EMAIL, EVA_PASSWORD);
    const finalEntries = await getConversationEntries(evaPage);
    for (const buddy of toAccept) {
      const entry = finalEntries.find((e) => e.name.includes(buddy.nickname));
      check(Boolean(entry) && !entry.pending, {
        [`${EVA_NICKNAME} tiene un chat aceptado con ${buddy.nickname}`]: (v) => v,
      });
    }
  } finally {
    await context.close();
  }
}
