// Safe math expressions for lesson recipes. Models write strings like "a*sin(b*x - t)"; we parse them into a tree
// and compile that tree into plain closures. Nothing a model writes is ever handed to eval or new Function.

export type Env = Record<string, number>;
export type Compiled = (env: Env) => number;

type Node =
  | { k: 'num'; v: number }
  | { k: 'var'; name: string }
  | { k: 'un'; op: '-' | '!'; a: Node }
  | { k: 'bin'; op: string; a: Node; b: Node }
  | { k: 'call'; name: string; args: Node[] }
  | { k: 'sum'; idx: string; from: Node; to: Node; body: Node }
  | { k: 'tern'; c: Node; a: Node; b: Node };

const CONSTS: Record<string, number> = { pi: Math.PI, PI: Math.PI, e: Math.E, tau: 2 * Math.PI, phi: (1 + Math.sqrt(5)) / 2 };

const FNS: Record<string, (...a: number[]) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
  atan2: Math.atan2, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp,
  ln: Math.log, log: Math.log, log10: Math.log10, log2: Math.log2, sqrt: Math.sqrt, cbrt: Math.cbrt,
  abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round, sign: Math.sign,
  min: Math.min, max: Math.max, pow: Math.pow, hypot: Math.hypot,
  sec: (x) => 1 / Math.cos(x), csc: (x) => 1 / Math.sin(x), cot: (x) => 1 / Math.tan(x),
  rad: (d) => (d * Math.PI) / 180, deg: (r) => (r * 180) / Math.PI,
  clamp: (x, lo, hi) => Math.min(hi, Math.max(lo, x)),
  mod: (a, b) => ((a % b) + b) % b,
  step: (x) => (x >= 0 ? 1 : 0),
  lerp: (a, b, s) => a + (b - a) * s,
  smoothstep: (a, b, x) => { const s = Math.min(1, Math.max(0, (x - a) / (b - a))); return s * s * (3 - 2 * s); },
  fact: (n) => { let r = 1; for (let i = 2; i <= Math.min(170, Math.floor(n)); i++) r *= i; return r; },
  sigmoid: (x) => 1 / (1 + Math.exp(-x)),
  // Abramowitz & Stegun 7.1.26, error under 1.5e-7: enough for any picture.
  erf: (x) => {
    const sgn = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
    const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
    return sgn * y;
  },
  normcdf: (x, mu = 0, s = 1) => 0.5 * (1 + FNS.erf((x - mu) / (s * Math.SQRT2))),
  relu: (x) => Math.max(0, x),
  gauss: (x, mu = 0, s = 1) => Math.exp(-((x - mu) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI)),
};
FNS['if'] = (c, a, b) => (c ? a : b);

export class ExprError extends Error {}

type Tok = { t: 'num' | 'id' | 'op'; v: string };

function lex(src: string): Tok[] {
  const s = src
    .replace(/\*\*/g, '^')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/θ/g, 'theta');
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const num = /^(\d+\.?\d*(e[+-]?\d+)?|\.\d+(e[+-]?\d+)?)/i.exec(s.slice(i));
    if (num) { out.push({ t: 'num', v: num[0] }); i += num[0].length; continue; }
    const id = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i));
    if (id) { out.push({ t: 'id', v: id[0] }); i += id[0].length; continue; }
    const op = /^(<=|>=|==|!=|&&|\|\||[-+*/^%(),<>?:!])/.exec(s.slice(i));
    if (op) { out.push({ t: 'op', v: op[0] }); i += op[0].length; continue; }
    throw new ExprError(`unexpected "${c}"`);
  }
  // Implicit multiplication the way people write maths: 2x, 2(x+1), (a)(b), 3pi. An id directly followed by "("
  // is a call and stays one.
  const fixed: Tok[] = [];
  for (let j = 0; j < out.length; j++) {
    const a = fixed[fixed.length - 1];
    const b = out[j];
    if (a) {
      const aEnds = a.t === 'num' || (a.t === 'op' && a.v === ')') || a.t === 'id';
      const bStarts = b.t === 'num' || b.t === 'id' || (b.t === 'op' && b.v === '(');
      const isCall = a.t === 'id' && b.t === 'op' && b.v === '(';
      if (aEnds && bStarts && !isCall && !(a.t === 'num' && b.t === 'num')) fixed.push({ t: 'op', v: '*' });
    }
    fixed.push(b);
  }
  return fixed;
}

