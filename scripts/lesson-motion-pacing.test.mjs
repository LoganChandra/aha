import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import test from 'node:test';
import { chromium } from 'playwright';

const previewsRoot = resolve('public/previews');
const version = 'tokyo-food-63';
const versionDir = resolve(previewsRoot, version);
const lessonPath = resolve(versionDir, 'lesson1-video.html');
const qaDir = resolve(versionDir, 'qa');
const lessonHtml = await readFile(lessonPath, 'utf8');

function numericConfig(name) {
  const match = lessonHtml.match(new RegExp(`var ${name}=\\{([^}]+)\\};`));
  assert.ok(match, `Could not find ${name} timing configuration`);
  return Object.fromEntries(
    [...match[1].matchAll(/([a-zA-Z]\w*):(\d+)/g)].map(([, key, value]) => [key, Number(value)]),
  );
}

function startPreviewServer() {
  const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const filePath = resolve(previewsRoot, `.${pathname}`);
    if (!filePath.startsWith(`${previewsRoot}${sep}`)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const content = await readFile(filePath);
      const contentType = extname(filePath) === '.png' ? 'image/png' : 'text/html; charset=utf-8';
      response.writeHead(200, { 'content-type': contentType }).end(content);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });

  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolveServer({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('click and prompt timing stays slow enough to follow', () => {
  const pace = numericConfig('PACE');
  const chat = numericConfig('CHAT');

  assert.ok(pace.travelMs >= 900, 'character travel must take at least 900 ms');
  assert.ok(pace.targetDwellMs >= 450, 'character must pause at the target before clicking');
  assert.ok(pace.pressMs >= 200, 'the press must be visible before the click fires');
  assert.ok(pace.settleMs >= 450, 'the character must settle before moving on');
  assert.ok(pace.popupReadyMs >= 300, 'the option menu must remain open long enough to read');
  assert.ok(pace.readWaitMs >= 11_000, 'prompt building and reading must not be cut short');
  assert.ok(chat.promptMinGap >= 70, 'prompt letters must not flash by too quickly');
  assert.ok(chat.promptMaxGap >= 85, 'prompt letters must keep a readable upper cadence');
  assert.ok(chat.promptMaxMs >= 10_000, 'long prompt parts need a longer build window');
  assert.equal(pace.travelMs, Number(lessonHtml.match(/--actor-travel:(\d+)ms/)?.[1]));

  const move = lessonHtml.match(/async function moveActorTo\(node\)\{([\s\S]*?)\n\}/)?.[1] || '';
  const tap = lessonHtml.match(/async function tapNode\(node\)\{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(move, /await nap\(reduce\?0:PACE\.travelMs\)/);
  assert.ok(tap.indexOf('PACE.targetDwellMs') < tap.indexOf("node.classList.add('prompt-target','tapping')"));
  assert.ok(tap.indexOf('PACE.pressMs') < tap.indexOf('node.click()'));
  assert.ok(tap.indexOf('node.click()') < tap.indexOf('PACE.settleMs'));

  const story = lessonHtml.match(/var order=\[([\s\S]*?)\];/)?.[1] || '';
  const beats = [...story.matchAll(/\{g:(\d+),k:'([^']+)'\}/g)].map(([, gate, choice]) => [Number(gate), choice]);
  assert.deepEqual(beats, [[1, 'guide'], [2, 'lunch'], [3, 'v'], [4, 'list']]);
});

test('phone QA captures every beat and verifies the complete prompt story', { timeout: 120_000 }, async () => {
  const { server, origin } = await startPreviewServer();
  let browser;
  let page;
  const frames = [];

  try {
    await mkdir(qaDir, { recursive: true });
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
    window.__qaEvents = [];
    const record = (event) => window.__qaEvents.push({ ...event, at: performance.now() });
    const nativeClick = HTMLElement.prototype.click;
    HTMLElement.prototype.click = function (...args) {
      if (this.matches('.gate,.opt')) {
        const target = this.matches('.gate')
          ? this.getAttribute('aria-label')
          : this.querySelector('.ot b')?.textContent.trim();
        record({ kind: 'click', target });
      }
      return nativeClick.apply(this, args);
    };

    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const actor = mutation.target;
        if (!(actor instanceof HTMLElement) || actor.id !== 'prompt-actor') continue;
        if (mutation.attributeName === 'style') {
          record({ kind: 'move', x: actor.style.getPropertyValue('--actor-x'), y: actor.style.getPropertyValue('--actor-y') });
        }
        if (mutation.attributeName === 'class') {
          if (actor.classList.contains('press')) record({ kind: 'press' });
          if (actor.classList.contains('release')) record({ kind: 'release' });
        }
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    });

    const saveFrame = async (file, title, description) => {
    await page.screenshot({ path: resolve(qaDir, file), fullPage: false });
    const elapsedMs = await page.evaluate(() => Math.round(performance.now()));
    frames.push({ file, title, description, elapsedMs });
    console.log(`QA FRAME ${String(frames.length).padStart(2, '0')}: ${title} (${elapsedMs} ms)`);
    };

    await page.goto(`${origin}/${version}/lesson1-video.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__arrivalFrameLoaded === true, null, { timeout: 10_000 });
    const flightFrame = page.frames().find((frame) => frame.url().endsWith('/58.html'));
    assert.ok(flightFrame, 'landing animation iframe should load');

    await flightFrame.waitForFunction(
      () => Number.parseFloat(getComputedStyle(document.querySelector('.flight-plane')).opacity) > 0.8,
      null,
      { timeout: 5_000 },
    );
    await saveFrame('00-plane-approach.png', 'Plane approaches Tokyo', 'The plane is visible on final approach.');

    await flightFrame.waitForFunction(
      () => Number.parseFloat(getComputedStyle(document.querySelector('.parked-plane')).opacity) > 0.8,
      null,
      { timeout: 8_000 },
    );
    await saveFrame('01-plane-landed.png', 'Plane lands; Sam exits hungry', 'The parked plane and traveler reach the Tokyo arrival scene.');

    const beats = [
      { step: 1, choice: 'Local Guide', prompt: '1 of 4 parts', frame: '02-role.png', title: 'Role: chooses a local guide', description: 'The character opens Role, selects Kenji, and adds the role to the prompt.' },
      { step: 2, choice: 'Lunch spot', prompt: '2 of 4 parts', frame: '03-task.png', title: 'Task: asks for lunch', description: 'The character selects Lunch spot and adds the food request.' },
      { step: 3, choice: 'Vegetarian', prompt: '3 of 4 parts', frame: '04-context.png', title: 'Context: filters for vegetarian food', description: 'The character chooses Vegetarian and adds that context.' },
    ];

    for (const beat of beats) {
      await page.waitForFunction(
        ({ step, choice, prompt }) => {
          const progress = document.querySelector('#jTrack')?.getAttribute('aria-valuenow');
          const selected = document.querySelector(`#cur${step}`)?.textContent || '';
          const tag = document.querySelector('#tag')?.textContent || '';
          const draft = document.querySelector('#msgs .prompt-draft')?.textContent || '';
          return progress === String(step * 25) && selected.includes(choice) && tag.includes(`${step}/4`) && draft.includes(prompt);
        },
        { step: beat.step, choice: beat.choice, prompt: beat.prompt },
        { timeout: 45_000 },
      );
      await saveFrame(beat.frame, beat.title, beat.description);
    }

    await page.waitForFunction(
      () => {
        const progress = document.querySelector('#jTrack')?.getAttribute('aria-valuenow');
        const choice = document.querySelector('#cur4')?.textContent || '';
        const chat = document.querySelector('#msgs')?.innerText || '';
        return progress === '100' && choice.includes('Short list') && chat.includes('Vegan Izakaya Masaka') && chat.includes('Vegan Sushi Tokyo');
      },
      null,
      { timeout: 45_000 },
    );
    await page.waitForFunction(() => document.querySelector('#play')?.getAttribute('aria-label') === 'Play', null, { timeout: 15_000 });
    await saveFrame('05-format-and-answer.png', 'Format: builds the final prompt and answer', 'The completed prompt asks for a short list; Kenji replies with Tokyo food options.');

    const events = await page.evaluate(() => window.__qaEvents);
    const clicks = events.filter((event) => event.kind === 'click');
    const presses = events.filter((event) => event.kind === 'press');
    const moves = events.filter((event) => event.kind === 'move');
    const expectedClicks = ['Role', 'Local Guide (Kenji)', 'Task', 'Lunch spot', 'Context', 'Vegetarian', 'Format', 'Short list'];
    assert.deepEqual(clicks.map((event) => event.target), expectedClicks);
    assert.equal(presses.length, expectedClicks.length, 'each gate and option should show one press');

    const pace = numericConfig('PACE');
    for (let i = 0; i < presses.length; i++) {
      const previousMove = moves.filter((event) => event.at < presses[i].at).at(-1);
      const click = clicks[i];
      assert.ok(previousMove, `press ${i + 1} should follow a character move`);
      assert.ok(presses[i].at - previousMove.at >= pace.travelMs + pace.targetDwellMs - 80, `press ${i + 1} should wait for travel and target dwell`);
      assert.ok(click.at - presses[i].at >= pace.pressMs - 30, `click ${i + 1} should wait for the press animation`);
    }
    for (let i = 0; i < clicks.length; i += 2) {
      const minimum = pace.settleMs + pace.popupReadyMs + pace.travelMs + pace.targetDwellMs + pace.pressMs - 100;
      assert.ok(clicks[i + 1].at - clicks[i].at >= minimum, `gate ${i / 2 + 1} should stay open while the character reaches its option`);
    }

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__arrivalFrameLoaded === true, null, { timeout: 10_000 });
    const reducedFlightFrame = page.frames().find((frame) => frame.url().endsWith('/58.html'));
    assert.ok(reducedFlightFrame, 'reduced-motion landing animation iframe should load');
    await reducedFlightFrame.waitForFunction(
      () => Number.parseFloat(getComputedStyle(document.querySelector('.flight-plane')).opacity) > 0.8,
      null,
      { timeout: 5_000 },
    );
    await reducedFlightFrame.waitForFunction(
      () => Number.parseFloat(getComputedStyle(document.querySelector('.parked-plane')).opacity) > 0.8,
      null,
      { timeout: 8_000 },
    );
    await saveFrame('06-reduced-plane-landed.png', 'Reduced motion: plane lands', 'Reduced travel still shows the plane arrive and land.');
    await page.waitForFunction(
      () => {
        const progress = document.querySelector('#jTrack')?.getAttribute('aria-valuenow');
        const chat = document.querySelector('#msgs')?.innerText || '';
        return progress === '100' && chat.includes('Vegan Izakaya Masaka') && chat.includes('Vegan Sushi Tokyo');
      },
      null,
      { timeout: 20_000 },
    );
    await page.waitForFunction(() => document.querySelector('#play')?.getAttribute('aria-label') === 'Play', null, { timeout: 10_000 });
    const reducedState = await page.evaluate(() => ({
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      progress: document.querySelector('#jTrack')?.getAttribute('aria-valuenow'),
      finalAnswer: document.querySelector('#msgs')?.innerText.includes('Vegan Izakaya Masaka') || false,
    }));
    assert.deepEqual(reducedState, { reducedMotion: true, progress: '100', finalAnswer: true });
    await saveFrame('07-reduced-prompt-complete.png', 'Reduced motion: prompt reaches the food answer', 'All four prompt gates complete without freezing at the landing scene.');

    const clickTimeline = clicks.map((event, index) => ({ frame: index + 1, target: event.target, atMs: Math.round(event.at) }));
    await writeFile(resolve(qaDir, 'events.json'), `${JSON.stringify({ viewport: '390x844', normalMotion: { clicks: clickTimeline }, reducedMotion: reducedState }, null, 2)}\n`);
    const cards = frames.map((frame, index) => `<article><h2>${String(index).padStart(2, '0')} · ${frame.title}</h2><p>${frame.description}</p><small>${frame.elapsedMs} ms from page load</small><img src="${frame.file}" alt="${frame.title}"></article>`).join('\n');
    const report = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tokyo lesson motion QA</title><style>body{margin:0;padding:20px;background:#f5f6f8;color:#263044;font:16px/1.45 system-ui,sans-serif}main{max-width:520px;margin:auto}h1{font-size:24px}article{margin:20px 0;padding:16px;background:white;border:1px solid #d7dce4;border-radius:16px}h2{font-size:18px;margin:0 0 6px}p{margin:0 0 8px;color:#4b5565}small{display:block;margin-bottom:10px;color:#687386}img{display:block;width:min(100%,390px);height:auto;border:1px solid #d7dce4;border-radius:12px}</style><main><h1>Tokyo lesson motion QA</h1><p>Phone viewport: 390 × 844. Normal and reduced-motion captures, in story order.</p>${cards}</main></html>`;
    await writeFile(resolve(qaDir, 'index.html'), report);
    assert.equal(await page.locator('#play').getAttribute('aria-label'), 'Play', 'completed story should leave replay available');
    console.log(`QA REPORT: ${resolve(qaDir, 'index.html')}`);
  } finally {
    await page?.close();
    await browser?.close();
    await new Promise((resolveClose, reject) => server.close((error) => (error ? reject(error) : resolveClose())));
  }
});
