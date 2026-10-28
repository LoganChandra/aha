// UI adversarial checks in a real browser. node scripts/ui-adversarial.mjs [base]
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:3311';
const browser = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
async function check(name, opts, fn) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, ...opts });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  try {
    const ok = await fn(page, errs);
    results.push([name, ok && errs.length === 0, errs.join(' | ').slice(0, 200)]);
  } catch (e) {
    results.push([name, false, e.message.slice(0, 200)]);
  }
  await page.screenshot({ path: `scripts/shots/ui-${name.replace(/\W+/g, '_').slice(0, 40)}.png` }).catch(() => {});
  await ctx.close();
}
async function startCourse(page, prompt = 'compound interest', level = 'Novice') {
  await page.goto(base);
  await page.getByRole('radio', { name: new RegExp(level) }).click();
  await page.locator('#prompt').fill(prompt);
  await page.keyboard.press('Enter');
  await page.getByText(/Lesson 1 of/).waitFor({ timeout: 60000 });
}
const noHorizontalScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

await check('double send fires one plan request', {}, async (page) => {
  let n = 0;
  page.on('request', (r) => r.url().endsWith('/api/plan') && n++);
  await page.goto(base);
  await page.locator('#prompt').fill('compound interest');
  await page.locator('#prompt').press('Enter');
  await page.locator('#prompt').press('Enter').catch(() => {});
  await page.getByRole('button', { name: 'Send' }).click({ force: true, timeout: 1000 }).catch(() => {});
  await page.getByText(/Lesson 1 of/).waitFor({ timeout: 60000 });
  return n === 1;
});

await check('failed lesson shows a retry that works', {}, async (page) => {
  let fail = true;
  await page.route('**/api/lesson', (route) => (fail ? route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: 'This lesson did not build. Try again.' }) }) : route.continue()));
  await startCourse(page);
  await page.getByRole('button', { name: 'Try again' }).waitFor({ timeout: 20000 });
  fail = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).waitFor({ timeout: 90000 });
  return true;
});

await check('plan server error lands back home with a message', {}, async (page) => {
  await page.route('**/api/plan', (route) => route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: 'ProfAI could not plan that just now. Try again in a moment.' }) }));
  await page.goto(base);
  await page.locator('#prompt').fill('anything');
  await page.keyboard.press('Enter');
  await page.getByText('could not plan').waitFor({ timeout: 10000 });
  return true;
});

await check('offline shows a message, not a blank screen', {}, async (page) => {
  await page.goto(base);
  await page.route('**/api/plan', (route) => route.abort('internetdisconnected'));
  await page.locator('#prompt').fill('anything');
  await page.keyboard.press('Enter');
  await page.getByRole('status').waitFor({ timeout: 10000 });
  return (await page.getByRole('status').innerText()).length > 5;
});

await check('phone back button returns to home', {}, async (page) => {
  await startCourse(page);
  await page.goBack();
  await page.getByText('What do you want to understand?').waitFor({ timeout: 5000 });
  return page.url().startsWith(base);
});

await check('reduced motion starts paused', { reducedMotion: 'reduce' }, async (page) => {
  await startCourse(page, 'how a wave moves on a string', 'Beginner');
  await page.getByRole('button', { name: 'Next', exact: true }).waitFor({ timeout: 90000 });
  const pause = await page.getByRole('button', { name: 'Pause' }).count();
  return pause === 0;
});

await check('dark mode renders a full course', { colorScheme: 'dark' }, async (page) => {
  await startCourse(page, 'trigonometry', 'Beginner');
  await page.getByRole('button', { name: 'Next', exact: true }).waitFor({ timeout: 90000 });
  await page.waitForTimeout(1200);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  return bg !== 'rgb(247, 246, 242)' && (await noHorizontalScroll(page));
});

await check('landscape phone has no horizontal scroll', { viewport: { width: 844, height: 390 } }, async (page) => {
  await startCourse(page);
  await page.getByRole('button', { name: 'Next', exact: true }).waitFor({ timeout: 90000 });
  return noHorizontalScroll(page);
});

await check('laptop 1366x768 course layout', { viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 }, async (page) => {
  await startCourse(page, 'how does wifi work', 'Novice');
  await page.getByRole('button', { name: 'Next', exact: true }).waitFor({ timeout: 90000 });
  await page.waitForTimeout(1000);
  return noHorizontalScroll(page);
});

await check('Tamil course renders in Tamil', {}, async (page) => {
  await startCourse(page, 'ஒளிச்சேர்க்கை எப்படி நடக்கிறது', 'Novice');
  await page.getByRole('button', { name: 'Next', exact: true }).waitFor({ timeout: 90000 });
  await page.waitForTimeout(800);
  return /[஀-௿]/.test(await page.locator('main').innerText());
});

await check('one long unbroken word does not break the layout', {}, async (page) => {
  await page.goto(base);
  await page.locator('#prompt').fill('a'.repeat(300));
  return noHorizontalScroll(page);
});

await check('clarify options start a course when tapped', {}, async (page) => {
  await page.goto(base);
  await page.locator('#prompt').fill('yo');
  await page.keyboard.press('Enter');
  await page.getByRole('status').waitFor({ timeout: 30000 });
  const opt = page.getByRole('status').getByRole('button').first();
  await opt.click();
  await page.getByText(/Lesson 1 of/).waitFor({ timeout: 60000 });
  return true;
});

await check('walk every step and lesson 2 loads', {}, async (page) => {
  await startCourse(page);
  await page.getByRole('button', { name: 'Next', exact: true }).waitFor({ timeout: 90000 });
  for (let i = 0; i < 8 && (await page.getByRole('button', { name: 'Next', exact: true }).count()); i++) {
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(250);
  }
  await page.getByRole('button', { name: 'Next lesson' }).click();
  await page.getByText(/Lesson 2 of/).waitFor();
  await page.getByRole('button', { name: 'Next', exact: true }).waitFor({ timeout: 90000 });
  return true;
});

await browser.close();
let pass = 0;
for (const [n, ok, e] of results) { if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${e ? `  (${e})` : ''}`); }
console.log(`\n${pass}/${results.length} passed`);