function parse(src: string): Node {
  const toks = lex(src);
  let p = 0;
  const peek = () => toks[p];
  const eat = (v?: string) => {
    const t = toks[p];
    if (!t || (v !== undefined && t.v !== v)) throw new ExprError(v ? `expected "${v}"` : 'unexpected end');
    p++;
    return t;
  };
  const isOp = (v: string) => peek()?.t === 'op' && peek().v === v;

  function ternary(): Node {
    const c = or();
    if (isOp('?')) { eat('?'); const a = ternary(); eat(':'); const b = ternary(); return { k: 'tern', c, a, b }; }
    return c;
  }
  function or(): Node { let a = and(); while (isOp('||')) { eat(); a = { k: 'bin', op: '||', a, b: and() }; } return a; }
  function and(): Node { let a = cmp(); while (isOp('&&')) { eat(); a = { k: 'bin', op: '&&', a, b: cmp() }; } return a; }
  function cmp(): Node {
    let a = add();
    while (['<', '>', '<=', '>=', '==', '!='].some(isOp)) { const op = eat().v; a = { k: 'bin', op, a, b: add() }; }
    return a;
  }
  function add(): Node {
    let a = mul();
    while (isOp('+') || isOp('-')) { const op = eat().v; a = { k: 'bin', op, a, b: mul() }; }
    return a;
  }
  function mul(): Node {
    let a = unary();
    while (isOp('*') || isOp('/') || isOp('%')) { const op = eat().v; a = { k: 'bin', op, a, b: unary() }; }
    return a;
  }
  function unary(): Node {
    if (isOp('-')) { eat(); return { k: 'un', op: '-', a: unary() }; }
    if (isOp('+')) { eat(); return unary(); }
    if (isOp('!')) { eat(); return { k: 'un', op: '!', a: unary() }; }
    return pow();
  }
  function pow(): Node {
    const a = atom();
    if (isOp('^')) { eat(); return { k: 'bin', op: '^', a, b: unary() }; } // right-assoc, -x^2 = -(x^2)
    return a;
  }
  function atom(): Node {
    const t = peek();
    if (!t) throw new ExprError('unexpected end');
    if (t.t === 'num') { p++; return { k: 'num', v: parseFloat(t.v) }; }
    if (t.t === 'id') {
      p++;
      if (isOp('(')) {
        eat('(');
        const args: Node[] = [];
        if (!isOp(')')) { args.push(ternary()); while (isOp(',')) { eat(); args.push(ternary()); } }
        eat(')');
        if (t.v === 'sum' || t.v === 'prod') {
          // sum(k, from, to, body)
          if (args.length !== 4 || args[0].k !== 'var') throw new ExprError(`${t.v}(k, from, to, expression) needs 4 parts`);
          const node: Node = { k: 'sum', idx: args[0].name, from: args[1], to: args[2], body: args[3] };
          return t.v === 'prod' ? { k: 'call', name: '__prod', args: [node] } : node;
        }
        if (!(t.v in FNS)) throw new ExprError(`unknown function "${t.v}"`);
        return { k: 'call', name: t.v, args };
      }
      if (t.v in CONSTS) return { k: 'num', v: CONSTS[t.v] };
      return { k: 'var', name: t.v };
    }
    if (isOp('(')) { eat('('); const a = ternary(); eat(')'); return a; }
    if (isOp('|')) throw new ExprError('use abs() instead of |x|');
    throw new ExprError(`unexpected "${t.v}"`);
  }
  const n = ternary();
  if (p < toks.length) throw new ExprError(`unexpected "${toks[p].v}"`);
  return n;
}

function compileNode(n: Node, bound: Set<string>): Compiled {
  switch (n.k) {
    case 'num': { const v = n.v; return () => v; }
    case 'var': { const name = n.name; return (env) => { const v = env[name]; return typeof v === 'number' ? v : NaN; }; }
    case 'un': { const a = compileNode(n.a, bound); return n.op === '-' ? (e) => -a(e) : (e) => (a(e) ? 0 : 1); }
    case 'tern': { const c = compileNode(n.c, bound), a = compileNode(n.a, bound), b = compileNode(n.b, bound); return (e) => (c(e) ? a(e) : b(e)); }
    case 'bin': {
      const a = compileNode(n.a, bound), b = compileNode(n.b, bound);
      switch (n.op) {
        case '+': return (e) => a(e) + b(e);
        case '-': return (e) => a(e) - b(e);
        case '*': return (e) => a(e) * b(e);
        case '/': return (e) => a(e) / b(e);
        case '%': return (e) => a(e) % b(e);
        case '^': return (e) => Math.pow(a(e), b(e));
        case '<': return (e) => +(a(e) < b(e));
        case '>': return (e) => +(a(e) > b(e));
        case '<=': return (e) => +(a(e) <= b(e));
        case '>=': return (e) => +(a(e) >= b(e));
        case '==': return (e) => +(Math.abs(a(e) - b(e)) < 1e-9);
        case '!=': return (e) => +(Math.abs(a(e) - b(e)) >= 1e-9);
        case '&&': return (e) => +(!!a(e) && !!b(e));
        case '||': return (e) => +(!!a(e) || !!b(e));
      }
      throw new ExprError(`bad operator ${n.op}`);
    }
    case 'call': {
      if (n.name === '__prod') {
        const s = n.args[0] as Extract<Node, { k: 'sum' }>;
        return compileLoop(s, bound, 1, (acc, v) => acc * v);
      }
      const f = FNS[n.name];
      const args = n.args.map((x) => compileNode(x, bound));
      if (args.length === 1) { const a0 = args[0]; return (e) => f(a0(e)); }
      if (args.length === 2) { const a0 = args[0], a1 = args[1]; return (e) => f(a0(e), a1(e)); }
      return (e) => f(...args.map((g) => g(e)));
    }
    case 'sum': return compileLoop(n, bound, 0, (acc, v) => acc + v);
  }
}

