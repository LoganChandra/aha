// Hand-authored curated course: "How AI works", assembled from validated playbook lessons. No model cost.
import { writeFileSync } from 'node:fs';
import { PLAYBOOK } from '../src/lib/animation/playbook';
import { checkLesson } from '../src/lib/animation/validate';
const pick = (id: string) => PLAYBOOK.find((p) => p.id === id)!.example;
const lessons = [pick('tipping-point'), pick('find-the-minimum'), pick('map-of-meaning'), pick('odds-and-temperature')];
for (const l of lessons) { const c = checkLesson(JSON.parse(JSON.stringify(l))); if (c.errors.length) throw new Error(l.title + ': ' + c.errors.join('; ')); }
const course = {
  slug: 'how-ai-works',
  levels: ['novice', 'beginner'],
  aliases: ['how does ai work', 'what is ai', 'artificial intelligence', 'ai', 'how does chatgpt work', 'chatgpt', 'how do neural networks learn', 'neural networks', 'how do llms work', 'large language models', 'how does machine learning work', 'machine learning'],
  plan: {
    status: 'ok',
    topic: 'How AI works',
    summary: 'By the end you will see how a network of tiny decision-makers learns from its mistakes, stores meaning as positions, and picks the next word.',
    lessons: [
      { title: 'When a neuron fires', pattern: 'tipping-point', goal: 'Explain how a neuron turns weighted inputs into a yes or no.', aha: 'A neuron is a weighted vote with a threshold; weights and bias decide when it tips.', visual: 'graph2d sigmoid with draggable input, bias and weight knobs', facts: [] },
      { title: 'Walking downhill to learn', pattern: 'find-the-minimum', goal: 'Explain how a model learns by stepping downhill on its error.', aha: 'Learning is repeatedly nudging weights in the direction that lowers the error.', visual: 'graph2d loss curve with draggable weight, slope and step size', facts: [] },
      { title: 'Words as places on a map', pattern: 'map-of-meaning', goal: 'Explain what an embedding is.', aha: 'Meaning becomes position: similar words sit close, and directions carry meaning.', visual: 'graph2d map of words with a draggable new word', facts: [] },
      { title: 'How a chatbot picks the next word', pattern: 'odds-and-temperature', goal: 'Explain next-word prediction and temperature.', aha: 'A chatbot scores every word and rolls weighted dice; temperature reshapes the odds.', visual: 'bar chart of next-word odds with a temperature knob', facts: [] },
    ],
  },
  sources: [],
  lessons,
};
writeFileSync('src/content/library/how-ai-works.json', JSON.stringify(course));
console.log('wrote how-ai-works with', lessons.length, 'lessons');
