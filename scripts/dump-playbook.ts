import { writeFileSync } from 'node:fs';
import { PLAYBOOK } from '../src/lib/animation/playbook';
PLAYBOOK.forEach((p, i) => writeFileSync(`scripts/out/lesson-pb-${String(i).padStart(2, '0')}-${p.id}-0.json`, JSON.stringify(p.example)));
