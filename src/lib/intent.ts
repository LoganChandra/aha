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
    lang: 'English',
  };
}

// The learner's language, decided in code from the prompt itself (a prompt rule alone was ignored: Chinese prompts
// came back as English courses). Covers Malaysia's languages first, as Logan asked; anything else gets a hint for
// the model to match the learner.
// Includes everyday chat Malay ("nak paham la"): a student typing that wants Malay (panel: Aisyah).
const MALAY = /\b(apa|apakah|bagaimana|kenapa|mengapa|yang|dan|ialah|adalah|cara|untuk|dengan|tentang|belajar|terbentuk|berfungsi|ini|itu|nak|tak|faham|paham|macam|mana|camne|macamana|boleh|tolong|saya|aku|la|lah|ke|pun|sikit|sebab|guna)\b/i;
export function detectLanguage(prompt: string): string {
  if (/[\u0B80-\u0BFF]/.test(prompt)) return 'Tamil';
  if (/[\u3040-\u30FF]/.test(prompt)) return 'Japanese';
  if (/[\uAC00-\uD7AF]/.test(prompt)) return 'Korean';
  if (/[\u4E00-\u9FFF]/.test(prompt)) return 'Chinese (Simplified)';
  if (/[\u0E00-\u0E7F]/.test(prompt)) return 'Thai';
  if (/[\u0600-\u06FF]/.test(prompt)) return 'Arabic';
  if (/[\u0900-\u097F]/.test(prompt)) return 'Hindi';
  if ((prompt.match(new RegExp(MALAY.source, 'gi')) ?? []).length >= 1 && !/\b(the|what|how|why|is|are|does)\b/i.test(prompt)) return 'Malay';
  return 'English';
}
