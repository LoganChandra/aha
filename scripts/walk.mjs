// A walk through AHA as a first-time visitor on a phone: screenshots of every screen they meet, in order,
// for a person to look at (not assertions). No stored state — a genuinely fresh visit.
//   NODE_PATH=~/irassist/node_modules node scripts/walk.mjs <width>x<height> <out dir> [topic]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const B = process.env.BASE_URL || 'https://profai-poc.vercel.app';
const [w, h] = (process.argv[2] || '414x896').split('x').map(Number);
const out = process.argv[3] || 'qa-shots/first-visit-walk';
const topic = process.argv[4] || null; // null = tap the first example chip, like a first-timer
mkdirSync(out, { recursive: true });
const b = await chromium.launch({
  args: ['--font-render-hinting=none'], // as phones draw text
  executablePath: process.env.CHROME_BIN || undefined, // cache's chromium when the pinned build is missing
});
const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768, deviceScaleFactor: 2 });
const pg = await ctx.newPage();
const errs = [];
pg.on('pageerror', (e) => errs.push(e.message));
pg.on('console', (m) => m.type() === 'error' && !/favicon|ERR_ABORTED/.test(m.text()) && errs.push(m.text().slice(0, 200)));
let n = 0;
const shot = async (name, full = false) => {
  n += 1;
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: `${out}/${String(n).padStart(2, '0')}-${name}.png`, fullPage: full });
  console.log(`shot ${n}: ${name}`);
};
const step = async (name, fn) => {
  try {
    await fn();
  } catch (e) {
    console.log('STEP FAILED', name, e.message.split('\n')[0]);
    await shot(`FAILED-${name}`);
  }
};
const waitLesson = async (ms = 90000) => {
  // The first lesson takes 10-40 s to build; wait until a scene canvas/svg exists.
  try {
    await pg.waitForSelector('.stage svg, .stage canvas', { timeout: ms });
    return true;
  } catch {
    return false;
  }
};

await pg.goto(B + '/', { waitUntil: 'load' });
await shot('home-fresh');
// wait past the drawing stages (appear at 0/6/14 s) to see the honest-progress experience
await pg.waitForTimeout(4200);
await shot('home-after-4s');

// First-timer path: tap an example chip (buttons under "Try one"), or type a topic
await step('pick a topic', async () => {
  if (topic) {
    await pg.locator('textarea, input[type="text"], [contenteditable]').first().fill(topic);
    await pg.keyboard.press('Enter');
  } else {
    // example chips: buttons that are not the level buttons; pick by position within the "try one" group
    const chips = pg.locator('main button.min-h-\\[44px\\]');
    await chips.first().click();
  }
});
await shot('planning');
await pg.waitForTimeout(5000);
await shot('planning-5s');
await step('wait for lesson', waitLesson);
await shot('lesson-arrives');
await pg.waitForTimeout(2500);
await shot('lesson-settled');

// Look for the interactive handles the lesson promises: knobs / draggable points
const sceneInfo = await pg.evaluate(() => {
  const stage = document.querySelector('.stage');
  const knobs = [...document.querySelectorAll('input[type=range]')].length;
  const buttons = [...stage?.querySelectorAll('button') ?? []].map((b) => (b.textContent || '').trim().slice(0, 40)).filter(Boolean).slice(0, 12);
  const svgs = [...stage?.querySelectorAll('svg') ?? []].map((s) => ({ w: s.getBoundingClientRect().width, h: s.getBoundingClientRect().height }));
  return { knobs, buttons, svgs: svgs.length, stageText: (stage?.textContent || '').slice(0, 300) };
});
console.log('scene:', JSON.stringify(sceneInfo).slice(0, 800));

await shot('before-next');
await step('tap Continue', async () => {
  await pg.getByRole('button', { name: /continue/i }).first().click();
});
await shot('step-2');
await pg.waitForTimeout(1800);
await shot('step-2-settled');

// Try the Ask box
await step('open ask', async () => {
  await pg.getByRole('button', { name: /ask/i }).first().click();
  await pg.waitForTimeout(400);
});
await shot('ask-open');

await b.close();
console.log('errors:', errs.length ? errs : 'none');
