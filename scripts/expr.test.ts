import { expect, test } from 'bun:test';
import { compile, evaluate, fillTemplate } from '../src/lib/expr';
test('basics', () => {
  expect(evaluate('2+3*4', {})).toBe(14);
  expect(evaluate('2^3^2', {})).toBe(512);
  expect(evaluate('-x^2', { x: 3 })).toBe(-9);
  expect(evaluate('2x', { x: 3 })).toBe(6);
  expect(evaluate('2(x+1)', { x: 3 })).toBe(8);
  expect(evaluate('sin(pi/2)', {})).toBeCloseTo(1);
  expect(evaluate('a*sin(b*x - t)', { a: 2, b: 1, x: Math.PI / 2, t: 0 })).toBeCloseTo(2);
  expect(evaluate('sum(k,1,3,k^2)', {})).toBe(14);
  expect(evaluate('sum(k,1,n,sin((2*k-1)*x)/(2*k-1))', { n: 50, x: 1 })).toBeCloseTo(Math.PI / 4, 1);
  expect(evaluate('if(x>0, 1, -1)', { x: -2 })).toBe(-1);
  expect(evaluate('x > 0 ? 1 : 2', { x: 1 })).toBe(1);
  expect(evaluate('rad(180)', {})).toBeCloseTo(Math.PI);
  expect(evaluate('2**3', {})).toBe(8);
  expect(evaluate('π', {})).toBeCloseTo(Math.PI);
  expect(evaluate('1/0', {}, 7)).toBe(7);
  expect(compile('a*x+b').vars.sort()).toEqual(['a', 'b', 'x']);
  expect(compile('sum(k,1,n,k*x)').vars.sort()).toEqual(['n', 'x']);
});
test('rejects code', () => {
  expect(() => compile('alert(1)')).toThrow();
  expect(() => compile('constructor.constructor("x")()')).toThrow();
  expect(() => compile('x; y')).toThrow();
  expect(() => compile('__proto__')).not.toThrow();
  expect(evaluate('__proto__', {}, 5)).toBe(5);
  expect(evaluate('toString', {}, 5)).toBe(5);
});
test('templates', () => {
  expect(fillTemplate('sin = {sin(th)}', { th: Math.PI / 2 })).toBe('sin = 1');
  expect(fillTemplate('$\\frac{a}{b}$ and {a}', { a: 2 })).toBe('$\\frac{a}{b}$ and 2');
});
