'use client';
// Lesson text: plain words, inline maths in $...$ (KaTeX) and live values in {expr} that follow the knobs.
import katex from 'katex';
import { memo } from 'react';
import { fillTemplate, type Env } from '@/lib/expr';

function renderMath(src: string): string {
  try {
    return katex.renderToString(src, { throwOnError: false, output: 'html', strict: 'ignore' });
  } catch {
    return src;
  }
}

function RichTextInner({ text, env, className }: { text: string; env?: Env; className?: string }) {
  // \$ is a literal dollar (money), never the start of maths: "\$100bn ... \$2tn" must not become one formula.
  const safe = text.replace(/\\\$/g, '\u0001');
  const filled = env ? fillTemplate(safe, env) : safe;
  const parts = filled.split(/(\$\$[^$]+\$\$|\$[^$\n]+\$)/g).filter(Boolean).map((x) => x.replace(/\u0001/g, '$'));
  return (
    <span className={className}>
      {parts.map((p, i) => {
        const display = p.startsWith('$$') && p.endsWith('$$') && p.length > 4;
        const inline = !display && p.startsWith('$') && p.endsWith('$') && p.length > 2;
        if (display || inline) {
          const src = display ? p.slice(2, -2) : p.slice(1, -1);
          return <span key={i} dangerouslySetInnerHTML={{ __html: renderMath(src) }} />;
        }
        // Markdown emphasis markers from a model show as plain words (house rule: no italics, and no stray asterisks).
        return <span key={i}>{p.replace(/\*\*(.+?)\*\*/g, '$1').replace(/(^|[\s(])[*_]([^*_\n]+?)[*_](?=[\s.,;:!?)]|$)/g, '$1$2')}</span>;
      })}
    </span>
  );
}

export default memo(RichTextInner);
