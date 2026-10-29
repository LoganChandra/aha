// Server helpers: the shared cache, signed plan ids, a per-visitor rate limit.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { getCache } from '@vercel/functions';
import type { Level, Plan, Source } from './recipe';

// Bump when prompts or the recipe format change, so old cached lessons are not served against new renderers.
export const CACHE_VERSION = 'v37';
const DAY = 86_400;

const cache = () => getCache({ namespace: `profai-${CACHE_VERSION}` });

export async function cacheGet<T>(key: string): Promise<T | undefined> {
  try { return (await cache().get(key)) as T | undefined; } catch { return undefined; }
}
export async function cacheSet(key: string, value: unknown, ttl = 30 * DAY): Promise<void> {
  try { await cache().set(key, value, { ttl, tags: [`profai-${CACHE_VERSION}`] }); } catch { /* a cache miss is fine */ }
}

/** Same request, same key: "  How does WiFi work? " and "how does wifi work" share one cached course. */
export function normalisePrompt(p: string): string {
  return p.toLowerCase().normalize('NFKC').replace(/\s+/g, ' ').replace(/[?.!。？！\s]+$/u, '').trim();
}

const secret = () => process.env.PROFAI_SECRET || process.env.OPENROUTER_API_KEY || 'dev';

export type SignedPlan = { plan: Plan; sources: Source[]; level: Level };

/** The plan travels with the learner; its id is an HMAC over it, so the server can trust it without storing it. */
export function signPlan(sp: SignedPlan): string {
  return createHmac('sha256', secret()).update(JSON.stringify(sp)).digest('base64url').slice(0, 32);
}
export function verifyPlan(sp: SignedPlan, id: string): boolean {
  const want = Buffer.from(signPlan(sp));
  const got = Buffer.from(String(id));
  return want.length === got.length && timingSafeEqual(want, got);
}

/** Proof that a question comes from someone holding a course this server planned. */
export const askToken = (planId: string) => createHmac('sha256', secret()).update(`ask:${planId}`).digest('base64url').slice(0, 24);
export function verifyAskToken(planId: string, token: string): boolean {
  if (!planId || !token) return false;
  const want = Buffer.from(askToken(planId));
  const got = Buffer.from(String(token));
  return want.length === got.length && timingSafeEqual(want, got);
}

// ---- daily spend cap. The runtime cache is regional and not atomic, so this is a soft cap that trails by a few
// requests; the hard backstop is the credit limit on the OpenRouter key itself.
const DAILY_CAP_USD = Number(process.env.DAILY_CAP_USD || 10);
const today = () => new Date().toISOString().slice(0, 10);
export async function overBudget(): Promise<boolean> {
  const spent = (await cacheGet<number>(`spend:${today()}`)) ?? 0;
  return spent >= DAILY_CAP_USD;
}
export async function addSpend(usd: number): Promise<void> {
  if (!(usd > 0)) return;
  const key = `spend:${today()}`;
  const spent = (await cacheGet<number>(key)) ?? 0;
  await cacheSet(key, spent + usd, 2 * DAY);
}
export const RESTING = 'AHA has taught a lot today and is resting until tomorrow. Courses others started are still open.';

export const hash = (s: string) => createHash('sha256').update(s).digest('base64url').slice(0, 24);

// ---- rate limit (per instance; enough to stop one visitor burning the key, not a distributed quota)
const buckets = new Map<string, { n: number; reset: number }>();
const LIMITS = { plan: [24, 3600], lesson: [200, 3600], ask: [150, 3600] } as const;

export function limited(req: Request, kind: keyof typeof LIMITS): boolean {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';
  const [max, window] = LIMITS[kind];
  const key = `${kind}:${ip}`;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) { buckets.set(key, { n: 1, reset: now + window * 1000 }); return false; }
  b.n++;
  // Evict only expired buckets: wiping the map would reset everyone's limit for whoever filled it.
  if (buckets.size > 50_000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  return b.n > max;
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function readJson(req: Request, maxBytes = 200_000): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text();
    if (text.length > maxBytes) return null;
    const v = JSON.parse(text);
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}
