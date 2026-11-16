import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { chromium } from 'playwright';

const versionDir = resolve('public/previews/tokyo-food-64');
const lessonPath = resolve(versionDir, 'lesson1-video.html');
const qaDir = resolve(versionDir, 'qa');
const lessonHtml = await readFile(lessonPath, 'utf8');

function parseTimings() {
  const block = lessonHtml.match(/const TIMINGS = \{([\s\S]*?)\n  \};/)?.[1] || '';
  assert.ok(block, 'Stitch timing constants must exist');
  return Object.fromEntries(
    [...block.matchAll(/([A-Z_]+):\s*(\d+)/g)].map(([, key, value]) => [key, Number(value)]),
  );
}

test('Stitch lesson keeps slow, ordered prompt beats and reduced-motion playback', () => {
  const timings = parseTimings();
  assert.ok(timings.PLANE_DESCENT >= 2_000, 'plane descent must stay visible');
  assert.ok(timings.POPUP_HOLD >= 800, 'gate choices must remain readable');
  assert.ok(timings.BETWEEN_GATES_PAUSE >= 1_200, 'leave time between prompt gates');
  assert.ok(timings.TYPING_SPEED_PER_CHAR >= 70 && timings.TYPING_SPEED_PER_CHAR <= 90);

  const gateOrder = [...lessonHtml.matchAll(/await animateTap\(gates\[(\d)\]\)/g)]
    .map(([, gate]) => Number(gate));
  assert.deepEqual(gateOrder, [0, 1, 2, 3]);
  assert.match(lessonHtml, /prefers-reduced-motion: reduce/);
  assert.match(lessonHtml, /prefersReduced \? 50 : ms/);
  assert.ok(
    lessonHtml.indexOf('await sleep(TIMINGS.FINAL_ANSWER_HOLD)') < lessonHtml.lastIndexOf('runJourney();'),
    'the timeline must replay after the final answer',
  );
  assert.match(lessonHtml, /Vegan Izakaya Masaka/);
});

