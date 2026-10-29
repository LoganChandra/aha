import { describe, expect, test } from 'bun:test';
import { describeSteps } from '../src/lib/inspect';
import { PLAYBOOK } from '../src/lib/playbook';
import { checkLesson } from '../src/lib/validate';

describe('inspector record', () => {
  test('every playbook lesson replays into a step-by-step screen record', () => {
    for (const p of PLAYBOOK) {
      const l = checkLesson(p.example).lesson!;
      const d = describeSteps(l);
      expect(d).toContain('STEP 1');
      expect(d).toContain('SCREEN AT START');
      expect(d).not.toContain('NaN');
    }
  });
  test('a blank readout is caught by the checker', () => {
    const l = { title: 't', params: [{ id: 'a', label: 'a', min: 0, max: 1, value: 0 }], scene: { type: 'graph2d', x: [0, 1], y: [0, 1], items: [{ id: 'r', type: 'text', at: [0.1, 0.9], text: 'ratio: {1/a}' }] }, steps: [{ say: 'Look.' }, { say: 'Again.' }] };
    expect(checkLesson(l).errors.some((e) => e.includes('shows a blank'))).toBe(true);
  });
  test('feedback quoting a loose goal value is caught', () => {
    const l = { title: 't', params: [{ id: 'th', label: 'angle', min: 0, max: 90, value: 10 }], scene: { type: 'graph2d', x: [0, 1], y: [0, 1], items: [{ id: 'r', type: 'text', at: [0.1, 0.9], text: 'angle {th}' }] },
      steps: [{ say: 'Drag to 45.', task: { kind: 'slide', param: 'th', goal: 'abs(th-45)<5', hint: 'Slide it.' }, after: 'At 45 the ratio is 0.71.' }, { say: 'Tap.', task: { kind: 'tap', target: 'r', hint: 'Tap.' } }, { say: 'Again.', task: { kind: 'tap', target: 'r', hint: 'Tap.' } }] };
    expect(checkLesson(l).errors.some((e) => e.includes('quotes 45'))).toBe(true);
  });
});

import { attentionWeights } from '../src/components/scene/Attention';
describe('attention template maths', () => {
  test('rows sum to 1, masked cells are exactly 0, scale sharpens', () => {
    const s = [[2, 1, 0], [1, 3, 1], [0, 3, 1]];
    const w = attentionWeights(s, 1, true);
    for (const r of w) expect(Math.abs(r.reduce((a, b) => a + b, 0) - 1)).toBeLessThan(1e-9);
    expect(w[0][1]).toBe(0); expect(w[0][2]).toBe(0); expect(w[1][2]).toBe(0);
    expect(w[0][0]).toBeCloseTo(1, 9);
    const soft = attentionWeights(s, 0.2, false), sharp = attentionWeights(s, 3, false);
    expect(Math.max(...sharp[1])).toBeGreaterThan(Math.max(...soft[1]));
    // a score of 0 is not zero attention: e^0 is a share like any other (panel, Daniel)
    expect(attentionWeights([[0, 0], [0, 0]], 1, false)[0][0]).toBeCloseTo(0.5, 9);
  });
});
