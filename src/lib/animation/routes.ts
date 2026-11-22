import type { Route } from '../ai';
import { tiers } from '../models';

// Re-measured after the visual guide grew the prompt to ~18k tokens: DeepSeek with thinking (low or medium) did
// not finish within 80 s and prod fell through to GLM after 50-90 s. Without thinking it writes a lesson in 8-10 s.
// The A/B gain from thinking was small (4.12 vs 3.94); the quality now comes from the guide and the playbook.
export const LESSON_ROUTES: Route[] = tiers(12_000, process.env.LESSON_THINK === 'on');
export const FIRST_LESSON_ROUTES: Route[] = tiers(8000, false);
export const ASK_ROUTES: Route[] = tiers(800, false);