// Work budget for one evaluation, shared by every loop inside it (nested sums included). A recipe can then never
// freeze a frame: past the budget the value is NaN and the renderer skips it.
const OPS_PER_EVAL = 20_000;
let ops = 0;
class Budget extends Error {}

function compileLoop(n: Extract<Node, { k: 'sum' }>, bound: Set<string>, init: number, fold: (a: number, v: number) => number): Compiled {
  const from = compileNode(n.from, bound), to = compileNode(n.to, bound);
  const inner = new Set(bound); inner.add(n.idx);
  const body = compileNode(n.body, inner);
  const idx = n.idx;
  return (env) => {
    const a = Math.round(from(env)), b = Math.round(to(env));
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) > 1e9 || Math.abs(b) > 1e9) return NaN;
    const count = Math.min(b - a + 1, 2000); // iterations are counted, so huge bounds cannot stall k++
    let acc = init;
    const local: Env = Object.create(env);
    for (let i = 0; i < count; i++) {
      if (++ops > OPS_PER_EVAL) throw new Budget();
      local[idx] = a + i;
      acc = fold(acc, body(local));
    }
    return acc;
  };
}

function freeVars(n: Node, bound: Set<string>, out: Set<string>) {
  switch (n.k) {
    case 'var': if (!bound.has(n.name)) out.add(n.name); return;
    case 'un': freeVars(n.a, bound, out); return;
    case 'bin': freeVars(n.a, bound, out); freeVars(n.b, bound, out); return;
    case 'tern': freeVars(n.c, bound, out); freeVars(n.a, bound, out); freeVars(n.b, bound, out); return;
    case 'call': n.args.forEach((a) => freeVars(a, bound, out)); return;
    case 'sum': {
      freeVars(n.from, bound, out); freeVars(n.to, bound, out);
      const inner = new Set(bound); inner.add(n.idx); freeVars(n.body, inner, out); return;
    }
  }
}

const cache = new Map<string, { fn: Compiled; vars: string[] }>();

/** Compile an expression (or a plain number) once; later calls with the same text reuse it. */
export function compile(src: string | number): { fn: Compiled; vars: string[] } {
  if (typeof src === 'number') return { fn: () => src, vars: [] };
  const key = String(src);
  const hit = cache.get(key);
  if (hit) return hit;
  const tree = parse(key);
  const vars = new Set<string>();
  freeVars(tree, new Set(), vars);
  const inner = compileNode(tree, new Set());
  const fn: Compiled = (env) => {
    ops = 0;
    try { return inner(env); } catch (e) { if (e instanceof Budget) return NaN; throw e; }
  };
  const res = { fn, vars: [...vars] };
  if (cache.size > 5000) cache.clear();
  cache.set(key, res);
  return res;
}

/** Evaluate safely: any parse error or non-finite result comes back as the fallback. */
export function evaluate(src: string | number | undefined, env: Env, fallback = 0): number {
  if (src === undefined) return fallback;
  try {
    const v = compile(src).fn(env);
    return Number.isFinite(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

/** Fill "{expr}" holes in text with live values, e.g. "sin θ = {sin(theta)}". Braces inside $...$ are LaTeX and stay. */
export function fillTemplate(text: string, env: Env): string {
  return text
    .split(/(\$[^$]*\$)/g)
    .map((part) => (part.startsWith('$') && part.endsWith('$') && part.length > 1 ? part : part.replace(/\{([^{}]+)\}/g, (m, inner: string) => {
      try {
        const v = compile(inner).fn(env);
        return Number.isFinite(v) ? formatNumber(v) : '-';
      } catch {
        return m;
      }
    })))
    .join('');
}

export function formatNumber(v: number): string {
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e6 || a < 1e-3)) return v.toExponential(2).replace('e+', 'e');
  const d = a >= 100 ? 0 : a >= 10 ? 1 : 2;
  return (Math.round(v * 10 ** d) / 10 ** d).toString();
}

export const BUILTIN_VARS = new Set(['x', 't', 's', 'y', 'z']);
