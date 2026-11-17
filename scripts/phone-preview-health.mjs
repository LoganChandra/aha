export function phonePreviewFailure({ status, contentType = '', html = '' }) {
  if (/ERR_NGROK_3200/i.test(html)) return 'The ngrok endpoint is offline.';
  if (status === 503) return 'The phone preview tunnel is unavailable (HTTP 503).';
  if (status < 200 || status >= 300) return `HTTP ${status}`;
  if (!contentType.toLowerCase().includes('text/html')) return 'Response is not HTML.';
  if (!/<title>Sam builds a Tokyo food prompt<\/title>/i.test(html)) {
    return 'The URL did not serve the Tokyo food lesson.';
  }
  if (!/id="arrival-sequence"[^>]*src="58\.html"/i.test(html)) {
    return 'The plane landing scene is missing.';
  }
  if (!/async function runPromptStory\s*\(/.test(html)) {
    return 'The prompt-building story is missing.';
  }
  return null;
}

export async function checkPhonePreview(url, fetcher = fetch) {
  try {
    const page = await fetcher(url, { signal: AbortSignal.timeout(8000) });
    const html = await page.text();
    const pageFailure = phonePreviewFailure({
      status: page.status,
      contentType: page.headers.get('content-type') || '',
      html,
    });
    if (pageFailure) return { ok: false, url, reason: pageFailure };

    const landingUrl = new URL('58.html', page.url || url).href;
    const landing = await fetcher(landingUrl, { signal: AbortSignal.timeout(8000) });
    const landingHtml = await landing.text();
    if (!landing.ok || !landingHtml.includes('class="flight-plane"') || !landingHtml.includes('class="parked-plane"')) {
      return { ok: false, url, reason: 'The landing scene asset is unavailable.' };
    }

    return { ok: true, url };
  } catch (error) {
    return { ok: false, url, reason: error instanceof Error ? error.message : String(error) };
  }
}
