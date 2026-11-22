import { expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { CountryPack, NEEDS, usablePack } from '../src/lib/country-pack';

// The journey map in profai-web (src/lib/towns.ts JOURNEYS), copied here so a pack cannot drift from it.
const MAP: Record<string, string[]> = {
  japan: ['Tokyo', 'Kyoto', 'Hiroshima', 'Fukuoka', 'Sapporo'],
  korea: ['Seoul', 'Jeonju', 'Gyeongju', 'Busan', 'Jeju'],
  thailand: ['Bangkok', 'Ayutthaya', 'Chiang Mai', 'Krabi', 'Phuket'],
  malaysia: ['Kuala Lumpur', 'Malacca', 'Penang', 'Langkawi', 'Kota Kinabalu'],
};
const dir = new URL('../src/content/countries/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
const load = (f: string) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));

for (const f of files) {
  test(`pack ${f}: valid and matches the journey map`, () => {
    const r = CountryPack.safeParse(load(f));
    expect(r.success ? [] : r.error.issues).toEqual([]);
    if (!r.success) return;
    expect(MAP[r.data.journey]).toBeDefined();
    expect(r.data.cities.map((c) => c.name)).toEqual(MAP[r.data.journey]);
  });
  test(`pack ${f}: every city can solve the hungry need, and every need is a known one`, () => {
    const p = CountryPack.parse(load(f));
    for (const c of p.cities) {
      expect(c.scenarios.some((s) => s.need === 'hungry' || s.need === 'route')).toBe(true);
      for (const s of c.scenarios) expect(NEEDS).toContain(s.need);
    }
  });
}

test('a draft pack is never usable; only a person-approved one is', () => {
  const raw = load('japan.json');
  expect(usablePack(raw)).toBeNull();
  const approved = { ...raw, review: { status: 'approved', by: 'Han', on: '2026-11-23' } };
  expect(usablePack(approved)).not.toBeNull();
});

test('approved without a name or date is rejected', () => {
  const raw = { ...load('japan.json'), review: { status: 'approved', by: null, on: null } };
  expect(CountryPack.safeParse(raw).success).toBe(false);
});

test('a fact without a source is rejected', () => {
  const raw = load('japan.json');
  raw.cities[0].facts[0].source = 'not a url';
  expect(CountryPack.safeParse(raw).success).toBe(false);
});

test('a scenario that cites a fact the city does not have is rejected', () => {
  const raw = load('japan.json');
  raw.cities[0].scenarios[0].uses = ['made-up'];
  expect(CountryPack.safeParse(raw).success).toBe(false);
});

test('the prompt never claims a price or a promise', () => {
  for (const f of files) for (const c of CountryPack.parse(load(f)).cities) for (const s of c.scenarios) expect(s.prompt).not.toMatch(/[$¥€]|\bguarantee/i);
});
