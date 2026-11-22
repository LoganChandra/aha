// Development only: serves the bake-off lessons so every renderer can be checked by eye. 404 in production.
import { readdirSync, readFileSync } from 'node:fs';
import { connection } from 'next/server';
import { checkLesson } from '@/lib/animation/validate';

export async function GET(req: Request) {
  await connection();
  if (process.env.NODE_ENV === 'production') return new Response('Not found', { status: 404 });
  const dir = 'scripts/out';
  const f = new URL(req.url).searchParams.get('f');
  const files = readdirSync(dir).filter((x) => x.startsWith('lesson-') && x.endsWith('.json') && !x.includes('results'));
  if (!f) return Response.json(files);
  if (!files.includes(f)) return new Response('Not found', { status: 404 });
  const { lesson, errors } = checkLesson(JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));
  return Response.json({ lesson, errors });
}
