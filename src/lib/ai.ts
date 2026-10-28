// OpenRouter client. One function for every call: JSON out, cost in, and a model chain so a slow or broken
// provider never leaves the learner staring at nothing.

export type Reasoning = { enabled: false } | { effort: 'low' | 'medium' | 'high' };
export type Route = { model: string; reasoning?: Reasoning; maxTokens?: number };

export type JsonResult<T> = {
  data: T;
  model: string;
  costUsd: number;
  ms: number;
  sources: { title: string; url: string }[];
};

export class AiError extends Error {
  constructor(message: string, readonly raw?: string) {
    super(message);
  }
}

export type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

export async function chatJson<T = unknown>(
  route: Route,
  messages: Msg[],
  opts: { web?: boolean; timeoutMs?: number; temperature?: number } = {}
): Promise<JsonResult<T> & { text: string }> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new AiError('OPENROUTER_API_KEY is not set');
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 90_000);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://profai.vercel.app',
        'X-Title': 'ProfAI',
      },
      body: JSON.stringify({
        model: route.model,
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: route.maxTokens ?? 6000,
        ...(route.reasoning ? { reasoning: route.reasoning } : {}),
        ...(opts.web ? { plugins: [{ id: 'web', engine: 'exa', max_results: 5 }] } : {}),
        usage: { include: true },
      }),
    });
    if (!res.ok) throw new AiError(`${route.model} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const body = await res.json();
    const msg = body.choices?.[0]?.message ?? {};
    const text: string = msg.content || '';
    if (!text.trim()) throw new AiError(`${route.model} returned nothing`);
    const sources = (msg.annotations ?? [])
      .filter((a: { type?: string }) => a.type === 'url_citation')
      .map((a: { url_citation: { url: string; title?: string } }) => ({ url: a.url_citation.url, title: a.url_citation.title || hostOf(a.url_citation.url) }))
      .filter((s: { url: string }, i: number, all: { url: string }[]) => all.findIndex((x) => x.url === s.url) === i);
    return { data: extractJson<T>(text, route.model), text, model: route.model, costUsd: Number(body.usage?.cost ?? 0), ms: Date.now() - started, sources };
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new AiError(`${route.model} timed out`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

/** Pull the JSON object out of whatever the model wrapped it in (fences, a sentence before it, thinking tags). */
export function extractJson<T>(text: string, model = 'model'): T {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```(?:json)?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new AiError(`${model} did not return JSON`, text.slice(0, 400));
  const body = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(body) as T;
  } catch {
    // Trailing commas are the commonest slip.
    try { return JSON.parse(body.replace(/,\s*([}\]])/g, '$1')) as T; } catch {
      throw new AiError(`${model} returned broken JSON`, body.slice(0, 400));
    }
  }
}
