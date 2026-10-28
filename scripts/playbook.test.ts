import { expect, test } from 'bun:test';
import { PLAYBOOK } from '../src/lib/playbook';
import { checkLesson } from '../src/lib/validate';
for (const p of PLAYBOOK) {
  test(`playbook: ${p.id}`, () => {
    const { lesson, errors } = checkLesson(JSON.parse(JSON.stringify(p.example)));
    expect(errors).toEqual([]);
    expect(lesson).not.toBeNull();
  });
}
