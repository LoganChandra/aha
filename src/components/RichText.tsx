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
  const filled = env ? fillTemplate(text, env) : text;
  const parts = filled.split(/(\$\$[^$]+\$\$|\$[^$\n]+\$)/g).filter(Boolean);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        const display = p.startsWith('$$') && p.endsWith('$$') && p.length > 4;
        const inline = !display && p.startsWith('$') && p.endsWith('$') && p.length > 2;
        if (display || inline) {
          const src = display ? p.slice(2, -2) : p.slice(1, -1);
          return <span key={i} dangerouslySetInnerHTML={{ __html: renderMath(src) }} />;
        }
        return <span key={i}>{p.replace(/\*\*(.+?)\*\*/g, '$1')}</span>;
      })}
    </span>
  );
}

export default memo(RichTextInner);
