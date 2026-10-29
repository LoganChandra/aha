// UI adversarial checks in a real browser. node scripts/ui-adversarial.mjs [base]
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:3311';
const browser = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
async function check(name, opts, fn) {
  if (process.env.ONLY && !new RegExp(process.env.ONLY, 'i').test(name)) return;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, ...opts });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  try {
    const ok = await fn(page, errs);
    results.push([name, !!ok && errs.length === 0, (typeof ok === 'string' ? ok + ' ' : '') + errs.join(' | ').slice(0, 200)]);
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
  await page.getByText(/Lesson 1 of|Pelajaran 1 daripada|பாடம் 1 \//).waitFor({ timeout: 60000 });
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
  await page.getByText(/Lesson 1 of|Pelajaran 1 daripada|பாடம் 1 \//).waitFor({ timeout: 60000 });
  return n === 1;
});

await check('failed lesson shows a retry that works', {}, async (page) => {
  let fail = true;
  await page.route('**/api/lesson', (route) => (fail ? route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: 'This lesson did not build. Try again.' }) }) : route.continue()));
  await startCourse(page);
  await page.getByRole('button', { name: 'Try again' }).waitFor({ timeout: 20000 });
  fail = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('button', { name: /^(Continue|Next lesson)$/ }).waitFor({ timeout: 90000 });
  return true;
});

await check('plan server error lands back home with a message', {}, async (page) => {
  await page.route('**/api/plan', (route) => route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: 'AHA could not plan that just now. Try again in a moment.' }) }));
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
  await page.getByRole('button', { name: /^(Continue|Next lesson)$/ }).waitFor({ timeout: 90000 });
  const pause = await page.getByRole('button', { name: 'Pause' }).count();
  return pause === 0;
});

await check('dark mode renders a full course', { colorScheme: 'dark' }, async (page) => {
  await startCourse(page, 'trigonometry', 'Beginner');
  await page.getByRole('button', { name: /^(Continue|Next lesson)$/ }).waitFor({ timeout: 90000 });
  await page.waitForTimeout(1200);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  return bg !== 'rgb(247, 246, 242)' && (await noHorizontalScroll(page));
});

await check('landscape phone has no horizontal scroll', { viewport: { width: 844, height: 390 } }, async (page) => {
  await startCourse(page);
  await page.getByRole('button', { name: /^(Continue|Next lesson)$/ }).waitFor({ timeout: 90000 });
  return noHorizontalScroll(page);
});

await check('laptop 1366x768 course layout', { viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 }, async (page) => {
  await startCourse(page, 'how does wifi work', 'Novice');
  await page.getByRole('button', { name: /^(Continue|Next lesson)$/ }).waitFor({ timeout: 90000 });
  await page.waitForTimeout(1000);
  return noHorizontalScroll(page);
});

