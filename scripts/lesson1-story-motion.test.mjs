import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { chromium } from 'playwright';

const versionDir = resolve('public/previews/tokyo-food-67');
const lessonPath = resolve(versionDir, 'lesson1-video.html');
const lessonHtml = await readFile(lessonPath, 'utf8');
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

test('story keeps 61 UI, connects the restaurant payoff, and ships only its two HTML files', async () => {
  assert.deepEqual((await readdir(versionDir)).sort(), ['58.html', 'lesson1-video.html']);
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

test('phone QA follows the character from arrival through clicks, answer and eating', { timeout: 120_000 }, async () => {
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
    let previous = '';
    window.setInterval(() => {
      const target = document.querySelector('.prompt-target.tapping');
      const gate = target?.matches('.gate') ? target.dataset.i : '';
      const option = target?.matches('.opt') ? target.querySelector('input')?.dataset.k : '';
      const key = gate ? `gate-${gate}` : option ? `option-${option}` : '';
      if (key && key !== previous) window.__promptTaps.push(key);
      previous = key;
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
    await page.goto(pathToFileURL(lessonPath).href, { waitUntil: 'domcontentloaded' });
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
    for (const item of expected) await waitForGateAndOption(page, item);

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
      finalAnswer: document.querySelector('#msgs .turn:last-child .bub.ai')?.textContent || '',
      mealVisible: document.querySelector('#meal-story')?.classList.contains('on') || false,
      complete: document.documentElement.dataset.promptStoryComplete === 'true',
      handoff: document.querySelector('#story-handoff')?.textContent.trim() || '',
      viewport: `${innerWidth}x${innerHeight}`,
    }));
    assert.equal(normal.viewport, '390x844');
    assert.deepEqual(normal.taps, ['gate-1', 'option-guide', 'gate-2', 'option-lunch', 'gate-3', 'option-v', 'gate-4', 'option-list']);
    assert.match(normal.finalAnswer, /Vegan Izakaya Masaka/);
    assert.equal(normal.mealVisible, false, 'the payoff returns to the lesson UI');
    assert.equal(normal.complete, true);
    assert.equal(normal.handoff, 'Now your turn', 'the final story beat hands the lesson to the learner');
    const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await reduced.emulateMedia({ reducedMotion: 'reduce' });
    await installTapRecorder(reduced);
    await reduced.goto(pathToFileURL(lessonPath).href, { waitUntil: 'domcontentloaded' });
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
