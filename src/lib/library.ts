// The curated library: courses built once with the best models, inspected screen by screen, committed as JSON and
// served instantly at no model cost. A prompt matches a course by its title or any alias, at the same level.
import 'server-only';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Lesson, Level, Plan, Source } from './recipe';
import { normalisePrompt } from './server';

export type LibraryCourse = { slug: string; level: Level; aliases: string[]; plan: Plan; sources: Source[]; lessons: Lesson[] };

let index: Map<string, LibraryCourse> | null = null;

function load(): Map<string, LibraryCourse> {
  if (index) return index;
  index = new Map();
  const dir = path.join(process.cwd(), 'src/content/library');
  let files: string[] = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith('.json')); } catch { return index; }
  for (const f of files) {
    try {
      const c = JSON.parse(readFileSync(path.join(dir, f), 'utf8')) as LibraryCourse;
      for (const name of [c.plan.topic, ...c.aliases]) index.set(`${c.level}:${normalisePrompt(name)}`, c);
    } catch { /* a broken file never takes the app down */ }
  }
  return index;
}

export function findCourse(prompt: string, level: Level): LibraryCourse | undefined {
  return load().get(`${level}:${normalisePrompt(prompt)}`);
}
