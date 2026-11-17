import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkPhonePreview, phonePreviewFailure } from './phone-preview-health.mjs';

const lessonUrl = 'https://preview.example.test/lesson1-video.html';
const lessonHtml = '<title>Sam builds a Tokyo food prompt</title><iframe id="arrival-sequence" src="58.html"></iframe><script>async function runPromptStory(){}</script>';
const landingHtml = '<div class="flight-plane"></div><div class="parked-plane"></div>';

test('accepts a live lesson page only when its plane asset also loads', async () => {
  const requested = [];
  const result = await checkPhonePreview(lessonUrl, async (input) => {
    const url = String(input);
    requested.push(url);
    return new Response(url.endsWith('/58.html') ? landingHtml : lessonHtml, {
      headers: { 'content-type': 'text/html' },
    });
  });

  assert.equal(result.ok, true);
  assert.deepEqual(requested, [lessonUrl, 'https://preview.example.test/58.html']);
});

test('rejects the ngrok offline page before sharing its URL', async () => {
  let requests = 0;
  const result = await checkPhonePreview(lessonUrl, async () => {
    requests += 1;
    return new Response('<h1>ERR_NGROK_3200</h1><p>endpoint is offline</p>', {
      status: 404,
      headers: { 'content-type': 'text/html' },
    });
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'The ngrok endpoint is offline.');
  assert.equal(requests, 1);
});

test('rejects a 503 tunnel outage before sharing its URL', async () => {
  let requests = 0;
  const result = await checkPhonePreview(lessonUrl, async () => {
    requests += 1;
    return new Response('<h1>Tunnel unavailable</h1>', {
      status: 503,
      headers: { 'content-type': 'text/html' },
    });
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'The phone preview tunnel is unavailable (HTTP 503).');
  assert.equal(requests, 1);
});

test('rejects successful responses that are not the lesson page', () => {
  assert.equal(phonePreviewFailure({
    status: 200,
    contentType: 'text/html',
    html: '<title>Welcome to the ngrok inspector</title>',
  }), 'The URL did not serve the Tokyo food lesson.');
});
