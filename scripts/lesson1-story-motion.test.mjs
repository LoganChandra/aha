import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { chromium } from 'playwright';

const versionDir = resolve('public/previews/tokyo-food-67');
const lessonPath = resolve(versionDir, 'lesson1-video.html');
const lessonHtml = await readFile(lessonPath, 'utf8');
const integratedVersionDir = resolve('public/previews/tokyo-food-68');
const integratedLessonPath = resolve(integratedVersionDir, 'lesson1-video.html');
const integratedHtml = await readFile(integratedLessonPath, 'utf8');
const integratedArrival = await readFile(resolve(integratedVersionDir, '58.html'), 'utf8');
const pacingVersionDir = resolve('public/previews/tokyo-food-69');
const pacingLessonPath = resolve(pacingVersionDir, 'lesson1-video.html');
const pacingHtml = await readFile(pacingLessonPath, 'utf8');
const pacingArrival = await readFile(resolve(pacingVersionDir, '58.html'), 'utf8');
const source61 = await readFile(resolve('public/previews/tokyo-food-61/lesson1-video.html'), 'utf8');
const source58 = await readFile(resolve('public/previews/tokyo-food-61/58.html'), 'utf8');

const lessonBase = lessonHtml
  .replace(/\/\* TOKYO_FOOD_67_MEAL_STORY_CSS_START \*\/[\s\S]*?\/\* TOKYO_FOOD_67_MEAL_STORY_CSS_END \*\/\n\n/, '')
  .replace(/<!-- TOKYO_FOOD_67_MEAL_STORY_HTML_START -->[\s\S]*?<!-- TOKYO_FOOD_67_MEAL_STORY_HTML_END -->\n/, '')
  .replace(/^[ \t]*<!-- TOKYO_FOOD_67_MEAL_HANDOFF_HTML_START -->\n[\s\S]*?^[ \t]*<!-- TOKYO_FOOD_67_MEAL_HANDOFF_HTML_END -->\n/m, '')
  .replace(/\/\/ TOKYO_FOOD_67_MEAL_STORY_JS_START\n[\s\S]*?\/\/ TOKYO_FOOD_67_MEAL_STORY_JS_END\n/, '')
  .replace(/^[ \t]*\/\/ TOKYO_FOOD_67_MEAL_STORY_ARM_HELPER_START\n[\s\S]*?^[ \t]*\/\/ TOKYO_FOOD_67_MEAL_STORY_ARM_HELPER_END\n/m, '')
  .replace(/^[ \t]*\/\/ TOKYO_FOOD_67_MEAL_STORY_ARM_ATTACH_START\n[\s\S]*?^[ \t]*\/\/ TOKYO_FOOD_67_MEAL_STORY_ARM_ATTACH_END\n/m, '')
  .replace(/^[ \t]*\/\/ TOKYO_FOOD_67_MEAL_STORY_ANSWER_START\n[\s\S]*?^[ \t]*\/\/ TOKYO_FOOD_67_MEAL_STORY_ANSWER_END\n/m, '')
  .replace(/^[ \t]*\/\/ TOKYO_FOOD_67_MEAL_STORY_DWELL_START\n[\s\S]*?^[ \t]*\/\/ TOKYO_FOOD_67_MEAL_STORY_DWELL_END\n/m, '')
  .replace(/^[ \t]*\/\/ TOKYO_FOOD_67_MEAL_STORY_HANDOFF_JS_START\n[\s\S]*?^[ \t]*\/\/ TOKYO_FOOD_67_MEAL_STORY_HANDOFF_JS_END\n/m, '')
  .replace('   await waitForStoryAnswer();\n', '')
  .replace('   await playRestaurantPayoff();\n', '')
  .replace(' },8200);', ' },6900);');

