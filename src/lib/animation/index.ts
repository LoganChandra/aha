// Part 3 of 3: Animation (Stage). Turns a planned lesson into the interactive recipe the player draws. Hands off a `Lesson`.
export { makeLesson, copiesPlaybook } from './lesson';
export { answerQuestion, type AskContext, type Answer } from './tutor';
export { LESSON_ROUTES, FIRST_LESSON_ROUTES, ASK_ROUTES } from './routes';
export { PLAYBOOK, PATTERN_IDS } from './playbook';
export { checkLesson, repair } from './validate';
export { describeSteps } from './inspect';
export type { Lesson } from '../recipe';