test('phone QA captures the Stitch story and reduced-motion replay', { timeout: 120_000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  const frames = [];

  const installObserver = async (page) => page.addInitScript(() => {
    window.__motionEvents = [];
    const seenGates = new Set();
    let tapWasVisible = false;
    // The timeline changes classes in rapid async steps. Poll live gate state
    // so mobile browser/WebKit mutation batching cannot hide a completed beat.
    window.setInterval(() => {
      for (const id of ['gate1', 'gate2', 'gate3', 'gate4']) {
        const gate = document.getElementById(id);
        if (gate?.classList.contains('on') && !seenGates.has(id)) {
          seenGates.add(id);
          window.__motionEvents.push({ kind: 'gate', target: id, at: performance.now() });
        }
      }
      const tapVisible = document.getElementById('tapCursor')?.classList.contains('show') || false;
      if (tapVisible && !tapWasVisible) {
        window.__motionEvents.push({ kind: 'tap', at: performance.now() });
      }
      tapWasVisible = tapVisible;
      if (document.getElementById('assistantReplyWrap')?.style.display === 'flex'
          && !window.__motionEvents.some((event) => event.kind === 'answer')) {
        window.__motionEvents.push({ kind: 'answer', at: performance.now() });
      }
      if (document.getElementById('jTrack')?.getAttribute('aria-valuenow') === '0'
          && window.__motionEvents.some((event) => event.kind === 'answer')
          && !window.__motionEvents.some((event) => event.kind === 'restart')) {
        window.__motionEvents.push({ kind: 'restart', at: performance.now() });
      }
    }, 20);
  });

  const saveFrame = async (page, file, title, description) => {
    await page.screenshot({ path: resolve(qaDir, file), fullPage: false });
    const elapsedMs = await page.evaluate(() => Math.round(performance.now()));
    frames.push({ file, title, description, elapsedMs });
    console.log(`STITCH QA FRAME ${String(frames.length).padStart(2, '0')}: ${title} (${elapsedMs} ms)`);
  };

  try {
    await mkdir(qaDir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await installObserver(page);
    await page.goto(pathToFileURL(lessonPath).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#cinematicPlane')?.style.transform.includes('translate(140px, 240px)'));
    await page.waitForTimeout(150);
    await saveFrame(page, '00-plane-approach.png', 'Plane approaches Tokyo', 'The passenger plane descends toward the Tokyo runway.');

    await page.waitForTimeout(3_250);
    await saveFrame(page, '01-plane-landed.png', 'Plane lands', 'The plane reaches the runway and stops.');

    await page.waitForFunction(() => {
      const bubble = document.querySelector('#hungerBubble');
      const sam = document.querySelector('#samDisembark');
      return bubble && sam
        && Number.parseFloat(getComputedStyle(bubble).opacity) >= 0.95
        && Number.parseFloat(getComputedStyle(sam).opacity) >= 0.95;
    }, null, { timeout: 10_000 });
    await saveFrame(page, '02-sam-hungry.png', 'Sam exits hungry', 'Sam leaves the plane with a suitcase and shows hunger.');

    const beats = [
      { step: 1, choice: 'Local Guide', progress: '25', prompt: 'named Kenji.', frame: '03-role.png', title: 'Role: chooses Kenji', description: 'Sam selects a local guide and adds the Role fragment.' },
      { step: 2, choice: 'Lunch spot', progress: '50', prompt: 'Shibuya Station.', frame: '04-task.png', title: 'Task: asks for lunch', description: 'Sam selects the lunch search and adds the Task fragment.' },
      { step: 3, choice: 'Vegetarian', progress: '75', prompt: '45 minutes.', frame: '05-context.png', title: 'Context: filters the food search', description: 'Sam selects vegetarian dining and adds the Context fragment.' },
      { step: 4, choice: 'One pick', progress: '100', prompt: 'walking distance.', frame: '06-format.png', title: 'Format: narrows the answer', description: 'Sam selects a short single pick with walking distance.' },
    ];

    for (const beat of beats) {
      await page.waitForFunction(({ step }) => {
        const gate = document.querySelector(`#gate${step}`);
        return gate?.classList.contains('highlight')
          && document.querySelector('#tapCursor')?.classList.contains('show');
      }, beat, { timeout: 50_000 });
      await saveFrame(page, `tap-${beat.frame}`, `Sam taps ${beat.title.split(':')[0]}`, `The animated tap lands on the ${beat.title.split(':')[0].toLowerCase()} gate.`);

      await page.waitForFunction(({ step, choice, progress, prompt }) => {
        const track = document.querySelector('#jTrack')?.getAttribute('aria-valuenow');
        const selected = document.querySelector(`#cur${step}`)?.textContent || '';
        const promptText = document.querySelector('#promptContent')?.textContent || '';
        return document.querySelector(`#gate${step}`)?.classList.contains('on')
          && selected.includes(choice)
          && track === progress
          && promptText.includes(prompt);
      }, beat, { timeout: 50_000 });
      await saveFrame(page, beat.frame, beat.title, beat.description);
    }

    await page.waitForFunction(() => {
      const wrap = document.querySelector('#assistantReplyWrap');
      const reply = document.querySelector('#aiReplyText')?.textContent || '';
      return wrap?.style.display === 'flex' && reply.includes('Vegan Izakaya Masaka');
    }, null, { timeout: 30_000 });
    await saveFrame(page, '07-kenji-answer.png', 'Kenji recommends lunch', 'The completed prompt returns the vegetarian Shibuya food answer.');

    const normalEvents = await page.evaluate(() => window.__motionEvents);
    assert.deepEqual(normalEvents.filter((event) => event.kind === 'gate').map((event) => event.target), [
      'gate1', 'gate2', 'gate3', 'gate4',
    ]);
    assert.ok(normalEvents.filter((event) => event.kind === 'tap').length >= 4, 'Sam visibly taps every prompt gate');
    assert.ok(normalEvents.some((event) => event.kind === 'answer'), 'the sample food answer appears');

    const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await reduced.emulateMedia({ reducedMotion: 'reduce' });
    await installObserver(reduced);
    await reduced.goto(pathToFileURL(lessonPath).href, { waitUntil: 'domcontentloaded' });
    await reduced.waitForFunction(() => document.querySelector('#cinematicPlane')?.style.transform.includes('translate(140px, 240px)'));
    await saveFrame(reduced, '08-reduced-plane-landed.png', 'Reduced motion: plane lands', 'Reduced motion keeps the arrival beat and advances the story.');
    await reduced.waitForFunction(() => {
      const events = window.__motionEvents || [];
      return events.some((event) => event.kind === 'answer') && events.some((event) => event.kind === 'restart');
    }, null, { timeout: 30_000 });

    const reducedEvents = await reduced.evaluate(() => window.__motionEvents);
    assert.deepEqual(reducedEvents.filter((event) => event.kind === 'gate').map((event) => event.target), [
      'gate1', 'gate2', 'gate3', 'gate4',
    ]);
    assert.ok(reducedEvents.some((event) => event.kind === 'answer'));
    assert.ok(reducedEvents.some((event) => event.kind === 'restart'), 'reduced-motion playback restarts after the answer');

    await writeFile(resolve(qaDir, 'events.json'), `${JSON.stringify({
      viewport: '390x844',
      timings: parseTimings(),
      normalMotion: normalEvents,
      reducedMotion: reducedEvents,
    }, null, 2)}\n`);
    const cards = frames.map((frame, index) => `<article><h2>${String(index).padStart(2, '0')} · ${frame.title}</h2><p>${frame.description}</p><small>${frame.elapsedMs} ms</small><img src="${frame.file}" alt="${frame.title}"></article>`).join('\n');
    const gallery = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stitch Tokyo lesson QA frames</title><style>body{margin:0;padding:20px;background:#f7f7f9;color:#3c3c4a;font:16px/1.45 system-ui,sans-serif}main{max-width:430px;margin:auto}h1{font-size:24px}article{margin:18px 0;padding:14px;background:#fff;border:1px solid #e5e5ea;border-radius:16px}h2{font-size:18px;margin:0 0 5px}p{margin:0 0 8px;color:#727280}small{display:block;margin-bottom:10px;color:#8a8a9a}img{display:block;width:min(100%,390px);height:auto;border:1px solid #e5e5ea;border-radius:12px}</style><main><h1>Tokyo lesson · Stitch QA</h1><p>390 × 844 viewport. Frames follow the plane landing, hunger beat, prompt gates and final answer.</p>${cards}</main></html>`;
    await writeFile(resolve(qaDir, 'index.html'), gallery);
    await page.close();
    await reduced.close();
    console.log(`STITCH QA REPORT: ${resolve(qaDir, 'index.html')}`);
  } finally {
    await browser.close();
  }
});
