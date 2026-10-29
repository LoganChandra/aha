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

import { descentPath, nextWordProbs } from '../src/components/scene/AiTemplates';
describe('AI template maths', () => {
  test('next-word chances add to 1 and temperature flattens them', () => {
    const p1 = nextWordProbs([2.2, 1.4, -1], 1), hot = nextWordProbs([2.2, 1.4, -1], 3), cold = nextWordProbs([2.2, 1.4, -1], 0.1);
    expect(Math.abs(p1.reduce((a, b) => a + b, 0) - 1)).toBeLessThan(1e-9);
    expect(hot[2]).toBeGreaterThan(p1[2]);
    expect(cold[0]).toBeGreaterThan(0.99);
  });
  test('gradient descent converges with a small step and overshoots with a big one', () => {
    const L = (w: number) => 0.5 * (w - 2) ** 2;
    const small = descentPath(L, -1, 0.3, 8), big = descentPath(L, -1, 2.1, 4);
    expect(Math.abs(small[8] - 2)).toBeLessThan(0.2);
    expect(Math.sign(big[1] - 2)).toBe(-Math.sign(big[0] - 2)); // jumped past the bottom
    expect(Math.abs(big[4] - 2)).toBeGreaterThan(Math.abs(big[0] - 2)); // and got worse
  });
});

import { rewardPolicy } from '../src/components/scene/AiTemplates';
describe('reward template maths', () => {
  test('no feedback is uniform; feedback finds the best; no exploring commits harder', () => {
    const r = [0.9, 0.4, 0.1];
    const start = rewardPolicy(r, 0, 0.15).pick;
    expect(Math.max(...start) - Math.min(...start)).toBeLessThan(1e-9);
    const late = rewardPolicy(r, 30, 0.15);
    expect(late.pick[0]).toBeGreaterThan(0.6);
    expect(Math.abs(late.est[0] - 0.9)).toBeLessThan(0.05);
    expect(rewardPolicy(r, 30, 0).pick[0]).toBeGreaterThan(late.pick[0]);
    expect(Math.abs(late.pick.reduce((a, b) => a + b, 0) - 1)).toBeLessThan(1e-9);
  });
});

import { convolve } from '../src/components/scene/AiTemplates';
describe('convolution template maths', () => {
  test('an edge filter fires on the edge and is zero on flat areas', () => {
    const { out } = convolve(['....####', '....####', '....####', '....####'], [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]]);
    expect(out[0][0]).toBe(0);
    expect(out[0][2]).toBe(3);
    expect(out[0][5]).toBe(0);
  });
});

import { airMass, lightLeft } from '../src/components/scene/Sky';
describe('sky template physics', () => {
  test('air mass is 1 overhead and about 38 at the horizon; sunset loses most blue', () => {
    expect(airMass(90)).toBeCloseTo(1, 2);
    expect(airMass(0)).toBeGreaterThan(35);
    expect(lightLeft(90).blue).toBeGreaterThan(0.7);
    expect(lightLeft(2).blue).toBeLessThan(0.05);
    expect(lightLeft(2).red).toBeGreaterThan(lightLeft(2).blue);
  });
});

describe('words must match the picture', () => {
  const base = { title: 't', params: [{ id: 'a', label: 'a', min: 0, max: 1, value: 0 }], scene: { type: 'graph2d', x: [0, 1], y: [0, 1], items: [{ id: 'dog', type: 'point', x: 0.5, y: 0.5, label: 'dog', tone: 'primary' }] } };
  test('a colour nothing is drawn in is caught', () => {
    const l = { ...base, steps: [{ say: 'The orange arrow points up.' }, { say: 'x', task: { kind: 'tap', target: 'dog', hint: 'Tap the dog.' } }, { say: 'y', task: { kind: 'tap', target: 'dog', hint: 'Tap the dog.' } }] };
    expect(checkLesson(l).errors.some((e) => e.includes('"orange"'))).toBe(true);
  });
  test('a tap task naming something not drawn is caught', () => {
    const l = { ...base, steps: [{ say: 'Tap the word closest to "cat".', task: { kind: 'tap', target: 'dog', hint: 'Tap it.' } }, { say: 'y', task: { kind: 'tap', target: 'dog', hint: 'Tap the dog.' } }, { say: 'z' }] };
    expect(checkLesson(l).errors.some((e) => e.includes('"cat"'))).toBe(true);
  });
});
