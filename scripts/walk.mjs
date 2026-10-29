// Walk lesson 1 step by step in the real UI: screenshot each step before and after doing its task (via "Show me").
// node scripts/walk.mjs "<prompt>" <Level> <w> <h> [base]
import { chromium } from 'playwright';
const [prompt, level = 'Beginner', w = '390', h = '844', base = 'http://localhost:3311'] = process.argv.slice(2);
const tag = `${prompt.replace(/\W+/g, '_').slice(0, 24)}-${w}${process.env.LESSON ? `-L${process.env.LESSON}` : ''}`;
const browser = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, isMobile: +w < 700, hasTouch: +w < 700, colorScheme: process.env.DARK ? 'dark' : 'light' })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(base, { waitUntil: 'networkidle' });
await page.screenshot({ path: `scripts/shots/walk-${tag}-home.png` });
// LESSON=n opens lesson n directly through the course address (?q=...&level=...&l=n).
if (process.env.LESSON) {
  await page.goto(`${base}/?q=${encodeURIComponent(prompt)}&level=${level.toLowerCase()}&lang=en&l=${process.env.LESSON}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
} else {
  await page.getByRole('radio', { name: new RegExp(level) }).click();
  await page.locator('#prompt').fill(prompt);
  await page.keyboard.press('Enter');
}
await page.getByRole('button', { name: /Continue|Next lesson|Teruskan/ }).waitFor({ timeout: 150000 });
await page.waitForTimeout(1500);
for (let i = 0; i < 8; i++) {
  await page.screenshot({ path: `scripts/shots/walk-${tag}-${i}a.png` });
  const show = page.getByRole('button', { name: /^(Show me|Tunjukkan)$/ });
  if (await show.count()) { await show.click(); await page.waitForTimeout(1100); await page.screenshot({ path: `scripts/shots/walk-${tag}-${i}b.png` }); }
  const next = page.getByRole('button', { name: /^(Continue|Teruskan)$/ });
  if (!(await next.count())) break;
  await next.click();
  await page.waitForTimeout(900);
}
console.log(JSON.stringify({ tag, errors: errs }));
await browser.close();
