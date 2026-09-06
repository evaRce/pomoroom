// Mide añadir una tarea Kanban cuando todos lo hacen a la
// vez en el mismo tablero de grupo.
import { browser } from 'k6/x/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../lib/config.js';

const { sessions: allSessions } = JSON.parse(open('../setup/sessions.json'));

const GROUP_NAME = 'load_test_room';
const PLUGIN_TAB_TITLE = 'Tablero Kanban';
const ADD_TASK_LABEL = 'Agregar tarea a Por hacer';
const TASK_INPUT_PLACEHOLDER = 'Título de la tarea...';
const GROUP_MEMBER_NICKNAMES = Array.from({ length: 19 }, (_, i) => `buddy${127 + i}`);
const groupSessions = allSessions.filter((s) => GROUP_MEMBER_NICKNAMES.includes(s.nickname));
const sessions = groupSessions.slice(0, Number(__ENV.VUS || groupSessions.length));

const kanbanAddTaskDuration = new Trend('kanban_add_task_duration_ms', true);

export const options = {
  scenarios: {
    concurrent_kanban_add_task: {
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
  const taskTitle = `task-${session.nickname}-${Date.now()}`;
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
    check(clickedTab, { [`${session.nickname}: pestaña kanban visible`]: (v) => v });

    const clickedAdd = await retryClick(
      page,
      (label) => {
        const btn = document.querySelector(`[aria-label="${label}"]`);
        if (!btn) return false;
        btn.click();
        return true;
      },
      ADD_TASK_LABEL,
      5000
    );
    check(clickedAdd, { [`${session.nickname}: botón añadir tarea visible`]: (v) => v });

    const input = page.locator(`input[placeholder="${TASK_INPUT_PLACEHOLDER}"]`);
    await input.waitFor();
    await input.type(taskTitle);

    const start = Date.now();
    await input.press('Enter');

    let elapsed = 0;
    let visible = false;
    while (elapsed < 10000) {
      visible = await page.evaluate(
        (title) => Array.from(document.querySelectorAll('p')).some((el) => el.textContent === title),
        taskTitle
      );
      if (visible) break;
      await page.waitForTimeout(50);
      elapsed += 50;
    }
    kanbanAddTaskDuration.add(Date.now() - start);

    check(visible, { [`${session.nickname}: tarea visible en Por hacer`]: (v) => v });
  } finally {
    await context.close();
  }
}
