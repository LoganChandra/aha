// Decided in code, before any model: input that is a greeting, filler, a single character or has no letters is
// not a topic. A model will happily teach "yo" as Spanish; the learner almost certainly just said hello.
import type { Plan } from './recipe';

const FILLER = new Set([
  'hi', 'hii', 'hiii', 'hello', 'helo', 'hey', 'heya', 'hey there', 'yo', 'yoo', 'sup', 'wassup', 'whats up', "what's up",
  'hola', 'hai', 'hallo', 'salam', 'assalamualaikum', 'selamat pagi', 'selamat petang', 'apa khabar', 'ni hao', 'nihao', 'vanakkam',
  'ok', 'okay', 'k', 'kk', 'yes', 'no', 'yeah', 'nah', 'lol', 'lmao', 'haha', 'hmm', 'hm', 'test', 'testing', 'asdf',
  'thanks', 'thank you', 'ty', 'bye', 'good morning', 'good night', 'gm', 'gn', 'help', 'start', 'menu', 'anything', 'something', 'stuff', 'idk',
  '你好', '您好', '嗨', 'வணக்கம்',
]);

const SUGGESTIONS = ['How the heart pumps blood', 'Trigonometry', 'How a jet engine works', 'Why the sky is blue'];

export function preCheck(prompt: string): Plan | null {
  const p = prompt.toLowerCase().normalize('NFKC').replace(/[!?.,~\s]+/g, ' ').trim();
  const letters = p.replace(/[^\p{L}]/gu, '');
  // One Latin letter ("x") is not a topic; one Greek or CJK character ("π", "光") can be.
  const notATopic = FILLER.has(p) || letters.length === 0 || /^[a-z]$/.test(letters);
  if (!notATopic) return null;
  return {
    status: 'clarify',
    topic: '',
    summary: '',
    question: 'Hi! What would you like to understand? Type any topic, or pick one to start.',
    options: SUGGESTIONS,
    lessons: [],
  };
}