test('story keeps the 61 UI and connects the restaurant payoff', async () => {
  const sourceFiles = await readdir(versionDir);
  assert.ok(sourceFiles.includes('58.html') && sourceFiles.includes('lesson1-video.html'), 'the source animation and its arrival frame stay together');
  assert.ok(lessonHtml.includes('<title>Sam builds a Tokyo food prompt</title>'));
  assert.ok(lessonHtml.includes("var order=[{g:1,k:'guide'},{g:2,k:'lunch'},{g:3,k:'v'},{g:4,k:'list'}]"));
  assert.match(lessonHtml, /async function moveActorTo\(node\)/);
  assert.match(lessonHtml, /await playRestaurantPayoff\(\)/);
  assert.match(lessonHtml, /id="meal-story"/);
  assert.match(lessonHtml, /id="meal-arm-template"/);
  assert.match(lessonHtml, /id="meal-arm-upper"/);
  assert.match(lessonHtml, /id="meal-forearm"/);
  assert.match(lessonHtml, /#meal-arm-upper\.at-mouth,#meal-arm\.at-mouth\{transform:rotate\(110deg\)\}/);
  assert.match(lessonHtml, /#meal-arm\.at-mouth #meal-forearm\{transform:rotate\(151deg\)\}/);
  assert.match(lessonHtml, /#prompt-actor\.eating \.persona-figure>\.pf\{display:none!important;opacity:0!important\}/);
  assert.match(lessonHtml, /id="story-handoff" role="status"[^>]*>Now your turn<\/div>/);
  assert.doesNotMatch(lessonHtml, /<button[^>]+id="story-handoff"/);
  assert.doesNotMatch(lessonHtml, /M151 504Q182 526 210 536/);
  assert.match(lessonHtml, /Vegan Izakaya Masaka/);
  assert.match(lessonHtml, /prefers-reduced-motion:reduce/);
  assert.ok(lessonHtml.indexOf("await waitForChat();") < lessonHtml.indexOf('await playRestaurantPayoff();'));
  assert.ok(source61.includes("var order=[{g:1,k:'guide'},{g:2,k:'lunch'},{g:3,k:'v'},{g:4,k:'list'}]"));
  assert.ok(source58.includes('id="video"') && source58.includes('airport-traveler'));
  assert.equal(lessonBase, source61, 'version 67 preserves the exact 61.html base outside the added story payoff and handoff');
});

test('version 68 preserves v67 and adds the accessible ProfAI explanation and parent handshake', async () => {
  const v67Handoff = lessonHtml.match(/^[ \t]*\/\/ TOKYO_FOOD_67_MEAL_STORY_HANDOFF_JS_START\n[\s\S]*?^[ \t]*\/\/ TOKYO_FOOD_67_MEAL_STORY_HANDOFF_JS_END\n/m)?.[0];
  assert.ok(v67Handoff);
  const preservedV67 = integratedHtml
    .replace(/\/\* TOKYO_FOOD_68_EXPLAINER_CSS_START \*\/[\s\S]*?\/\* TOKYO_FOOD_68_EXPLAINER_CSS_END \*\/\n/, '')
    .replace(/<!-- TOKYO_FOOD_68_EXPLAINER_HTML_START -->[\s\S]*?<!-- TOKYO_FOOD_68_EXPLAINER_HTML_END -->\n/, '')
    .replace(/\/\/ TOKYO_FOOD_68_EXPLAINER_JS_START\n[\s\S]*?\/\/ TOKYO_FOOD_68_EXPLAINER_JS_END\n/, '')
    .replace(/^[ \t]*\/\/ TOKYO_FOOD_68_EXPLAINER_ACTION_START\n[\s\S]*?^[ \t]*\/\/ TOKYO_FOOD_68_EXPLAINER_ACTION_END\n/m, '')
    .replace(/ guidedGateTap=true;\n try\{\n  if\(!await moveActorTo\(gate\)\)return false;\n  if\(!await tapNode\(gate\)\)return false;\n \}finally\{guidedGateTap=false;\}/, ' guidedGateTap=true;\n try{if(!await moveActorTo(gate)||!await tapNode(gate))return false;}finally{guidedGateTap=false;}')
    .replace("if(!guide){play();notifyStoryHost('failed');return;}", 'if(!guide){play();return;}')
    .replace(/^[ \t]*\/\/ TOKYO_FOOD_67_MEAL_STORY_HANDOFF_JS_START\n[\s\S]*?^[ \t]*\/\/ TOKYO_FOOD_67_MEAL_STORY_HANDOFF_JS_END\n/m, v67Handoff)
    .replace(" }catch(e){demoCancelled=true;console.error('[profai:first-lesson-story] story-failed',e);}\n", ' }catch(e){demoCancelled=true;}\n')
    .replace(" if(failed)notifyStoryHost('failed');\n", '')
    .replace("notifyStoryHost('ready');\n", '');
  const normalizedV68Base = preservedV67.replace(/\n{3}<\/style>/g, '\n\n</style>');
  assert.deepEqual((await readdir(integratedVersionDir)).sort(), ['58.html', 'lesson1-video.html']);
  assert.equal(integratedArrival, await readFile(resolve(versionDir, '58.html'), 'utf8'), 'the exact plane-landing sequence ships beside the lesson');
  if (normalizedV68Base !== lessonHtml) {
    let mismatch = 0;
    while (mismatch < normalizedV68Base.length && normalizedV68Base[mismatch] === lessonHtml[mismatch]) mismatch++;
    assert.fail(`version 68 keeps the complete v67 animation and UI as its base (first difference at ${mismatch}, lengths ${normalizedV68Base.length}/${lessonHtml.length}: ${JSON.stringify(normalizedV68Base.slice(Math.max(0, mismatch - 25), mismatch + 45))} vs ${JSON.stringify(lessonHtml.slice(Math.max(0, mismatch - 25), mismatch + 45))})`);
  }
  assert.match(integratedHtml, /role="status" aria-live="polite"[^>]*>ProfAI turns your question into a lesson you can explore\./);
  assert.match(integratedHtml, /async function showProfAIExplanation\(\)[\s\S]*?await nap\(3000\)/);
  assert.match(integratedHtml, /type:'PROFAI_LESSON_STORY',version:1,status:status/);
  assert.match(integratedHtml, /notifyStoryHost\('complete'\)/);
  assert.ok(integratedHtml.indexOf("notifyStoryHost('complete')") > integratedHtml.indexOf("handoff.classList.add('on')"));
});

test('version 69 reuses the exact landing frame and gives mobile prompt clicks readable spacing', async () => {
  assert.deepEqual((await readdir(pacingVersionDir)).sort(), ['58.html', 'lesson1-video.html']);
  assert.equal(pacingArrival, integratedArrival, 'v69 keeps the same complete plane landing animation');
  assert.match(pacingHtml, /STORY_PACING=\{actorTravelMs:980,pressMs:320,settleMs:650,gateToChoiceMs:520\}/);
  assert.match(pacingHtml, /await nap\(reduce\?0:STORY_PACING\.actorTravelMs\)/);
  assert.match(pacingHtml, /await nap\(reduce\?0:STORY_PACING\.pressMs\)/);
  assert.match(pacingHtml, /await nap\(reduce\?80:STORY_PACING\.settleMs\)/);
  assert.match(pacingHtml, /await nap\(reduce\?0:STORY_PACING\.gateToChoiceMs\)/);
  assert.match(pacingHtml, /arrivalFrame\.addEventListener\('load',function\(\)\{window\.clearTimeout\(arrivalTimeout\);window\.__arrivalFrameLoaded=true;revealLesson\(\);\},\{once:true\}\)/);
  assert.match(pacingHtml, /function failArrivalFrame\(\)[\s\S]*?notifyStoryHost\('failed'\)/);
  assert.match(pacingHtml, /arrivalFrame\.addEventListener\('error',function\(\)\{window\.clearTimeout\(arrivalTimeout\);failArrivalFrame\(\);\},\{once:true\}\)/);
  assert.match(pacingHtml, /setTimeout\(function\(\)\{if\(!window\.__arrivalFrameLoaded\)failArrivalFrame\(\);\},45000\)/);
  assert.doesNotMatch(pacingHtml, /\},10000\);\s*\}else setTimeout\(startStory,900\)/, 'a slow arrival frame cannot trigger the old 10-second jump');
  assert.match(pacingHtml, /prefers-reduced-motion:reduce/);
});

