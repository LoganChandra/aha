// The engine, in three parts that hand typed results to each other:
//   research  (src/lib/research)  -> Fact[] / Source[]
//   planning  (src/lib/planning)  -> Plan
//   animation (src/lib/animation) -> Lesson
// This file only re-exports them, so the API routes and scripts keep one import. Shared plumbing: models.ts, ai.ts.
export { type Meter } from './models';
export * from './research';
export * from './planning';
export * from './animation';
