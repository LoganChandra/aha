import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { chromium } from 'playwright';

const storyUrl = 'https://tokyo-food-67--profai-tokyo-food-63-preview.netlify.app/lesson1-video.html';
const completionKey = 'profai:first-lesson-story:v69:complete';
const fixture = JSON.parse(await readFile('src/content/library/how-ai-works.json', 'utf8'));

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', (error) => error ? reject(error) : resolve()));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

async function waitForServer(url, process, output) {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (process.exitCode !== null) throw new Error(`Next.js exited before becoming ready:\n${output.join('')}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await delay(500);
  }
  throw new Error(`Next.js did not become ready:\n${output.join('')}`);
}

test('first lesson story hands off to the real lesson once and supports an explicit replay', { timeout: 120_000 }, async () => {
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const output = [];
  const startNext = () => {
    const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(port)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
    });
    child.stdout.on('data', (chunk) => output.push(chunk.toString()));
    child.stderr.on('data', (chunk) => output.push(chunk.toString()));
    return child;
  };
  let next = startNext();
  const browser = await chromium.launch({ headless: true });
  try {
    try {
      await waitForServer(origin, next, output);
    } catch (error) {
      if (!String(error).includes('stopped to show the upgrade recommendation')) throw error;
      next = startNext();
      await waitForServer(origin, next, output);
    }
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    let storyLoads = 0;
    await page.route(storyUrl, async (route) => {
      storyLoads++;
      if (storyLoads === 1) await delay(13_000);
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: `<!doctype html><html><body><div id="story-frame">Tokyo lesson story</div><script>addEventListener('load',function(){parent.postMessage({type:'PROFAI_LESSON_STORY',version:1,status:'ready'},'*');setTimeout(function(){parent.postMessage({type:'PROFAI_LESSON_STORY',version:1,status:'complete'},'*')},600)});</script></body></html>`,
      });
    });
    await page.route('**/api/plan', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ plan: fixture.plan, sources: fixture.sources, planId: 'story-app-test', askToken: 'story-app-test-token' }),
    }));
    await page.route('**/api/lesson', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ lesson: fixture.lessons[0], sources: [] }),
    }));

    await page.goto(`${origin}/?q=What%20is%20AI&story=1`, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('first-lesson-story').waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const lesson = document.querySelector('main[aria-hidden="true"]');
      return lesson?.hasAttribute('inert') && !!lesson.querySelector('.stage');
    });
    await page.waitForTimeout(12_200);
    assert.equal(await page.getByTestId('first-lesson-story').isVisible(), true, 'a slow first-lesson frame stays open past the old 12-second fallback');
    assert.equal(await page.locator('main').getAttribute('aria-hidden'), 'true', 'the actual lesson stays inert until the story reports ready and complete');
    await page.waitForFunction(() => !document.querySelector('[data-testid="first-lesson-story"]'), null, { timeout: 10_000 });
    await page.locator('.stage').waitFor({ state: 'visible' });
    await page.getByText('A neuron adds up its input and decides how strongly to fire.').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), completionKey), '1');
    assert.equal(storyLoads, 1, 'the first-lesson story loaded once');
    assert.equal(await page.locator('main').getAttribute('aria-hidden'), 'false', 'the real lesson is accessible after the handoff');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.stage').waitFor({ state: 'visible' });
    await page.getByText('A neuron adds up its input and decides how strongly to fire.').waitFor({ state: 'visible' });
    assert.equal(storyLoads, 1, 'completed intro stays out of the way on return visits');

    await page.goto(`${origin}/?q=What%20is%20AI&story=1`, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('first-lesson-story').waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.querySelector('[data-testid="first-lesson-story"]'), null, { timeout: 10_000 });
    assert.equal(storyLoads, 2, 'story=1 explicitly replays the intro');

    await page.evaluate(() => {
      localStorage.removeItem('profai:first-lesson-story:v68:complete');
      sessionStorage.removeItem('profai:first-lesson-story:v69:complete-this-tab');
      sessionStorage.removeItem('profai:first-lesson-story:v69:failed-this-tab');
    });
    await page.addInitScript(() => Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() { throw new DOMException('Storage is blocked', 'SecurityError'); },
    }));
    await page.goto(`${origin}/?q=What%20is%20AI`, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('first-lesson-story').waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.querySelector('[data-testid="first-lesson-story"]'), null, { timeout: 10_000 });
    assert.equal(storyLoads, 3, 'session storage allows the intro when local storage is blocked');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.stage').waitFor({ state: 'visible' });
    assert.equal(storyLoads, 3, 'the intro does not repeat in the tab when local storage is blocked');
  } finally {
    await browser.close();
    next.kill('SIGTERM');
    if (next.exitCode === null) await new Promise((resolve) => next.once('exit', resolve));
  }
});