test('embedded v68 story sends its versioned ready and completion messages to its parent', { timeout: 20_000 }, async () => {
  const host = createServer(async (request, response) => {
    const path = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    if (path === '/host.html') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(`<!doctype html><script>window.__storyMessages=[];window.addEventListener('message',function(event){var frame=document.getElementById('story');if(event.source===frame.contentWindow)window.__storyMessages.push({origin:event.origin,data:event.data});});</script><iframe id="story" src="/lesson1-video.html"></iframe>`);
      return;
    }
    if (path === '/lesson1-video.html' || path === '/58.html') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(await readFile(resolve(integratedVersionDir, path.slice(1))));
      return;
    }
    response.writeHead(404);
    response.end();
  });
  await new Promise((resolveListen) => host.listen(0, '127.0.0.1', resolveListen));
  const address = host.address();
  assert.ok(address && typeof address === 'object');
  const origin = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${origin}/host.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__storyMessages.some((message) => message.data?.status === 'ready'), null, { timeout: 8_000 });
    const frame = page.frames().find((candidate) => candidate.url().endsWith('/lesson1-video.html'));
    assert.ok(frame);
    await frame.evaluate(() => parent.postMessage({ type: 'PROFAI_LESSON_STORY', version: 1, status: 'complete' }, '*'));
    await page.waitForFunction(() => window.__storyMessages.some((message) => message.data?.status === 'complete'), null, { timeout: 3_000 });
    const messages = await page.evaluate(() => window.__storyMessages.map(({ origin: messageOrigin, data }) => ({ origin: messageOrigin, data })));
    assert.deepEqual(messages.map(({ data }) => data), [
      { type: 'PROFAI_LESSON_STORY', version: 1, status: 'ready' },
      { type: 'PROFAI_LESSON_STORY', version: 1, status: 'complete' },
    ]);
    assert.deepEqual(messages.map(({ origin: messageOrigin }) => messageOrigin), [origin, origin]);
  } finally {
    await browser.close();
    await new Promise((resolveClose, rejectClose) => host.close((error) => error ? rejectClose(error) : resolveClose()));
  }
});

