import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { BASE_URL } from '../lib/config.js';

// One-off fixture, not a load test: creates a second user and establishes
// an accepted private chat with eva@gmail.com, so room-join / messaging
// scenarios have a conversation to open. Run once against pomoroom_test.

const EVA_EMAIL = 'eva@gmail.com';
const EVA_PASSWORD = 'eva12345';
const EVA_NICKNAME = 'eva123';

const BUDDY_EMAIL = 'buddy@example.com';
const BUDDY_PASSWORD = 'Buddy12345';
const BUDDY_NICKNAME = 'buddy123';

export const options = {
  scenarios: {
    fixture: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '1m',
      options: { browser: { type: 'chromium' } },
    },
  },
};

async function waitForChat(page) {
  let elapsed = 0;
  while (!page.url().includes('/chat') && elapsed < 5000) {
    await page.waitForTimeout(50);
    elapsed += 50;
  }
}

async function clickByText(page, selector, text) {
  const clicked = await page.evaluate(
    ({ selector, text }) => {
      const candidates = Array.from(document.querySelectorAll(selector));
      const el = candidates.find((e) => e.textContent && e.textContent.trim().includes(text));
      if (!el) return false;
      el.click();
      return true;
    },
    { selector, text }
  );
  if (!clicked) {
    throw new Error(`no se encontró un elemento "${selector}" con texto "${text}"`);
  }
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.locator('#normal_login_email').type(email);
  await page.locator('#normal_login_password').type(password);
  await page.locator('button[type="submit"]').click();
  await waitForChat(page);
  return page.url().includes('/chat');
}

async function ensureBuddyExists(page) {
  const loggedIn = await login(page, BUDDY_EMAIL, BUDDY_PASSWORD);
  if (loggedIn) {
    return true;
  }

  await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' });
  await page.locator('#normal_signup_email').type(BUDDY_EMAIL);
  await page.locator('#normal_signup_password').type(BUDDY_PASSWORD);
  await page.locator('#normal_signup_confirmPassword').type(BUDDY_PASSWORD);
  await page.locator('#normal_signup_nickname').type(BUDDY_NICKNAME);
  await page.locator('button[type="submit"]').click();
  await waitForChat(page);
  if (!page.url().includes('/chat')) {
    const errorText = await page.evaluate(() => {
      const alerts = Array.from(document.querySelectorAll('[role="alert"], .ant-form-item-explain-error'));
      return alerts.map((e) => e.textContent).join(' | ');
    });
    console.log('fallo el signup de buddy: ' + errorText);
  }
  return page.url().includes('/chat');
}

async function sendFriendRequest(page) {
  await page.locator(`button[aria-label="Otros"]`).click();
  await page.waitForTimeout(300);
  await clickByText(page, '.ant-dropdown-menu-item', 'Añadir contacto');
  await page.locator('[aria-label="Añade tu próximo contacto"]').type(BUDDY_NICKNAME);
  await clickByText(page, 'button', 'Añadir');
  await page.waitForTimeout(1000);
}

async function acceptFriendRequest(page) {
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const clickedFirstConversation = await page.evaluate(() => {
    const nav = document.querySelector('[role="navigation"][aria-label="Conversaciones"]');
    const item = nav && nav.querySelector('[role="button"]');
    if (!item) return false;
    item.click();
    return true;
  });
  if (!clickedFirstConversation) {
    throw new Error('no hay ninguna conversación pendiente para aceptar');
  }
  await page.waitForTimeout(500);
  await clickByText(page, 'button', 'Aceptar');
  await page.waitForTimeout(1000);
}

async function hasAcceptedConversation(page) {
  await page.waitForTimeout(1000);
  return page.evaluate(() => {
    const nav = document.querySelector('[aria-label="Conversaciones"]');
    return !!nav && nav.querySelectorAll('[role="button"]').length > 0;
  });
}

export default async function () {
  let context = await browser.newContext();
  try {
    const evaPage = await context.newPage();
    await login(evaPage, EVA_EMAIL, EVA_PASSWORD);
    if (await hasAcceptedConversation(evaPage)) {
      check(true, { [`${EVA_NICKNAME} ya tenía un chat, fixture omitido`]: (v) => v });
      return;
    }
  } finally {
    await context.close();
  }

  context = await browser.newContext();
  try {
    const buddyPage = await context.newPage();
    const buddyReady = await ensureBuddyExists(buddyPage);
    check(buddyReady, { 'usuario buddy disponible': (v) => v });
  } finally {
    await context.close();
  }

  context = await browser.newContext();
  try {
    const evaPage = await context.newPage();
    const evaReady = await login(evaPage, EVA_EMAIL, EVA_PASSWORD);
    check(evaReady, { 'login de eva ok': (v) => v });
    await sendFriendRequest(evaPage);
  } finally {
    await context.close();
  }

  context = await browser.newContext();
  try {
    const buddyPage = await context.newPage();
    await login(buddyPage, BUDDY_EMAIL, BUDDY_PASSWORD);
    await acceptFriendRequest(buddyPage);
  } finally {
    await context.close();
  }

  context = await browser.newContext();
  try {
    const evaPage = await context.newPage();
    await login(evaPage, EVA_EMAIL, EVA_PASSWORD);
    const hasConversation = await hasAcceptedConversation(evaPage);
    check(hasConversation, { [`${EVA_NICKNAME} tiene un chat tras aceptar`]: (v) => v });
  } finally {
    await context.close();
  }
}
