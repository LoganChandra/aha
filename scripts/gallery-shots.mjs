// Screenshot bake-off lessons in the dev gallery. node scripts/gallery-shots.mjs <filter> [beat]
import { chromium } from 'playwright';
const [filter = 'deepseek', beat = '1', w = '390', h = '844'] = process.argv.slice(2);
const base = 'http://localhost:3311';
const files = (await (await fetch(`${base}/api/dev/fixtures`)).json()).filter((f) => f.includes(filter));
const browser = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
for (const f of files) {
  errs.length = 0;
  await page.goto(`${base}/dev/gallery?f=${f}&b=${beat}`);
  await page.waitForTimeout(f.includes('model3d') ? 2500 : 1300);
  const out = `scripts/shots/${f.replace('.json', '')}-b${beat}-${w}.png`;
  await page.screenshot({ path: out });
  console.log(out, errs.length ? 'ERRORS: ' + errs.join(' | ').slice(0, 300) : '');
}
await browser.close();