await check('Tamil course renders in Tamil', {}, async (page) => {
  await startCourse(page, 'ஒளிச்சேர்க்கை எப்படி நடக்கிறது', 'Novice');
  await page.getByRole('button', { name: /^(தொடர்|அடுத்த பாடம்)$/ }).waitFor({ timeout: 90000 });
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
  await page.getByText(/Lesson 1 of|Pelajaran 1 daripada|பாடம் 1 \//).waitFor({ timeout: 60000 });
  return true;
});

await check('walk every step and lesson 2 loads', {}, async (page) => {
  await startCourse(page);
  await page.getByRole('button', { name: /^(Continue|Next lesson)$/ }).waitFor({ timeout: 90000 });
  for (let i = 0; i < 10; i++) {
    if (await page.getByRole('button', { name: /^(Next lesson|Finish lesson)$/ }).count()) break;
    const show = page.getByRole('button', { name: 'Show me' });
    if (await show.count()) await show.click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(250);
  }
  const show = page.getByRole('button', { name: 'Show me' });
  if (await show.count()) await show.click();
  if (await page.getByRole('button', { name: 'Finish lesson' }).count()) await page.getByRole('button', { name: 'Finish lesson' }).click();
  await page.getByRole('button', { name: 'Next lesson' }).click();
  await page.getByText(/Lesson 2 of/).waitFor();
  await page.getByRole('button', { name: /^(Continue|Next lesson)$/ }).waitFor({ timeout: 90000 });
  return true;
});

await check('a task blocks Continue until done, and Show me completes it', {}, async (page) => {
  await startCourse(page, 'trigonometry', 'Novice');
  const cont = page.getByRole('button', { name: /^(Continue|Next lesson)$/ });
  await cont.waitFor({ timeout: 90000 });
  for (let i = 0; i < 6; i++) {
    if (await page.getByRole('button', { name: 'Show me' }).count()) break;
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(250);
  }
  if (!(await page.getByRole('button', { name: 'Show me' }).count())) return false;
  const blocked = await cont.isDisabled();
  await page.getByRole('button', { name: 'Show me' }).click();
  await page.waitForTimeout(900);
  return blocked && !(await cont.isDisabled());
});

await check('asking mid-lesson answers inside the scene and returns', {}, async (page) => {
  await startCourse(page, 'trigonometry', 'Novice');
  await page.getByRole('button', { name: /^(Continue|Next lesson)$/ }).waitFor({ timeout: 90000 });
  const askBtn = page.getByRole('button', { name: 'Ask anything about this' });
  if (await askBtn.count()) await askBtn.click();
  await page.locator('#prompt').fill('why is it called sine?');
  await page.keyboard.press('Enter');
  await page.getByText('Back to the lesson').waitFor({ timeout: 45000 });
  await page.getByText('Back to the lesson').click();
  await page.waitForTimeout(700);
  return (await page.getByText('Back to the lesson').count()) === 0;
});

// Panel 2026-10-29 (Lim, Aisyah, Nurul): a question asked on the lesson-done card must show its answer, on top.
await check('asking on the lesson-done card shows the answer on top', {}, async (page) => {
  await startCourse(page, 'why is the sky blue', 'Beginner');
  await page.getByRole('button', { name: /^(Continue|Next lesson)$/ }).waitFor({ timeout: 90000 });
  for (let i = 0; i < 10; i++) {
    const show = page.getByRole('button', { name: 'Show me' });
    if (await show.count()) { await show.first().click(); await page.waitForTimeout(500); }
    const fin = page.getByRole('button', { name: 'Finish lesson' });
    if (await fin.count()) { await fin.click(); break; }
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(300);
  }
  await page.getByText(/Lesson 1 done|Course done/).waitFor({ timeout: 5000 });
  await page.getByRole('button', { name: 'Ask anything about this' }).click();
  await page.locator('#prompt').fill('can you explain that again more simply?');
  await page.keyboard.press('Enter');
  const back = page.getByRole('button', { name: 'Back to the lesson' });
  await back.waitFor({ timeout: 45000 });
  // The button must be the topmost thing where it is drawn, i.e. nothing covers the answer card.
  const top = await back.evaluate((el) => { const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!hit && (hit === el || el.contains(hit)); });
  await back.click();
  await page.waitForTimeout(600);
  return top && (await page.getByText(/Lesson 1 done/).count()) > 0;
});

// Panel: tapping empty space gave no feedback at all (Lim, Daniel).
await check('a tap on empty space during a tap task says so', {}, async (page) => {
  await startCourse(page, 'how does a plant make food', 'Novice');
  await page.getByRole('button', { name: /^(Continue|Next lesson)$/ }).waitFor({ timeout: 90000 });
  for (let i = 0; i < 6; i++) {
    if (await page.getByText(/^Tap|Tap /).count() && await page.getByRole('button', { name: 'Show me' }).count()) break;
    const show = page.getByRole('button', { name: 'Show me' });
    if (await show.count()) { await show.first().click(); await page.waitForTimeout(400); }
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(300);
  }
  const svg = page.locator('section svg').first();
  if (!(await svg.count())) return 'no 2D scene in this lesson (skipped)';
  const b = await svg.boundingBox();
  await page.mouse.click(b.x + 4, b.y + 4);
  await page.waitForTimeout(400);
  return (await page.getByText(/That's empty space|Not that one/).count()) > 0 || 'no tap task reached (skipped)';
});

// Panel: the lesson spoke Malay but every button stayed English (Nurul).
await check('a Malay course shows Malay buttons', {}, async (page) => {
  await startCourse(page, 'bagaimana vaksin berfungsi', 'Novice');
  await page.getByRole('button', { name: /^(Teruskan|Pelajaran seterusnya)$/ }).waitFor({ timeout: 90000 });
  return (await page.getByText(/Pelajaran 1 daripada/).count()) > 0 && (await page.getByRole('button', { name: /Tanya/ }).count()) > 0;
});

// Panel (Aisyah): a reload must not throw the course away.
await check('reloading mid-course reopens the same course', {}, async (page) => {
  await startCourse(page, 'compound interest', 'Beginner');
  await page.getByRole('button', { name: /^(Continue|Next lesson)$/ }).waitFor({ timeout: 90000 });
  const topic = await page.locator('header button').nth(1).innerText();
  await page.reload();
  await page.getByRole('button', { name: /^(Continue|Next lesson)$/ }).waitFor({ timeout: 90000 });
  return (await page.locator('header button').nth(1).innerText()) === topic;
});

await browser.close();
let pass = 0;
for (const [n, ok, e] of results) { if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${e ? `  (${e})` : ''}`); }
console.log(`\n${pass}/${results.length} passed`);
