import { browser } from 'k6/x/browser';
import { BASE_URL } from '../lib/config.js';

const DURATION_S = Number(__ENV.MONITOR_DURATION_S || 40);
const SHOT_EVERY_S = Number(__ENV.MONITOR_INTERVAL_S || 5);
const LABEL = __ENV.MONITOR_LABEL || 'monitor';

export const options = {
  scenarios: {
    livedashboard_monitor: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: `${DURATION_S + 30}s`,
      options: { browser: { type: 'chromium' } },
    },
  },
};

export default async function () {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/dev/dashboard/home`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    let elapsed = 0;
    let shot = 0;
    while (elapsed <= DURATION_S * 1000) {
      await page.screenshot({ path: `../results/17_livedashboard_${LABEL}_t${elapsed}ms.png`, fullPage: true });
      console.log(`SHOT:${shot}:t${elapsed}ms`);
      shot += 1;
      await page.waitForTimeout(SHOT_EVERY_S * 1000);
      elapsed += SHOT_EVERY_S * 1000;
    }
  } finally {
    await context.close();
  }
}