test('slow phone load keeps the landing scene until its frame is ready', { timeout: 35_000 }, async () => {
  const host = createServer(async (request, response) => {
    const path = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    if (path === '/lesson1-video.html') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(pacingHtml);
      return;
    }
    if (path === '/58.html') {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 14_000));
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(pacingArrival);
      return;
    }
    response.writeHead(404);
    response.end();
  });
  await new Promise((resolveListen) => host.listen(0, '127.0.0.1', resolveListen));
  const address = host.address();
  assert.ok(address && typeof address === 'object');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 450, downloadThroughput: 55 * 1024, uploadThroughput: 22 * 1024, connectionType: 'cellular3g' });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(`http://127.0.0.1:${address.port}/lesson1-video.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(10_300);
    const waiting = await page.evaluate(() => ({
      arrivalLoaded: window.__arrivalFrameLoaded === true,
      curtainVisible: !!document.querySelector('#arrival-curtain')?.isConnected,
      actorVisible: !!document.querySelector('#prompt-actor'),
    }));
    assert.equal(waiting.arrivalLoaded, false);
    assert.equal(waiting.curtainVisible, true, 'the landing scene stays in front while the phone connection is slow');
    assert.equal(waiting.actorVisible, false, 'prompt clicks cannot race ahead before arrival is available');
    await page.waitForFunction(() => window.__arrivalFrameLoaded === true, null, { timeout: 8_000 });
    assert.equal(await page.locator('#arrival-curtain').count(), 1, 'the plane scene stays visible for its landing beat');
  } finally {
    await browser.close();
    await new Promise((resolveClose, rejectClose) => host.close((error) => error ? rejectClose(error) : resolveClose()));
  }
});

test('phone QA follows the character from arrival through clicks, answer and eating', { timeout: 130_000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  const expected = [
    { gate: 1, key: 'guide', choice: 'Local Guide', prompt: 'Local Guide (Kenji)' },
    { gate: 2, key: 'lunch', choice: 'Lunch spot', prompt: 'Shibuya Station' },
    { gate: 3, key: 'v', choice: 'Vegetarian', prompt: 'I am vegetarian' },
    // `cur4` shows the selected option label; the full instruction is added to the prompt.
    { gate: 4, key: 'list', choice: 'Short list', prompt: 'One line each' },
  ];

  const installTapRecorder = (page) => page.addInitScript(() => {
    window.__promptTaps = [];
    window.__promptTapTimings = [];
    window.__profaiExplanationDurations = [];
    let previous = '';
    let explanationStarted = 0;
    window.setInterval(() => {
      const target = document.querySelector('.prompt-target.tapping');
      const gate = target?.matches('.gate') ? target.dataset.i : '';
      const option = target?.matches('.opt') ? target.querySelector('input')?.dataset.k : '';
      const key = gate ? `gate-${gate}` : option ? `option-${option}` : '';
      if (key && key !== previous) {
        window.__promptTaps.push(key);
        window.__promptTapTimings.push({ key, ms: performance.now() });
      }
      previous = key;
      const explanationVisible = document.querySelector('#profai-explainer')?.classList.contains('on') || false;
      if (explanationVisible && !explanationStarted) explanationStarted = performance.now();
      if (!explanationVisible && explanationStarted) {
        window.__profaiExplanationDurations.push(performance.now() - explanationStarted);
        explanationStarted = 0;
      }
    }, 16);
  });

  const waitForArrivalBeat = async (page, message) => {
    const frame = page.frames().find((candidate) => candidate.url().endsWith('/58.html'));
    assert.ok(frame, message);
    await frame.waitForFunction(() => {
      const opacity = (selector) => Number.parseFloat(getComputedStyle(document.querySelector(selector)).opacity);
      const traveler = document.querySelector('.airport-traveler');
      return opacity('.parked-plane') > 0.8
        && opacity('.airport-traveler') > 0.8
        && traveler?.classList.contains('hungry')
        && opacity('.airport-traveler .stomach-cue') > 0.2;
    }, null, { timeout: 15_000 });
    return frame;
  };

  const waitForGateAndOption = async (page, item) => {
    await page.waitForFunction((gate) => document.querySelector(`.gate[data-i="${gate}"]`)?.classList.contains('tapping'), item.gate, { timeout: 35_000 });
    await page.waitForFunction((key) => document.querySelector(`.opt input[data-k="${key}"]`)?.closest('.opt')?.classList.contains('tapping'), item.key, { timeout: 15_000 });
    await page.waitForFunction(({ gate, choice }) => (document.querySelector(`#cur${gate}`)?.textContent || '').includes(choice), item, { timeout: 25_000 });
  };

  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await installTapRecorder(page);
    await page.goto(pathToFileURL(pacingLessonPath).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__arrivalFrameLoaded === true, null, { timeout: 15_000 });
    await page.waitForTimeout(1_800);
    const arrivalFrame = await waitForArrivalBeat(page, 'the Tokyo arrival scene stays visible through the landing beat');
    const normalArrival = await arrivalFrame.evaluate(() => {
      const opacity = (selector) => Number.parseFloat(getComputedStyle(document.querySelector(selector)).opacity);
      return {
        parkedPlane: opacity('.parked-plane'),
        traveler: opacity('.airport-traveler'),
        hungry: document.querySelector('.airport-traveler')?.classList.contains('hungry') || false,
        stomachCue: opacity('.airport-traveler .stomach-cue'),
      };
    });
    assert.ok(normalArrival.parkedPlane > 0.8, 'the plane has completed its landing');
    assert.ok(normalArrival.traveler > 0.8 && normalArrival.hungry, 'hungry Sam exits the landed plane');
    assert.ok(normalArrival.stomachCue > 0.2, 'the hunger cue is visible');
    await page.waitForFunction(() => document.querySelector('#profai-explainer')?.classList.contains('on'), null, { timeout: 40_000 });
    assert.equal(await page.locator('#profai-explainer').textContent(), 'ProfAI turns your question into a lesson you can explore.');
    for (const item of expected) await waitForGateAndOption(page, item);
    await page.waitForFunction(() => window.__profaiExplanationDurations?.length > 0, null, { timeout: 5_000 });
    const explanationMs = await page.evaluate(() => window.__profaiExplanationDurations[0]);
    assert.ok(explanationMs >= 2_800 && explanationMs <= 4_500, `the explanation stays visible for 3 seconds (${Math.round(explanationMs)}ms)`);

    try {
      await page.waitForFunction(() => {
      const answer = document.querySelector('#msgs .turn:last-child .bub.ai');
      const rect = answer?.getBoundingClientRect();
      const chat = document.querySelector('.chat')?.getBoundingClientRect();
      const messagesElement = document.querySelector('#msgs');
      const messages = messagesElement?.getBoundingClientRect();
      return answer?.textContent.includes('Vegan Izakaya Masaka')
        && rect?.top >= messages?.top && rect?.bottom <= messages?.bottom
        && rect?.bottom < innerHeight
        && messagesElement.scrollTop + messagesElement.clientHeight >= messagesElement.scrollHeight - 2
        && !document.querySelector('#msgs .turn:last-child .typing-indicator')
        && document.querySelector('#tag')?.textContent === '4/4 · Format'
        && document.documentElement.dataset.storyAnswerPresented === 'true'
        && chat?.bottom > 0 && chat?.top < 320
        && !document.querySelector('#meal-story')?.classList.contains('on');
      }, null, { timeout: 20_000 });
    } catch (error) {
      const state = await page.evaluate(() => ({
        tag: document.querySelector('#tag')?.textContent,
        chatBusy: window.chatBusy,
        holdMs: window.chatHoldUntil ? window.chatHoldUntil - Date.now() : 0,
        answer: document.querySelector('#msgs .turn:last-child .bub.ai')?.textContent,
        typing: !!document.querySelector('#msgs .turn:last-child .typing-indicator'),
        answerPresented: document.documentElement.dataset.storyAnswerPresented,
        mealOn: document.querySelector('#meal-story')?.classList.contains('on'),
        complete: document.documentElement.dataset.promptStoryComplete,
        chatTop: document.querySelector('.chat')?.getBoundingClientRect().top,
        messages: document.querySelector('#msgs') && {
          top: document.querySelector('#msgs').getBoundingClientRect().top,
          bottom: document.querySelector('#msgs').getBoundingClientRect().bottom,
          scrollTop: document.querySelector('#msgs').scrollTop,
          clientHeight: document.querySelector('#msgs').clientHeight,
          scrollHeight: document.querySelector('#msgs').scrollHeight,
        },
      }));
      error.message += `; final answer frame state: ${JSON.stringify(state)}`;
      throw error;
    }
    await page.waitForFunction(() => document.querySelector('#meal-story')?.classList.contains('on'), null, { timeout: 20_000 });
    await page.waitForFunction(() => {
      const scene = document.querySelector('#meal-story');
      const actor = document.querySelector('#prompt-actor');
      return scene?.classList.contains('on')
        && Number.parseFloat(getComputedStyle(scene).opacity) > 0.999
        && actor?.classList.contains('eating')
        && actor.getBoundingClientRect().left > 80;
    }, null, { timeout: 5_000 });
    await page.waitForFunction(() => {
      const scene = document.querySelector('#meal-story');
      const actor = document.querySelector('#prompt-actor');
      const arm = document.querySelector('#meal-arm');
      const upper = document.querySelector('#meal-arm-upper');
      const forearm = document.querySelector('#meal-forearm');
      return scene?.classList.contains('bite')
        && actor?.classList.contains('bite')
        && arm?.classList.contains('at-mouth')
        && upper && getComputedStyle(upper).transform !== 'none'
        && forearm && getComputedStyle(forearm).transform !== 'none';
    }, null, { timeout: 5_000 });
    await page.waitForTimeout(500);
    const bitePhysics = await page.evaluate(() => {
      const actor = document.querySelector('#prompt-actor');
      const avatar = actor.querySelector('.mc');
      const arm = document.querySelector('#meal-arm');
      const upper = document.querySelector('#meal-arm-upper');
      const forearm = document.querySelector('#meal-forearm');
      const food = document.querySelector('#meal-food');
      const point = (node, x, y) => {
        const matrix = node.getScreenCTM();
        return { x: matrix.a * x + matrix.c * y + matrix.e, y: matrix.b * x + matrix.d * y + matrix.f };
      };
      const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      const shoulder = point(upper, 95, 76);
      const characterShoulder = point(avatar, 95, 76);
      const elbow = point(upper, 115, 93);
      const wrist = point(forearm, 139, 103);
      const bite = point(food, 147, 89);
      const mouth = point(avatar, 70, 60);
      const torso = avatar.querySelector('.persona-figure>path[fill="#3BA8FF"]');
      const hand = actor.querySelector('#meal-forearm>path[fill="#FED7AA"]');
      const face = avatar.querySelector('.persona-figure>ellipse[cx="70"][cy="54"]');
      const oldPoseGroups = Array.from(avatar.querySelectorAll('.persona-figure>.pr,.persona-figure>.pm,.persona-figure>.pe,.persona-figure>.ps,.persona-figure>.pt,.persona-figure>.pf'));
      return {
        shoulderGap: distance(shoulder, characterShoulder),
        upperArmLength: distance(shoulder, elbow),
        forearmLength: distance(elbow, wrist),
        foodToMouth: distance(bite, mouth),
        sleeveMatchesTorso: upper.querySelector('path[stroke="#3BA8FF"]')?.getAttribute('stroke') === torso?.getAttribute('fill'),
        handMatchesSkin: hand?.getAttribute('fill')?.toLowerCase() === face?.getAttribute('fill')?.toLowerCase(),
        oldPoseCount: oldPoseGroups.length,
        oldPosesHidden: oldPoseGroups.every((group) => getComputedStyle(group).display === 'none'),
      };
    });
    assert.ok(bitePhysics.shoulderGap < 1, `arm shoulder stays attached (${bitePhysics.shoulderGap.toFixed(1)}px gap)`);
    assert.ok(bitePhysics.upperArmLength > 20 && bitePhysics.upperArmLength < 30, 'upper arm rotates as a fixed-length segment');
    assert.ok(bitePhysics.forearmLength > 20 && bitePhysics.forearmLength < 30, 'forearm rotates as a fixed-length segment');
    assert.ok(bitePhysics.foodToMouth < 14, `chopstick bite reaches the mouth (${bitePhysics.foodToMouth.toFixed(1)}px gap)`);
    assert.equal(bitePhysics.sleeveMatchesTorso, true, 'sleeve uses the character’s shirt color');
    assert.equal(bitePhysics.handMatchesSkin, true, 'hand uses the character’s skin color');
    assert.equal(bitePhysics.oldPoseCount, 6, 'all six original role, task and format poses are accounted for');
    assert.equal(bitePhysics.oldPosesHidden, true, 'old pose hands stay hidden while the single meal arm is active');
    await page.waitForFunction(() => document.querySelector('#story-handoff.on')?.textContent.trim() === 'Now your turn', null, { timeout: 10_000 });
    await page.waitForFunction(() => document.documentElement.dataset.promptStoryComplete === 'true', null, { timeout: 15_000 });
    await page.waitForFunction(() => !document.querySelector('#prompt-actor'), null, { timeout: 5_000 });
    const normal = await page.evaluate(() => ({
      taps: window.__promptTaps,
      tapTimings: window.__promptTapTimings,
      finalAnswer: document.querySelector('#msgs .turn:last-child .bub.ai')?.textContent || '',
      mealVisible: document.querySelector('#meal-story')?.classList.contains('on') || false,
      complete: document.documentElement.dataset.promptStoryComplete === 'true',
      handoff: document.querySelector('#story-handoff')?.textContent.trim() || '',
      viewport: `${innerWidth}x${innerHeight}`,
    }));
    assert.equal(normal.viewport, '390x844');
    assert.deepEqual(normal.taps, ['gate-1', 'option-guide', 'gate-2', 'option-lunch', 'gate-3', 'option-v', 'gate-4', 'option-list']);
    for (const gate of ['gate-1', 'gate-2', 'gate-3', 'gate-4']) {
      const gateIndex = normal.tapTimings.findIndex((tap) => tap.key === gate);
      const optionTap = normal.tapTimings[gateIndex + 1];
      assert.ok(optionTap?.key.startsWith('option-'), `${gate} is followed by its option click`);
      const gap = optionTap.ms - normal.tapTimings[gateIndex].ms;
      assert.ok(gap >= 2_200, `${gate} and its option are visibly separated by ${Math.round(gap)}ms`);
      assert.ok(gap <= 3_400, `${gate} to option remains responsive (${Math.round(gap)}ms)`);
    }
    assert.match(normal.finalAnswer, /Vegan Izakaya Masaka/);
    assert.equal(normal.mealVisible, false, 'the payoff returns to the lesson UI');
    assert.equal(normal.complete, true);
    assert.equal(normal.handoff, 'Now your turn', 'the final story beat hands the lesson to the learner');
    assert.ok(explanationMs >= 2_800 && explanationMs <= 4_500);
    const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await reduced.emulateMedia({ reducedMotion: 'reduce' });
    await installTapRecorder(reduced);
    await reduced.goto(pathToFileURL(pacingLessonPath).href, { waitUntil: 'domcontentloaded' });
    await reduced.waitForFunction(() => window.__arrivalFrameLoaded === true, null, { timeout: 15_000 });
    const reducedArrivalFrame = await waitForArrivalBeat(reduced, 'reduced-motion arrival remains visible through landing');
    const reducedArrival = await reducedArrivalFrame.evaluate(() => {
      const opacity = (selector) => Number.parseFloat(getComputedStyle(document.querySelector(selector)).opacity);
      return {
        parkedPlane: opacity('.parked-plane'),
        traveler: opacity('.airport-traveler'),
        hungry: document.querySelector('.airport-traveler')?.classList.contains('hungry') || false,
        stomachCue: opacity('.airport-traveler .stomach-cue'),
      };
    });
    assert.ok(reducedArrival.parkedPlane > 0.8, 'reduced motion still lands the plane');
    assert.ok(reducedArrival.traveler > 0.8 && reducedArrival.hungry, 'reduced motion shows hungry Sam');
    assert.ok(reducedArrival.stomachCue > 0.2, 'reduced motion preserves the hunger cue');
    await reduced.waitForFunction(() => document.documentElement.dataset.promptStoryComplete === 'true', null, { timeout: 30_000 });
    await reduced.waitForFunction(() => document.querySelector('#story-handoff.on')?.textContent.trim() === 'Now your turn', null, { timeout: 5_000 });
    const reducedResult = await reduced.evaluate(() => ({
      taps: window.__promptTaps,
      answer: document.querySelector('#msgs .turn:last-child .bub.ai')?.textContent || '',
      mealVisible: document.querySelector('#meal-story')?.classList.contains('on') || false,
      complete: document.documentElement.dataset.promptStoryComplete === 'true',
      handoff: document.querySelector('#story-handoff')?.textContent.trim() || '',
    }));
    assert.match(reducedResult.answer, /Vegan Izakaya Masaka/);
    assert.equal(reducedResult.mealVisible, false, 'reduced motion advances past the meal scene');
    assert.equal(reducedResult.complete, true, 'reduced motion reaches the lesson handoff');
    assert.equal(reducedResult.handoff, 'Now your turn');
    await page.close();
    await reduced.close();
  } finally {
    await browser.close();
  }
});
