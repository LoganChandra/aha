// The teaching playbook: patterns a good teacher uses to make an idea click, each with a complete example lesson.
// The planner picks a pattern for every lesson; the writer sees the whole playbook and copies the craft of the
// chosen pattern. Written by hand, checked by checkLesson (scripts/playbook.test.ts) and rendered in /dev/gallery.
//
// Grounded in learning research (docs/research/2026-10-28-learning-science.md):
// - Learn by doing and predict-observe-explain: the learner commits before seeing (generation and prediction effects).
// - Spatial contiguity (Mayer, d≈0.79): words sit on the picture as callouts, not in a separate paragraph.
// - Segmenting (d≈0.70): one idea per step. Signaling (d≈0.46): focus lights up what matters.
// - Pre-training: name the parts before the process. Concreteness fading: a concrete case before the abstraction.
// - Productive failure (Sinha & Kapur 2021): try first, then explain; best when learners have some prior knowledge.
// - Retrieval practice: the last step makes them use the idea without help.
// - Learning styles: matching teaching to a "style" has almost no evidence (Pashler et al. 2008); words plus pictures
//   (dual coding) helps everyone, so every pattern pairs a picture the learner acts on with a short line of words.
import type { Lesson } from './recipe';

export type Pattern = {
  id: string;
  name: string;
  use: string; // when to choose it
  moves: string; // the choreography of the steps
  example: Lesson;
};

export const PLAYBOOK: Pattern[] = [
  {
    id: 'drag-to-discover',
    name: 'Drag to discover',
    use: 'A quantity that depends on something you can move: trig ratios, slopes, angles, forces, any "what changes when".',
    moves: 'Name the parts (tap) → drag until a target value → drag to an extreme and notice the pattern → predict a case they have not tried → state the rule.',
    example: {
      title: 'Sine is height on a circle',
      params: [{ id: 'th', label: 'Angle', min: 0, max: 6.283, step: 0.01, value: 0.6, unit: 'rad' }],
      scene: {
        type: 'graph2d', x: [-1.5, 1.5], y: [-1.25, 1.25], equal: true, axes: true,
        items: [
          { id: 'circle', type: 'circle', center: [0, 0], r: 1, tone: 'neutral' },
          { id: 'radius', type: 'segment', from: [0, 0], to: ['cos(th)', 'sin(th)'], tone: 'primary' },
          { id: 'height', type: 'segment', from: ['cos(th)', 0], to: ['cos(th)', 'sin(th)'], tone: 'accent', dashed: true },
          { id: 'angle', type: 'angle', at: [0, 0], from: 0, to: 'th', tone: 'warm', r: 0.28 },
          { id: 'dot', type: 'point', x: 'cos(th)', y: 'sin(th)', dragX: 'th', tone: 'primary' },
          { id: 'readout', type: 'text', at: [-1.4, 1.12], text: 'height = {sin(th)}' },
        ],
      },
      steps: [
        { say: 'A circle of radius 1. The dot sits on it, at an angle from the right.', callouts: [{ at: 'dot', text: 'drag me' }, { at: 'angle', text: 'angle' }], task: { kind: 'tap', target: 'height', hint: 'Tap the dashed line: the dot\'s height.' }, after: 'That dashed line is the height of the dot above the middle.' },
        { say: 'Drag the dot until its height is exactly half the radius.', focus: ['height', 'readout'], task: { kind: 'slide', param: 'th', goal: 'abs(sin(th)-0.5)<0.03', hint: 'Watch the height readout reach 0.5.' }, after: 'Height 0.5 happens at 30° ($\\pi/6$). That height has a name: the sine of the angle.' },
        { say: 'How high can the dot ever get?', set: { th: 0.3 }, task: { kind: 'predict', question: 'The biggest the sine can be is…', choices: ['0.5', '1', 'It keeps growing'], answer: 1, reveal: { set: { th: 1.5708 } } }, after: 'At the top the height equals the radius: 1. Sine never goes past 1.' },
        { say: 'Now drag the dot below the middle line.', callouts: [{ at: 'height', text: 'height' }], task: { kind: 'slide', param: 'th', goal: 'sin(th)<-0.6', hint: 'Go past halfway round.' }, after: 'Below the middle the height is negative, so the sine is negative too.' },
        { say: 'Sine is just how high the dot sits on a circle of radius 1.', focus: ['height', 'dot'] },
      ],
    },
  },
  {
    id: 'predict-reveal',
    name: 'Predict, then watch',
    use: 'A surprising or commonly misunderstood effect: what happens when you double, halve, flip or remove something.',
    moves: 'Show the system running → ask for a prediction before touching anything → reveal by moving the knob for them → let them test the edge themselves → name the misconception and the truth.',
    example: {
      title: 'What frequency really changes',
      params: [
        { id: 'f', label: 'Frequency', min: 0.5, max: 4, step: 0.05, value: 1, unit: 'Hz' },
        { id: 'a', label: 'Loudness', min: 0.2, max: 1.4, step: 0.05, value: 0.8 },
      ],
      scene: {
        type: 'graph2d', x: [0, 6.283], y: [-1.6, 1.6], piTicks: false, xLabel: 'time', yLabel: 'air pressure',
        items: [
          { id: 'wave', type: 'function', expr: 'a*sin(f*(x - t))', tone: 'primary', label: 'sound wave' },
          { id: 'readout', type: 'text', at: [0.15, 1.45], text: '{f} waves per second' },
        ],
      },
      steps: [
        { say: 'A sound wave passing by. Each peak is a squeeze of air reaching your ear.', play: true, task: { kind: 'tap', target: 'wave', hint: 'Tap what carries the sound to your ear.' }, after: 'Peaks arriving faster or slower is what your ear hears as pitch.' },
        { say: 'Before you touch anything: what happens if the frequency doubles?', task: { kind: 'predict', question: 'Double the frequency and the peaks get…', choices: ['taller', 'closer together', 'both'], answer: 1, reveal: { set: { f: 2 }, play: true } }, after: 'Twice as many peaks fit in the same time. Height did not change at all.' },
        { say: 'Height is loudness, a different knob. Make the wave twice as loud, without changing its pitch.', set: { f: 2 }, task: { kind: 'slide', param: 'a', goal: 'a>1.2', hint: 'Use the Loudness knob.' }, after: 'Taller peaks, same spacing: louder, same note.' },
        { say: 'Now make the lowest note this speaker can play.', task: { kind: 'slide', param: 'f', goal: 'f<0.7', hint: 'Slide frequency all the way down.' }, after: 'Few peaks per second: a deep, low note.' },
        { say: 'Frequency is how often the peaks come (pitch). Height is how strong they are (loudness).', focus: ['wave'] },
      ],
    },
  },
  {
    id: 'build-it-up',
    name: 'Build it up piece by piece',
    use: 'Anything that is the sum or limit of many small parts: integrals, area, averages, compound growth, pixels, tokens.',
    moves: 'Start with a crude version made of a few pieces → add pieces and watch the error shrink → push to the limit → name what the limit is.',
    example: {
      title: 'Area under a curve, one strip at a time',
      params: [{ id: 'n', label: 'Strips', min: 1, max: 40, step: 1, value: 2 }],
      scene: {
        type: 'graph2d', x: [-0.2, 2.3], y: [-0.4, 4.6], xLabel: 'x', yLabel: 'y',
        items: [
          { id: 'strips', type: 'area', expr: '(floor(x*n/2)*2/n)^2', from: 0, to: 2, tone: 'accent' },
          { id: 'curve', type: 'function', expr: 'x^2', domain: [0, 2.2], tone: 'primary', label: 'y = x²' },
          { id: 'sum', type: 'text', at: [0.05, 4.3], text: 'strips: {sum(k,0,n-1,(2*k/n)^2*2/n)}' },
          { id: 'exact', type: 'text', at: [0.05, 3.85], text: 'true area: 2.667' },
        ],
      },
      steps: [
        { say: 'We want the area under this curve, from 0 to 2. Start crude: 2 flat strips.', callouts: [{ at: 'curve', text: 'the curve' }], task: { kind: 'tap', target: 'strips', hint: 'Tap the shapes whose area is easy to work out.' }, after: 'Each strip is a rectangle: easy area. Together they miss a lot.' },
        { say: 'Add strips until their total is within 0.2 of the true area.', focus: ['sum', 'exact'], task: { kind: 'slide', param: 'n', goal: 'abs(sum(k,0,n-1,(2*k/n)^2*2/n) - 2.6667) < 0.2', hint: 'Watch the two numbers close in.' }, after: 'More, thinner strips hug the curve better. The gap keeps shrinking.' },
        { say: 'If you could add infinitely many strips…', task: { kind: 'predict', question: 'the total would…', choices: ['grow forever', 'land exactly on 2.667', 'stop at 2.5'], answer: 1, reveal: { set: { n: 40 } } }, after: 'The total closes in on one number. That limit is the integral.' },
        { say: 'An integral is what the sum of thin strips settles on as they get infinitely thin.', focus: ['strips', 'curve'] },
      ],
    },
  },
  {
    id: 'find-the-balance',
    name: 'Find the balance point',
    use: 'Two forces, curves or sides that meet: supply and demand, equilibrium, break-even, torque, buoyancy.',
    moves: 'Show both sides → move the variable and see the mismatch named (shortage/surplus) → find the point where they meet → shock one side and predict the new balance.',
    example: {
      title: 'Where price settles',
      params: [
        { id: 'p', label: 'Price', min: 1, max: 9, step: 0.1, value: 7.5, unit: '$' },
        { id: 'shift', label: 'Demand boost', min: 0, max: 3, step: 0.1, value: 0 },
      ],
      scene: {
        type: 'graph2d', x: [0, 10], y: [0, 10], xLabel: 'cups per day (×100)', yLabel: 'price $',
        items: [
          { id: 'demand', type: 'function', expr: '10 - x + shift', tone: 'primary', label: 'buyers want' },
          { id: 'supply', type: 'function', expr: 'x', tone: 'green', label: 'sellers offer' },
          { id: 'line', type: 'segment', from: [0, 'p'], to: [10, 'p'], tone: 'neutral', dashed: true },
          { id: 'qd', type: 'point', x: '10 + shift - p', y: 'p', tone: 'primary' },
          { id: 'qs', type: 'point', x: 'p', y: 'p', tone: 'green' },
          { id: 'gap', type: 'segment', from: ['min(p, 10+shift-p)', 'p'], to: ['max(p, 10+shift-p)', 'p'], tone: 'red' },
          { id: 'readout', type: 'text', at: [0.3, 9.4], text: 'mismatch: {abs(p - (10+shift-p))} hundred cups' },
        ],
      },
      steps: [
        { say: 'Coffee. Buyers want less at high prices; sellers offer more.', callouts: [{ at: 'demand', text: 'buyers' }], task: { kind: 'tap', target: 'supply', hint: 'Which line belongs to the sellers? Tap it.' }, after: 'Higher price, more cups offered: that\'s the sellers\' line.' },
        { say: 'At $7.50, sellers bring far more than buyers want. The red gap is unsold coffee.', focus: ['gap', 'readout'], callouts: [{ at: 'gap', text: 'unsold' }] },
        { say: 'Move the price until nothing is left over and nobody goes without.', task: { kind: 'slide', param: 'p', goal: 'abs(p - (10 - p)) < 0.3', hint: 'Shrink the red gap to nothing.' }, after: 'At $5 the lines cross: the market clears. That\'s the equilibrium price.' },
        { say: 'A heatwave: everyone wants iced coffee.', set: { shift: 2, p: 5 }, task: { kind: 'predict', question: 'The new balance price will be…', choices: ['lower', 'the same', 'higher'], answer: 2, reveal: { set: { p: 6 } } }, after: 'More demand pushes the crossing up: $6 now clears the market.' },
        { say: 'Price settles where what buyers want meets what sellers offer.', focus: ['demand', 'supply'] },
      ],
    },
  },
  {
    id: 'add-the-pieces',
    name: 'Add the pieces together',
    use: 'A whole made of simpler parts added up: Fourier series, colour mixing, chords, vectors, superposition, ensembles.',
    moves: 'Show the target → show one simple piece → add pieces one at a time and watch the sum approach the target → predict what infinitely many would give.',
    example: {
      title: 'A square wave from smooth waves',
      params: [{ id: 'n', label: 'Waves added', min: 1, max: 30, step: 1, value: 1 }],
      scene: {
        type: 'graph2d', x: [-0.2, 6.5], y: [-1.5, 1.5], axes: false,
        items: [
          { id: 'target', type: 'function', expr: 'if(sin(x)>=0, 1, -1)', tone: 'neutral', dashed: true, label: 'target' },
          { id: 'sum', type: 'function', expr: '4/pi*sum(k,1,n,sin((2*k-1)*x)/(2*k-1))', tone: 'primary', label: 'our sum' },
          { id: 'one', type: 'function', expr: '4/pi*sin(x)', tone: 'accent', dashed: true },
          { id: 'readout', type: 'text', at: [0, 1.35], text: '{n} smooth waves added' },
        ],
      },
      steps: [
        { say: 'The dashed square wave is the target. Can we build it out of smooth waves?', callouts: [{ at: 'target', text: 'target' }], task: { kind: 'tap', target: 'sum', hint: 'Tap our sum (blue).' }, after: 'Right now our sum is just one smooth wave. A rough first guess.' },
        { say: 'Add waves until the sum is clearly flat on top.', task: { kind: 'slide', param: 'n', goal: 'n>=8', hint: 'Slide up the number of waves.' }, after: 'Each new wave is faster and smaller, and it fills in the corners.' },
        { say: 'Look at the edges: there\'s a small spike that never quite leaves.', focus: ['sum'], callouts: [{ at: 'sum', text: 'the overshoot' }], task: { kind: 'predict', question: 'With 30 waves the spike will be…', choices: ['gone', 'still there, just thinner', 'bigger'], answer: 1, reveal: { set: { n: 30 } } }, after: 'Still there. It\'s called the Gibbs effect: about 9% overshoot, forever.' },
        { say: 'Any repeating shape is a sum of simple waves. That\'s a Fourier series.', focus: ['sum', 'target'] },
      ],
    },
  },
  {
    id: 'find-the-minimum',
    name: 'Find the lowest point',
    use: 'Optimisation and learning: gradient descent, loss, error, learning rate, overshoot. Use the DESCENT template (slope and steps are computed for you).',
    moves: 'Show the landscape and where you stand → find the bottom by hand → feel the slope → take steps → turn the step size up until it overshoots → state the rule.',
    example: {
      title: 'Walking downhill to learn',
      params: [
        { id: 'w', label: 'Weight', min: -2, max: 5, step: 0.05, value: -1.2 },
        { id: 'lr', label: 'Step size', min: 0.05, max: 2.2, step: 0.05, value: 0.3 },
        { id: 'k', label: 'Steps shown', min: 0, max: 6, step: 1, value: 1 },
      ],
      scene: { type: 'descent', loss: '0.5*(x-2)^2 + 0.3', w: 'w', lr: 'lr', steps: 'k', range: [-2, 5], xLabel: 'weight', yLabel: 'error', caption: 'The model only feels the slope under its feet' },
      steps: [
        { say: 'A model learns by lowering its error. The blue ball is where it stands now.', task: { kind: 'slide', param: 'w', goal: 'abs(w-2)<0.2', hint: 'Drag the ball to the lowest error.' }, after: 'You found the bottom by looking: error {0.5*(w-2)^2+0.3}. A model cannot see the whole curve.' },
        { say: 'All it can feel is the slope: the orange line. The green dot is where one step lands.', set: { w: -1.2, k: 1 }, task: { kind: 'predict', question: 'The slope tilts down to the right. The step goes…', choices: ['left', 'right'], answer: 1 }, after: 'Downhill is right: step against the slope.' },
        { say: 'Show more steps and watch it walk down.', task: { kind: 'slide', param: 'k', goal: 'k>=5', hint: 'Show 5 steps.' }, after: 'Each step is smaller because the slope flattens near the bottom.' },
        { say: 'Now make each step huge.', task: { kind: 'slide', param: 'lr', goal: 'lr>=2.05', hint: 'Turn the step size up past 2.' }, after: 'Too big: every step jumps over the bottom and the error grows. That is overshoot.' },
        { say: 'Gradient descent: feel the slope, take a modest step downhill, repeat.', set: { lr: 0.3, k: 5 } },
      ],
    },
  },
  {
    id: 'tipping-point',
    name: 'Tipping point',
    use: 'A threshold that flips an outcome: a neuron firing, a sigmoid, a phase change, a vote, an infection spreading.',
    moves: 'Show input and output → find where it flips → show what controls where the flip happens → predict the effect of the other control → state the rule.',
    example: {
      title: 'When a neuron fires',
      params: [
        { id: 'inp', label: 'Input signal', min: -4, max: 4, step: 0.05, value: -2.5 },
        { id: 'b', label: 'Bias', min: -3, max: 3, step: 0.05, value: 0 },
        { id: 'w', label: 'Weight', min: 0.3, max: 4, step: 0.05, value: 1 },
      ],
      scene: {
        type: 'graph2d', x: [-4.2, 4.2], y: [-0.15, 1.2], xLabel: 'input', yLabel: 'firing',
        items: [
          { id: 'curve', type: 'function', expr: '1/(1+exp(-(w*x+b)))', tone: 'primary', label: 'neuron' },
          { id: 'half', type: 'segment', from: [-4.2, 0.5], to: [4.2, 0.5], tone: 'neutral', dashed: true },
          { id: 'now', type: 'point', x: 'inp', y: '1/(1+exp(-(w*inp+b)))', dragX: 'inp', tone: 'accent' },
          { id: 'readout', type: 'text', at: [-4, 1.12], text: 'firing: {100/(1+exp(-(w*inp+b)))}%' },
        ],
      },
      steps: [
        { say: 'A neuron adds up its input and decides how strongly to fire.', callouts: [{ at: 'curve', text: 'response' }, { at: 'now', text: 'input now' }], task: { kind: 'slide', param: 'inp', goal: '1/(1+exp(-(w*inp+b))) > 0.9', hint: 'Drag the orange dot until it fires above 90%.' }, after: 'Weak input: almost silent. Strong input: fires. In between, it tips.' },
        { say: 'The bias decides where the tipping point sits.', set: { inp: 0 }, task: { kind: 'predict', question: 'Raise the bias and the neuron fires…', choices: ['earlier (with less input)', 'later', 'the same'], answer: 0, reveal: { set: { b: 2 } } }, after: 'The whole curve slid left: it now fires with less input.' },
        { say: 'Weight decides how sharp the switch is. Make it nearly a hard on/off switch.', task: { kind: 'slide', param: 'w', goal: 'w>3.2', hint: 'Turn up the weight.' }, after: 'Big weight: a sudden flip. Small weight: a gentle ramp.' },
        { say: 'Learning a network means tuning millions of weights and biases like these.', focus: ['curve'] },
      ],
    },
  },
  {
    id: 'odds-and-temperature',
    name: 'Odds you can steer',
    use: 'Next-word prediction, softmax, sampling temperature, how a chatbot chooses. Use the NEXT WORD template (probabilities are computed for you).',
    moves: 'Show the sentence and the candidate words with their chances → predict the most likely → turn temperature down, then up → state the rule.',
    example: {
      title: 'How a chatbot picks the next word',
      params: [{ id: 'T', label: 'Temperature', min: 0.1, max: 3, step: 0.05, value: 1 }],
      scene: {
        type: 'nextWord', context: 'The cat sat on the', temperature: 'T', caption: 'Chances for the next word',
        words: [{ id: 'mat', label: 'mat', score: 2.2 }, { id: 'sofa', label: 'sofa', score: 1.4 }, { id: 'roof', label: 'roof', score: 0.9 }, { id: 'moon', label: 'moon', score: 0.1 }, { id: 'piano', label: 'piano', score: -1 }],
      },
      steps: [
        { say: 'A chatbot does not know the next word. It gives every word a chance, then picks one at random by those chances.', task: { kind: 'tap', target: 'mat', hint: 'Tap the word with the best chance.' }, after: 'Most likely, but not certain: about one time in three it picks something else.' },
        { say: 'Temperature reshapes the chances. Turn it right down.', task: { kind: 'slide', param: 'T', goal: 'T<0.3', hint: 'Slide temperature down to the minimum.' }, after: 'Cold: the top word takes nearly everything. Safe and repetitive.' },
        { say: 'Now turn it up.', task: { kind: 'predict', question: 'At high temperature, "piano" becomes…', choices: ['impossible', 'much more likely than before', 'the favourite'], answer: 1, reveal: { set: { T: 3 } } }, after: 'The chances flatten: odd words get a real shot. Creative, sometimes nonsense.' },
        { say: 'Temperature trades predictable against surprising: the scores stay the same, only the dice change.', focus: ['mat', 'piano'] },
      ],
    },
  },
  {
    id: 'chop-into-tokens',
    name: 'Chop it into tokens',
    use: 'Tokens and tokenisers: how text becomes pieces and numbers, why models count tokens not words, why long or rare words split. Use the TOKENS template.',
    moves: 'Show a sentence as pieces → find a word that split → reveal the numbers the model actually sees → state why tokens matter (cost, limits, spelling).',
    example: {
      title: 'Text becomes tokens',
      params: [{ id: 'ids', label: 'Show the numbers', min: 0, max: 1, step: 1, value: 0, choices: ['Words', 'Numbers'] }],
      scene: {
        type: 'tokens', showIds: 'ids', caption: 'What the model reads (example numbers)',
        pieces: [{ text: 'Un', id: 1844 }, { text: 'believ', id: 32924 }, { text: 'able', id: 481 }, { text: ' cats', id: 19987 }, { text: ' love', id: 3021 }, { text: ' boxes', id: 23726 }, { text: '!' }],
      },
      steps: [
        { say: 'A model never sees whole words. Text is cut into pieces called tokens.', task: { kind: 'tap', target: 't1', hint: 'Tap a piece that is not a whole word.' }, after: '"Unbelievable" became three pieces: rare words split into common parts.' },
        { say: 'Each piece is really a number from the model\'s fixed list of pieces.', task: { kind: 'slide', param: 'ids', goal: 'ids>=1', hint: 'Tap Numbers.' }, after: 'Numbers like these are all the model reads (each model has its own list, so the exact numbers differ).' },
        { say: 'The dot marks a space: " cats" and "cats" are different tokens.', task: { kind: 'predict', question: 'A model\'s length limit counts…', choices: ['tokens', 'letters', 'sentences'], answer: 0 }, after: 'Limits and prices are in tokens, about three quarters of a word each in English.' },
        { say: 'Tokens are the model\'s alphabet: text in, numbers out, numbers back to text.' },
      ],
    },
  },
  {
    id: 'map-of-meaning',
    name: 'A map of meaning',
    use: 'Embeddings, similarity, word vectors, semantic search, clustering. Use the EMBEDDING template (nearest neighbours are computed for you).',
    moves: 'Show words placed by meaning → drop a new word and see its nearest neighbours → show a direction that means something → state the rule.',
    example: {
      title: 'Words as places on a map',
      params: [
        { id: 'px', label: 'Mango, across', min: -3, max: 3, step: 0.05, value: -2.4 },
        { id: 'py', label: 'Mango, up', min: -3, max: 3, step: 0.05, value: -2.4 },
      ],
      scene: {
        type: 'embedding', caption: 'Similar meanings sit close together', nearest: 2,
        points: [
          { id: 'king', label: 'king', x: -1.6, y: 1.8, group: 'people' }, { id: 'queen', label: 'queen', x: -0.4, y: 2.3, group: 'people' },
          { id: 'man', label: 'man', x: -2.1, y: 0.4, group: 'people' }, { id: 'woman', label: 'woman', x: -0.9, y: 0.9, group: 'people' },
          { id: 'apple', label: 'apple', x: 1.9, y: -1.2, group: 'fruit' }, { id: 'banana', label: 'banana', x: 2.5, y: -0.6, group: 'fruit' },
        ],
        query: { label: 'mango', x: 'px', y: 'py' },
        arrows: [['man', 'woman'], ['king', 'queen']],
      },
      steps: [
        { say: 'An AI stores each word as a point. Words used in similar ways end up close together.', task: { kind: 'tap', target: 'banana', hint: 'Tap the word that sits nearest to "apple".' }, after: 'Banana is apple\'s neighbour: the AI saw them used alike.' },
        { say: 'Drag "mango" to where you think it belongs. Its two nearest words are listed under the map.', task: { kind: 'slide', param: 'px', goal: 'sqrt((px-2.2)^2 + (py+0.9)^2) < 0.8', hint: 'Drag the red dot near the other fruit.' }, after: 'Its nearest words are now fruit: that is where an AI would place it after reading about mangoes.' },
        { say: 'The orange arrows man→woman and king→queen point the same way.', task: { kind: 'predict', question: 'So king − man + woman lands near…', choices: ['queen', 'banana', 'man'], answer: 0 }, after: 'Directions carry meaning too: that is why word maths works.' },
        { say: 'Embeddings turn meaning into position, so "similar" becomes "nearby".', focus: ['king', 'queen', 'apple', 'banana'] },
      ],
    },
  },
  {
    id: 'explode-the-machine',
    name: 'Take the machine apart',
    use: 'Any physical machine or object: motors, engines, batteries, the eye, a phone, a cell. Use model3d with ready-made parts.',
    moves: 'Show the whole machine → pull it apart and name the key parts (tap) → run it and find the part that moves → predict what a control does → state how it works in one line.',
    example: {
      title: 'Inside an electric motor',
      params: [
        { id: 'ex', label: 'Take apart', min: 0, max: 1, step: 0.01, value: 0 },
        { id: 'amps', label: 'Current', min: 0, max: 2, step: 0.05, value: 0.4 },
      ],
      scene: {
        type: 'model3d', explodeParam: 'ex', camera: [1.6, 1.1, 2.2],
        parts: [
          { id: 'case', label: 'Case', shape: 'tube', size: [1.2, 1.08, 1.6], position: [0, 0, 0], rotation: [0, 0, 90], tone: 'neutral', opacity: 0.35, explode: [0, 1.6, 0] },
          { id: 'magN', label: 'Magnet', shape: 'magnet', size: [1.4, 0.32], position: [0, 0.82, 0], tone: 'red', explode: [0, 1.1, 0] },
          { id: 'magS', label: 'Magnet', shape: 'magnet', size: [1.4, 0.32], position: [0, -0.82, 0], rotation: [0, 0, 180], tone: 'red', explode: [0, -1.1, 0] },
          { id: 'rotor', label: 'Rotor coil', shape: 'coil', size: [0.42, 1.3, 26], position: [0, 0, 0], rotation: [0, 0, 90], tone: 'neutral', spin: { axis: 'y', speed: 'amps' } },
          { id: 'shaft', label: 'Shaft', shape: 'cylinder', size: [0.07, 2.8], position: [0, 0, 0], rotation: [0, 0, 90], tone: 'neutral', spin: { axis: 'y', speed: 'amps' } },
          { id: 'fan', label: 'Output', shape: 'fan', size: [0.5, 4], position: [1.55, 0, 0], rotation: [0, 0, 90], tone: 'primary', spin: { axis: 'y', speed: 'amps' }, explode: [0.6, 0, 0] },
        ],
      },
      steps: [
        { say: 'An electric motor. Pull it apart to see inside.', play: true, task: { kind: 'slide', param: 'ex', goal: 'ex>0.8', hint: 'Slide "Take apart".' }, after: 'Two magnets outside, a coil of wire in the middle on a shaft.' },
        { say: 'One part spins. Which one?', task: { kind: 'tap', target: 'rotor', hint: 'Tap the part that turns.' }, after: 'The coil spins. The magnets stay still and push on it.' },
        { say: 'Current flowing through the coil turns it into a magnet, pushed around by the outer magnets.', callouts: [{ at: 'rotor', text: 'electromagnet' }, { at: 'magN', text: 'fixed magnet' }], task: { kind: 'predict', question: 'Double the current and the coil spins…', choices: ['slower', 'faster', 'the same'], answer: 1, reveal: { set: { amps: 1.6 } } }, after: 'More current, stronger push, faster spin.' },
        { say: 'Put it back together.', task: { kind: 'slide', param: 'ex', goal: 'ex<0.1', hint: 'Slide "Take apart" back.' } },
        { say: 'A motor turns electricity into spin: current makes a magnet, magnets push, the shaft turns.', focus: ['rotor', 'shaft'] },
      ],
    },
  },
  {
    id: 'trace-the-path',
    name: 'Aim and trace',
    use: 'Motion and paths: projectiles, orbits, light rays, sound, a car braking, anything with a trajectory.',
    moves: 'Show the path → hit a target by adjusting one control → predict the best setting → explore the other control → state the rule.',
    example: {
      title: 'The angle that throws farthest',
      params: [
        { id: 'ang', label: 'Angle', min: 5, max: 85, step: 1, value: 20, unit: '°' },
        { id: 'v', label: 'Speed', min: 4, max: 12, step: 0.1, value: 9, unit: 'm/s' },
      ],
      scene: {
        type: 'graph2d', x: [-0.5, 15], y: [-0.5, 7], equal: true, xLabel: 'metres',
        items: [
          { id: 'path', type: 'parametric', x: 'v*cos(rad(ang))*s', y: 'v*sin(rad(ang))*s - 4.9*s^2', s: [0, '2*v*sin(rad(ang))/9.8'], tone: 'primary' },
          { id: 'ball', type: 'point', x: 'v*cos(rad(ang))*mod(t*0.8, 2*v*sin(rad(ang))/9.8)', y: 'v*sin(rad(ang))*mod(t*0.8, 2*v*sin(rad(ang))/9.8) - 4.9*mod(t*0.8, 2*v*sin(rad(ang))/9.8)^2', tone: 'accent' },
          { id: 'target', type: 'polygon', points: [[7.6, 0], [8.4, 0], [8.4, 0.5], [7.6, 0.5]], tone: 'green' },
          { id: 'ground', type: 'segment', from: [-0.5, 0], to: [15, 0], tone: 'neutral' },
          { id: 'range', type: 'text', at: [0, 6.5], text: 'lands at {v^2*sin(2*rad(ang))/9.8} m' },
        ],
      },
      steps: [
        { say: 'Throw at 9 m/s. Change only the angle to land in the green box.', play: true, callouts: [{ at: 'target', text: 'target' }], task: { kind: 'slide', param: 'ang', goal: 'abs(v^2*sin(2*rad(ang))/9.8 - 8) < 0.4', hint: 'Watch where it lands.' }, after: 'Two different angles can land in the same spot: one low, one high.' },
        { say: 'Which angle throws the farthest?', task: { kind: 'predict', question: 'The longest throw comes at…', choices: ['30°', '45°', '70°'], answer: 1, reveal: { set: { ang: 45 } } }, after: '45°: the best split between going up (time in the air) and going forward.' },
        { say: 'Now throw harder. Reach past 12 metres.', set: { ang: 45 }, task: { kind: 'slide', param: 'v', goal: 'v^2*sin(2*rad(ang))/9.8 > 12', hint: 'Turn up the speed.' }, after: 'Double the speed and the range goes up four times: it grows with speed squared.' },
        { say: 'Range depends on speed squared and on angle, peaking at 45° (ignoring air).', focus: ['path'] },
      ],
    },
  },
  {
    id: 'follow-the-flow',
    name: 'Follow the flow',
    use: 'Any process or sequence: photosynthesis, digestion, the internet, electricity from plant to plug, a supply chain. Use the PIPELINE template.',
    moves: 'Name the stages by tapping the input and the output → cut or boost the input and predict the knock-on → drive the input to a goal → state the flow in one line.',
    example: {
      title: 'How a plant makes food',
      params: [{ id: 'light', label: 'Sunlight', min: 0, max: 1, step: 0.01, value: 0.7 }],
      scene: {
        type: 'pipeline', flow: 'light', flowLabel: 'energy flowing',
        stages: [
          { id: 'sun', label: 'Sunlight', icon: 'sun', tone: 'accent', value: 'round(light*100)', unit: '%' },
          { id: 'leaf', label: 'Leaf', icon: 'leaf', tone: 'green' },
          { id: 'sugar', label: 'Sugar made', icon: 'cookie', tone: 'warm', value: 'round(light*40)', unit: 'g' },
        ],
        side: [
          { id: 'water', label: 'Water', icon: 'droplet', tone: 'cool', stage: 'leaf', dir: 'in' },
          { id: 'co2', label: 'CO₂', icon: 'cloud', tone: 'neutral', stage: 'leaf', dir: 'in' },
          { id: 'o2', label: 'Oxygen', icon: 'wind', tone: 'cool', stage: 'leaf', dir: 'out' },
        ],
      },
      steps: [
        { say: 'A leaf takes in three things. Which one is the energy?', task: { kind: 'tap', target: 'sun', hint: 'Tap the energy source.' }, after: 'Light is the power. Water and CO₂ are the raw materials.' },
        { say: 'Night falls.', task: { kind: 'predict', question: 'With no light, sugar-making…', choices: ['carries on', 'stops', 'speeds up'], answer: 1, reveal: { set: { light: 0 } } }, after: 'No energy, no sugar, even with plenty of water and air.' },
        { say: 'Bring the sun up until the leaf makes at least 30 g of sugar.', task: { kind: 'slide', param: 'light', goal: 'round(light*40) >= 30', hint: 'Slide Sunlight up.' }, after: 'More light, more flow through the whole chain.' },
        { say: 'Light + water + CO₂ → sugar + oxygen, made in the leaf.', focus: ['leaf', 'sugar'] },
      ],
    },
  },
  {
    id: 'story-in-time',
    name: 'The story in time',
    use: 'History, biographies, the evolution of an idea or technology: anything whose meaning comes from order and cause.',
    moves: 'Place them in time (tap the spark) → predict a consequence before revealing it → spot the turning point → state the arc in one line.',
    example: {
      title: 'The summer France changed',
      params: [],
      scene: {
        type: 'timeline',
        events: [
          { id: 'debt', when: '1788', label: 'France is broke', detail: 'War debts and a bad harvest; bread prices soar.', tone: 'neutral' },
          { id: 'estates', when: 'May 1789', label: 'Estates-General meets', detail: 'The king calls all three classes to fix the money.', tone: 'neutral' },
          { id: 'tennis', when: 'Jun 1789', label: 'Tennis Court Oath', detail: 'Commoners swear not to leave until France has a constitution.', tone: 'primary' },
          { id: 'bastille', when: '14 Jul 1789', label: 'Bastille stormed', detail: 'Paris crowds seize the fortress and its gunpowder.', tone: 'red' },
          { id: 'rights', when: 'Aug 1789', label: 'Rights of Man', detail: 'Equality before the law is written down.', tone: 'green' },
        ],
      },
      steps: [
        { say: 'Revolutions rarely start with ideas. Tap the problem that set this one off.', task: { kind: 'tap', target: 'debt', hint: 'Tap the first spark.' }, after: 'Money and hunger: a broke state and expensive bread.' },
        { say: 'The commoners were locked out of their meeting hall.', focus: ['estates', 'tennis'], task: { kind: 'predict', question: 'They responded by…', choices: ['going home', 'vowing to write a constitution', 'electing a new king'], answer: 1 }, after: 'The Tennis Court Oath: they claimed the power to remake France.' },
        { say: 'Which day turned words into force?', task: { kind: 'tap', target: 'bastille', hint: 'Tap the turning point.' }, after: 'The Bastille: the crowd armed itself and the king lost Paris.' },
        { say: 'Debt and hunger → defiance → force → new rights, in about a year.', focus: ['debt', 'tennis', 'bastille', 'rights'] },
      ],
    },
  },
  {
    id: 'race-two-ways',
    name: 'Race two ways',
    use: 'Comparing two rules, strategies or models over time: simple vs compound interest, linear vs exponential, two algorithms, two diets.',
    moves: 'Show both starting equal → predict who wins → run time forward and find the crossover → change the rate and test the claim → state the rule.',
    example: {
      title: 'Interest that earns interest',
      params: [
        { id: 'yrs', label: 'Years', min: 0, max: 40, step: 1, value: 0 },
        { id: 'r', label: 'Rate', min: 1, max: 12, step: 0.5, value: 7, unit: '%' },
      ],
      scene: {
        type: 'graph2d', x: [0, 41], y: [0, 16], xLabel: 'years', yLabel: '× your money',
        items: [
          { id: 'simple', type: 'function', expr: '1 + r/100*x', domain: [0, 'yrs'], tone: 'neutral', label: 'simple' },
          { id: 'compound', type: 'function', expr: '(1+r/100)^x', domain: [0, 'yrs'], tone: 'primary', label: 'compound' },
          { id: 'now', type: 'segment', from: ['yrs', 0], to: ['yrs', 16], tone: 'neutral', dashed: true },
          { id: 'readout', type: 'text', at: [1, 15], text: 'simple ×{1+r/100*yrs}   compound ×{(1+r/100)^yrs}' },
        ],
      },
      steps: [
        { say: 'Two accounts, both 7% a year. Simple pays on what you put in; compound pays on everything, interest included.', task: { kind: 'predict', question: 'After 30 years, compound will be…', choices: ['a bit ahead', 'about double simple', 'the same'], answer: 1, reveal: { set: { yrs: 30 } } }, after: 'Compound ×7.6 vs simple ×3.1: more than double.' },
        { say: 'Find the year compound first pulls clearly ahead (by half of your money).', set: { yrs: 2 }, task: { kind: 'slide', param: 'yrs', goal: '(1+r/100)^yrs - (1+r/100*yrs) > 0.5', hint: 'Move the years forward.' }, after: 'Slow at first, then the gap snowballs: interest earning interest.' },
        { say: 'At 12% the snowball gets steep. Push it to 40 years.', set: { r: 12 }, task: { kind: 'slide', param: 'yrs', goal: 'yrs>=39', hint: 'Slide the years to the end.' }, after: 'Rate and time multiply each other: that\'s compounding.' },
        { say: 'Compound growth is slow, then sudden. Time is the ingredient you can\'t buy back.', focus: ['compound'] },
      ],
    },
  },
  {
    id: 'shape-stays-true',
    name: 'Something that never changes',
    use: 'Invariants and proofs: triangle angles, conservation laws, Pythagoras, ratios that stay fixed, symmetry.',
    moves: 'Measure the thing in one case → change the shape wildly → notice what stays fixed → predict a new case → name the law.',
    example: {
      title: 'Why triangle angles add to 180°',
      params: [
        { id: 'cx', label: 'Top corner, across', min: -2, max: 4, step: 0.02, value: 0.6 },
        { id: 'cy', label: 'Top corner, up', min: 0.5, max: 3, step: 0.02, value: 2 },
      ],
      scene: {
        type: 'graph2d', x: [-2.4, 4.6], y: [-0.6, 3.4], equal: true, axes: false,
        items: [
          { id: 'tri', type: 'polygon', points: [[0, 0], [2.4, 0], ['cx', 'cy']], tone: 'primary' },
          { id: 'A', type: 'angle', at: [0, 0], from: 0, to: 'atan2(cy, cx)', tone: 'accent', r: 0.35 },
          { id: 'B', type: 'angle', at: [2.4, 0], from: 'atan2(cy, cx-2.4)', to: 'pi', tone: 'green', r: 0.35 },
          { id: 'C', type: 'angle', at: ['cx', 'cy'], from: 'atan2(-cy, 2.4-cx)', to: 'atan2(-cy, -cx)', tone: 'red', r: 0.3 },
          { id: 'top', type: 'point', x: 'cx', y: 'cy', dragX: 'cx', dragY: 'cy', tone: 'primary' },
          { id: 'ab', type: 'text', at: [-2.2, 3.2], text: 'A {deg(atan2(cy,cx))}°   B {deg(pi-atan2(cy,cx-2.4))}°' },
          { id: 'c', type: 'text', at: [-2.2, 2.8], text: 'C {deg(acos((cx*(cx-2.4)+cy^2)/(hypot(cx,cy)*hypot(cx-2.4,cy))))}°' },
          { id: 'sum', type: 'text', at: [-2.2, 2.4], text: 'A + B + C = 180°' },
        ],
      },
      steps: [
        { say: 'Three corners, three angles. The total is written at the top.', callouts: [{ at: 'top', text: 'drag me' }], task: { kind: 'slide', param: 'cx', goal: 'cx>3.2', hint: 'Drag the top corner far to the right.' }, after: 'The angles changed a lot. The total did not budge: 180.' },
        { say: 'Make the top corner very wide and flat.', task: { kind: 'slide', param: 'cy', goal: 'cy<0.7', hint: 'Drag the top corner down low.' }, after: 'Even nearly flat, the three still add to 180°.' },
        { say: 'Why? Imagine a line through the top, parallel to the base.', task: { kind: 'predict', question: 'The three angles fit together along that line to make…', choices: ['a right angle (90°)', 'a straight line (180°)', 'a full turn (360°)'], answer: 1 }, after: 'They line up into a straight line, and a straight line is 180°.' },
        { say: 'In any flat triangle, the angles always add to 180°.', focus: ['A', 'B', 'C'] },
      ],
    },
  },
  {
    id: 'how-likely',
    name: 'How likely is it',
    use: 'Distributions and uncertainty: bell curves, test scores, measurement error, risk, the 68-95-99.7 rule, p-values.',
    moves: 'Show the spread → shade a range and read its share → find the range that covers a target share → change the spread and predict → state the rule.',
    example: {
      title: 'Most things land near the middle',
      params: [
        { id: 'k', label: 'Range (± spreads)', min: 0.2, max: 3, step: 0.05, value: 0.5 },
        { id: 'sd', label: 'Spread', min: 0.5, max: 2, step: 0.05, value: 1 },
      ],
      scene: {
        type: 'graph2d', x: [-5, 5], y: [-0.05, 0.85], xLabel: 'height above average (cm ×5)',
        items: [
          { id: 'bell', type: 'function', expr: 'gauss(x, 0, sd)', tone: 'primary', label: 'how common' },
          { id: 'shade', type: 'area', expr: 'gauss(x, 0, sd)', from: '-k*sd', to: 'k*sd', tone: 'primary' },
          { id: 'share', type: 'text', at: [-4.8, 0.78], text: 'inside the shade: {100*erf(k/sqrt(2))}%' },
        ],
      },
      steps: [
        { say: 'Heights of 10,000 people. Most are near average; few are very tall or short.', callouts: [{ at: 'bell', text: 'most people here' }], task: { kind: 'tap', target: 'shade', hint: 'Tap the shaded middle.' }, after: 'The shaded part is everyone within that range of average.' },
        { say: 'Widen the range until it holds 95% of people.', task: { kind: 'slide', param: 'k', goal: 'abs(k-1.96)<0.08', hint: 'Watch the percentage.' }, after: 'About 2 spreads either side covers 95%: the famous 95% rule.' },
        { say: 'Make the population far more varied.', task: { kind: 'predict', question: 'With a bigger spread, the 95% range in cm gets…', choices: ['narrower', 'wider', 'the same'], answer: 1, reveal: { set: { sd: 2, k: 1.96 } } }, after: 'Still 2 spreads for 95%, but each spread is now wider in cm.' },
        { say: 'Measured in spreads, every bell curve behaves the same: 68% within 1, 95% within 2.', focus: ['bell', 'shade'] },
      ],
    },
  },
  {
    id: 'act-it-out',
    name: 'Act it out',
    use: 'Ideas about people, money, bodies, societies or nature where the actors matter: immunity, markets, banks, ecosystems, voting, the internet. Use icons as the cast.',
    moves: 'Introduce the cast by tapping one → change one condition and predict what the actors do → let the learner drive the condition to a goal → state the idea through the cast.',
    example: {
      title: 'How a vaccine trains your body',
      params: [
        { id: 'shots', label: 'Vaccine doses', min: 0, max: 2, step: 1, value: 0 },
        { id: 'germs', label: 'Germs invading', min: 1, max: 6, step: 1, value: 3 },
      ],
      scene: {
        type: 'graph2d', x: [0, 12], y: [0, 7], equal: true, axes: false,
        items: [
          { id: 'you', type: 'icon', name: 'user', at: [6, 3.4], size: 2.2, tone: 'primary', label: 'you' },
          { id: 'g1', type: 'icon', name: 'bug', at: [1.2, 5.6], size: 1, tone: 'red', label: 'germ' },
          { id: 'g2', type: 'icon', name: 'bug', at: [1.2, 3.4], size: 1, tone: 'red', show: 'germs>=2' },
          { id: 'g3', type: 'icon', name: 'bug', at: [1.2, 1.2], size: 1, tone: 'red', show: 'germs>=3' },
          { id: 'shield', type: 'icon', name: 'shield-check', at: [9.6, 3.4], size: '0.6 + 0.8*shots', tone: 'green', label: 'antibodies' },
          { id: 'memory', type: 'icon', name: 'brain', at: [6, 6.1], size: 1, tone: 'cool', label: 'memory cells' },
          { id: 'readout', type: 'text', at: [0.3, 6.8], text: 'chance you get sick: {round(100*germs/6*(1-0.45*shots))}%' },
        ],
      },
      steps: [
        { say: 'Germs are trying to get in. Your body fights back with antibodies.', callouts: [{ at: 'g1', text: 'germ' }], task: { kind: 'tap', target: 'shield', hint: 'Tap your defence.' }, after: 'Antibodies are made to fit one germ. Making new ones takes days.' },
        { say: 'A vaccine shows your body a harmless copy of the germ first.', task: { kind: 'predict', question: 'After one dose, your chance of getting sick…', choices: ['goes up', 'drops', 'stays the same'], answer: 1, reveal: { set: { shots: 1 } } }, after: 'Memory cells now recognise the germ and react in hours, not days.' },
        { say: 'Give enough doses to get your chance of getting sick below 20%.', task: { kind: 'slide', param: 'shots', goal: 'round(100*germs/6*(1-0.45*shots)) < 20', hint: 'Add doses.' }, after: 'A booster builds a bigger, faster-ready defence.' },
        { say: 'A vaccine is a rehearsal: your body learns the germ before the real one arrives.', focus: ['memory', 'shield'] },
      ],
    },
  },
  {
    id: 'out-of-a-hundred',
    name: 'Out of a hundred',
    use: 'Odds, risk, percentages, test accuracy, surveys, what a statistic means for real people. Use the ICON ARRAY template.',
    moves: 'Show 100 people and what happens to them → predict the effect of a change → drive a knob to a target count → state the number in plain words.',
    example: {
      title: 'What "90% effective" means',
      params: [
        { id: 'eff', label: 'Vaccine effectiveness', min: 0, max: 1, step: 0.05, value: 0 , unit: '' },
      ],
      scene: {
        type: 'iconArray', total: 100, icon: 'user', caption: '100 people exposed to the flu',
        groups: [
          { id: 'sick', label: 'get sick', tone: 'red', count: 'round(30*(1-eff))' },
          { id: 'safe', label: 'protected by the vaccine', tone: 'green', count: 'round(30*eff)' },
        ],
      },
      steps: [
        { say: 'Without a vaccine, 30 of these 100 people catch the flu.', task: { kind: 'tap', target: 'sick', hint: 'Tap the group that gets sick.' }, after: 'Thirty red people: that is the risk with no protection.' },
        { say: 'Before you touch anything: a 50% effective vaccine means…', task: { kind: 'predict', question: 'how many still get sick?', choices: ['50', '15', '0'], answer: 1, reveal: { set: { eff: 0.5 } } }, after: 'Half of the 30 are protected: 15 still get sick. Not 50.' },
        { say: 'Raise effectiveness until only 3 people get sick.', task: { kind: 'slide', param: 'eff', goal: 'round(30*(1-eff)) <= 3', hint: 'Slide effectiveness up.' }, after: '90% effective: 27 of the 30 who would have caught it are protected.' },
        { say: 'Effectiveness is the share of would-be cases that never happen.', focus: ['safe'] },
      ],
    },
  },
  {
    id: 'make-it-balance',
    name: 'Make it balance',
    use: 'Equations, trade-offs, forces that cancel, budgets, supply meeting demand. Use the BALANCE template.',
    moves: 'Show the two sides → predict which way it tips → drive the unknown until it levels → state the rule.',
    example: {
      title: 'Solving an equation by balancing',
      params: [{ id: 'xv', label: 'x', min: 0, max: 6, step: 1, value: 1 }],
      scene: {
        type: 'balance', caption: 'Find x so that 3x + 2 = 11',
        left: { id: 'lhs', label: '3x + 2', icon: 'package', weight: '3*xv+2', tone: 'primary' },
        right: { id: 'rhs', label: '11', icon: 'coins', weight: 11, tone: 'accent' },
      },
      steps: [
        { say: 'An equation is a balance: both sides must weigh the same.', task: { kind: 'tap', target: 'rhs', hint: 'Tap the heavier side.' }, after: 'With x = 1 the left weighs 5, the right 11, so it tips right.' },
        { say: 'Change x until the beam is level.', task: { kind: 'slide', param: 'xv', goal: '3*xv+2 == 11', hint: 'Slide x up.' }, after: 'x = 3: 3×3 + 2 = 11. Level.' },
        { say: 'Push x one past the answer.', task: { kind: 'predict', question: 'At x = 4 the beam tips…', choices: ['left', 'right', 'stays level'], answer: 0, reveal: { set: { xv: 4 } } }, after: 'Too much on the left: 14 against 11.' },
        { say: 'Solving an equation is finding the value that makes both sides weigh the same.', set: { xv: 3 }, focus: ['lhs', 'rhs'] },
      ],
    },
  },
  {
    id: 'slide-the-scale',
    name: 'Slide along the scale',
    use: 'Anything that lives on a scale: wavelength and colour, pH, temperature, loudness, frequency, earthquake size. Use the SPECTRUM template.',
    moves: 'Name the two ends → drag the marker to one end and read the number → predict where a named thing sits → land on it → state the rule that runs along the scale.',
    example: {
      title: 'White light is a rainbow of wavelengths',
      params: [{ id: 'lam', label: 'Wavelength', min: 400, max: 700, step: 5, value: 550, unit: 'nm' }],
      scene: {
        type: 'spectrum', caption: 'Visible light, by wavelength', colors: 'light', unit: 'nm', marker: 'lam', markerLabel: 'your colour',
        from: { value: 700, label: 'red: long waves' }, to: { value: 400, label: 'violet: short waves' },
        marks: [{ id: 'blue', at: 470, label: 'blue' }, { id: 'green', at: 530, label: 'green' }],
      },
      steps: [
        { say: 'Sunlight looks white, but it is every colour mixed. Each colour is a wave of a different length: its wavelength.', task: { kind: 'slide', param: 'lam', goal: 'lam >= 660', hint: 'Drag the marker to the red end (left).' }, after: 'Red waves are the longest: about {lam} nanometres, tiny millionths of a millimetre.' },
        { say: 'Now go the other way.', task: { kind: 'slide', param: 'lam', goal: 'lam <= 430', hint: 'Drag to the violet end (right).' }, after: 'Violet waves are the shortest we can see: about {lam} nm.' },
        { say: 'Before you look: where does blue sit?', task: { kind: 'predict', question: 'Blue light is…', choices: ['near the violet end', 'in the middle', 'near the red end'], answer: 0, reveal: { set: { lam: 470 } } }, after: 'Blue sits next to violet, at the short-wave end.' },
        { say: 'Colour is wavelength: long waves look red, short waves look blue and violet.', focus: ['blue', 'marker'] },
      ],
    },
  },
  {
    id: 'weigh-the-inputs',
    name: 'Weigh the inputs',
    use: 'A neuron, a neural network layer, any decision that adds up weighted evidence (a credit score, a spam filter). Use the NETWORK template.',
    moves: 'Show inputs flowing into one node → turn one weight up and watch the output light → predict what a negative weight does → find the weights that make it fire → state "weighted sum, then a threshold".',
    example: {
      title: 'A neuron adds up weighted evidence',
      params: [
        { id: 'w1', label: 'Weight: "free money"', min: -2, max: 2, step: 0.1, value: 0.2 },
        { id: 'w2', label: 'Weight: from a friend', min: -2, max: 2, step: 0.1, value: 0 },
      ],
      scene: {
        type: 'network', caption: 'Is this email spam?',
        layers: [
          [{ id: 'x1', label: '"free money"', icon: 'coins', value: 1, tone: 'warm' }, { id: 'x2', label: 'from a friend', icon: 'user', value: 1, tone: 'cool' }],
          [{ id: 'out', label: 'spam?', icon: 'mail', value: '1/(1+exp(-(4*(w1*1+w2*1)-2)))', tone: 'red' }],
        ],
        links: [{ from: 'x1', to: 'out', weight: 'w1' }, { from: 'x2', to: 'out', weight: 'w2' }],
      },
      steps: [
        { say: 'A neuron takes in clues. Each clue arrives along a link with a weight: how much that clue counts.', task: { kind: 'tap', target: 'out', hint: 'Tap the part that makes the decision.' }, after: 'This node adds up the weighted clues and decides: spam or not.' },
        { say: 'Make the "free money" clue count a lot.', task: { kind: 'slide', param: 'w1', goal: 'w1 >= 1.2', hint: 'Turn up the "free money" weight.' }, after: 'A thick link: that clue now dominates, and the spam light is at {round(100/(1+exp(-(4*(w1+w2)-2))))}%.' },
        { say: 'Before you try it: a negative weight on "from a friend" would…', task: { kind: 'predict', question: 'A negative weight on "from a friend"…', choices: ['pushes the answer toward "not spam"', 'makes spam more likely', 'does nothing'], answer: 0, reveal: { set: { w2: -1.5 } } }, after: 'A red, negative link votes against: a friend makes spam less likely.' },
        { say: 'A neuron is a weighted sum of clues, then a squash into a yes-or-no strength. Learning means adjusting the weights.', focus: ['out'] },
      ],
    },
  },
  {
    id: 'who-looks-at-whom',
    name: 'Who looks at whom',
    use: 'Attention in transformers, self-attention, masking, how a chatbot decides which earlier words matter. Use the ATTENTION template (softmax is computed for you).',
    moves: 'Read one row: where does this word look → raise the scale and watch attention sharpen → predict what the causal mask removes → state the formula softmax(QKᵀ/√d)V in plain words.',
    example: {
      title: 'Attention: each word decides where to look',
      params: [
        { id: 'sharp', label: 'Scale (1/√d)', min: 0.2, max: 3, step: 0.1, value: 0.5 },
        { id: 'causal', label: 'Causal mask', min: 0, max: 1, step: 1, value: 0, choices: ['Off', 'On'] },
      ],
      scene: {
        type: 'attention', caption: 'Row = the word looking. Column = the word it looks at.', tokens: ['the', 'cat', 'sat', 'down'],
        scores: [[2, 1, 0, 0], [1, 3, 1, 0], [0, 3, 1, 1], [0, 1, 3, 1]], scale: 'sharp', mask: 'causal', focusRow: 2, show: 'weights',
      },
      steps: [
        { say: 'Each row is one word deciding how much to look at every word. "sat" is highlighted.', task: { kind: 'tap', target: 'cell2_1', hint: 'Tap where "sat" looks most.' }, after: '"sat" looks most at "cat": who sat? The cat.' },
        { say: 'The scores are scaled, then softmax turns each row into shares of 100%. Make attention sharper.', task: { kind: 'slide', param: 'sharp', goal: 'sharp >= 2', hint: 'Raise the scale.' }, after: 'At scale {sharp} the biggest score takes almost everything. Too sharp, and the model stops learning from the rest.' },
        { say: 'When writing, a word cannot see the words after it.', task: { kind: 'predict', question: 'Turning the causal mask on…', choices: ['zeroes the cells to the right of each row\'s own word', 'zeroes the first column', 'changes nothing'], answer: 0, reveal: { set: { causal: 1 } } }, after: 'Future cells drop to 0 and each row re-shares its 100% over the words it may see.' },
        { say: 'Attention is softmax(QKᵀ/√d)·V: scores, scaled, turned into shares, used to blend the words.', focus: ['row2'] },
      ],
    },
  },
  {
    id: 'learn-from-reward',
    name: 'Learn from reward',
    use: 'Reinforcement learning, RLHF (learning from human feedback), reward, explore versus exploit, how a chatbot learned to be helpful. Use the REWARD template (the learning is computed for you).',
    moves: 'Show the options with no experience yet (all equal) → add rounds of feedback and watch the favourite emerge → turn exploring off and see it stop trying others → state the rule.',
    example: {
      title: 'How a chatbot learned to be helpful',
      params: [
        { id: 'r', label: 'Rounds of feedback', min: 0, max: 30, step: 1, value: 0 },
        { id: 'ex', label: 'Exploring', min: 0, max: 0.6, step: 0.05, value: 0.15 },
      ],
      scene: {
        type: 'reward', rounds: 'r', explore: 'ex', caption: 'People rate answers; the model shifts toward the liked style',
        pickLabel: 'chance it answers this way', learnedLabel: 'what it has learned people like (| = truth)',
        options: [
          { id: 'clear', label: 'Clear and correct', reward: 0.9 },
          { id: 'long', label: 'Long and rambling', reward: 0.4 },
          { id: 'rude', label: 'Short and rude', reward: 0.1 },
        ],
      },
      steps: [
        { say: 'A fresh model has no idea which kind of answer people like. Every style is equally likely.', task: { kind: 'tap', target: 'clear', hint: 'Tap the style you would rate highest.' }, after: 'People agree with you: the tick marks how much they like each style.' },
        { say: 'Each round, people rate answers and the model nudges toward what got good ratings. Give it feedback.', task: { kind: 'slide', param: 'r', goal: 'r>=20', hint: 'Add 20 rounds of feedback.' }, after: 'After {r} rounds its picture of what people like matches the ticks, and "clear and correct" dominates.' },
        { say: 'It still tries other styles now and then: exploring.', task: { kind: 'predict', question: 'With exploring at zero, the model…', choices: ['only gives its favourite style', 'picks styles at random', 'stops answering'], answer: 0, reveal: { set: { ex: 0 } } }, after: 'No exploring: it never tries anything new, so it cannot discover something better.' },
        { say: 'Learning from reward: try, get rated, lean toward what worked, keep exploring a little.', set: { ex: 0.15 } },
      ],
    },
  },
  {
    id: 'go-round-the-loop',
    name: 'Go round the loop',
    use: 'Anything that repeats until done: a training loop, a chatbot writing one word at a time, a feedback loop. Use the CYCLE template (the loop is drawn as a loop and counts its rounds).',
    moves: 'Show the stages in their circle → tap where it starts → watch one lap → predict what changes on the next lap → state why repeating is the whole trick.',
    example: {
      title: 'A chatbot writes one word at a time',
      params: [{ id: 'sp', label: 'Speed', min: 0, max: 2, step: 0.1, value: 0.6 }],
      scene: {
        type: 'cycle', speed: 'sp', center: 'one word per lap', caption: 'The whole reply is this loop, again and again',
        stages: [
          { id: 'read', label: 'Read everything so far', icon: 'book-open', tone: 'cool' },
          { id: 'score', label: 'Score every next word', icon: 'brain', tone: 'primary' },
          { id: 'pick', label: 'Pick one', icon: 'sparkles', tone: 'accent' },
          { id: 'add', label: 'Add it to the text', icon: 'pencil', tone: 'green' },
        ],
      },
      steps: [
        { say: 'A chatbot does not write a whole answer at once. It runs this loop.', play: true, task: { kind: 'tap', target: 'pick', hint: 'Tap the step where chance comes in.' }, after: 'It picks the next word by chance, weighted by the scores.' },
        { say: 'Each lap adds exactly one word, then it reads everything again, including that word.', task: { kind: 'predict', question: 'A 100-word answer takes about…', choices: ['100 laps', '1 lap', '10 laps'], answer: 0 }, after: 'One lap per word (strictly, per token): long answers take many laps.' },
        { say: 'Speed it up and count the laps.', task: { kind: 'slide', param: 'sp', goal: 'sp>=1.5', hint: 'Turn the speed up.' }, after: 'Faster laps, same loop: the trick is repeating it, not one giant leap.' },
        { say: 'Read, score, pick, add, repeat: that loop is how every word of a reply is written.' },
      ],
    },
  },
  {
    id: 'out-of-the-noise',
    name: 'Out of the noise',
    use: 'Diffusion models and AI image generation: starting from noise and removing a little at each step. Use the DENOISE template.',
    moves: 'Show pure noise and the prompt → step forward and watch shapes appear → predict what happens with very few steps → state "learn to remove noise, then run it many times".',
    example: {
      title: 'How an AI paints a picture from noise',
      params: [{ id: 'st', label: 'Steps done', min: 0, max: 30, step: 1, value: 0 }],
      scene: { type: 'denoise', icon: 'cat', prompt: 'a cat', step: 'st', steps: 30, tone: 'warm', caption: 'Each step removes a little noise' },
      steps: [
        { say: 'An image AI starts from pure noise: random grey speckles, no picture at all.', task: { kind: 'predict', question: 'Where does the picture come from?', choices: ['removing noise step by step, guided by the prompt', 'copying a stored photo', 'drawing outlines first'], answer: 0 }, after: 'It learned to remove a little noise at a time so the result matches the words.' },
        { say: 'Take steps and watch the picture appear.', task: { kind: 'slide', param: 'st', goal: 'st>=15', hint: 'Do 15 steps.' }, after: 'Halfway: {round(100*(1-st/30))}% noise is left and the shape is already clear.' },
        { say: 'Finish the job.', task: { kind: 'slide', param: 'st', goal: 'st>=30', hint: 'Do all 30 steps.' }, after: 'No noise left: the picture the prompt asked for.' },
        { say: 'Diffusion: learn to remove a little noise, then run that step many times, guided by the words.' },
      ],
    },
  },
  {
    id: 'name-the-sides',
    name: 'Name the sides',
    use: 'Right-triangle trigonometry: opposite, adjacent, hypotenuse, sin, cos, tan, SOH-CAH-TOA, finding a side or an angle. Use the RIGHT TRIANGLE template (lengths and ratios are computed for you).',
    moves: 'Find the hypotenuse (names hidden) → reveal the names → drag the corner and watch the ratio stay fixed for a fixed angle → use the ratio to find a missing side → state the rule.',
    example: {
      title: 'Same angle, same ratio',
      params: [
        { id: 'a', label: 'Angle', min: 10, max: 80, step: 1, value: 35, unit: '°' },
        { id: 'hl', label: 'Ladder length', min: 4, max: 12, step: 1, value: 6, unit: 'm' },
        { id: 'nm', label: 'Side names', min: 0, max: 1, step: 1, value: 0, choices: ['Hidden', 'Shown'] },
        { id: 'rt', label: 'Ratios', min: 0, max: 1, step: 1, value: 0, choices: ['Hidden', 'Shown'] },
      ],
      scene: { type: 'rightTriangle', angle: 'a', hyp: 'hl', unit: 'm', names: { opp: 'opposite', adj: 'adjacent', hyp: 'hypotenuse', angle: 'θ' }, showNames: 'nm', showLengths: 1, showRatios: 'rt', caption: 'A ladder leaning on a wall' },
      steps: [
        { say: 'A ladder leans on a wall: a right triangle. The longest side is always across from the square corner.', task: { kind: 'tap', target: 'hyp', hint: 'Tap the longest side.' }, after: 'That is the hypotenuse: the ladder itself, {hl} m.' },
        { say: 'Now the names. They depend on which angle you stand at.', task: { kind: 'slide', param: 'nm', goal: 'nm>=1', hint: 'Tap Shown.' }, after: 'Opposite faces θ; adjacent touches θ (and is not the hypotenuse).' },
        { say: 'Show the ratios, then make the ladder longer without changing the angle.', set: { rt: 1 }, task: { kind: 'slide', param: 'hl', goal: 'hl>=10', hint: 'Drag Ladder length up to 10 m.' }, after: 'Every side grew, but sin {a}° stayed {sin(a*pi/180)}: the ratio depends only on the angle.' },
        { say: 'So with the angle and one side you can find any other side.', task: { kind: 'predict', question: 'A 10 m ladder at 30° reaches how high up the wall?', choices: ['5 m (10 × sin 30°)', '8.7 m (10 × cos 30°)', '10 m'], answer: 0, reveal: { set: { a: 30, hl: 10 } } }, after: 'Height = hypotenuse × sin θ = 10 × 0.5 = 5 m.' },
        { say: 'sin = opposite ÷ hypotenuse, cos = adjacent ÷ hypotenuse, tan = opposite ÷ adjacent: fixed by the angle alone.', focus: ['opp', 'hyp'] },
      ],
    },
  },
  {
    id: 'slide-the-filter',
    name: 'Slide the filter',
    use: 'How AI sees images: convolution, filters, edge detection, convolutional neural networks (CNNs), feature maps. Use the CONVOLVE template (the maths is done for you).',
    moves: 'Show a small picture as pixels → slide the 3x3 window and watch one output number → find where the output is strongest (an edge) → swap the filter → state "a CNN learns its own filters".',
    example: {
      title: 'How an AI finds edges in a picture',
      params: [
        { id: 'cx', label: 'Window across', min: 0, max: 5, step: 1, value: 0 },
        { id: 'cy', label: 'Window down', min: 0, max: 5, step: 1, value: 2 },
      ],
      scene: {
        type: 'convolve', kernel: 'vertical-edge', at: ['cx', 'cy'], caption: 'A 3x3 filter slides over the pixels',
        image: ['....####', '....####', '....####', '....####', '....####', '....####', '....####', '....####'],
      },
      steps: [
        { say: 'To a computer, a picture is a grid of numbers: dark pixels high, light pixels low.', task: { kind: 'tap', target: 'image', hint: 'Tap the picture.' }, after: 'Left half light, right half dark: the edge runs down the middle.' },
        { say: 'A small filter, 3 by 3, multiplies the pixels under it and adds them up into one number.', task: { kind: 'slide', param: 'cx', goal: 'cx>=2 && cx<=3', hint: 'Slide the window right onto the edge.' }, after: 'On the edge the sum is large: {cx} columns in, the filter fires.' },
        { say: 'Before you look: in the flat light area on the left, the output is…', task: { kind: 'predict', question: 'Over a flat area this edge filter gives…', choices: ['about 0', 'its biggest value', 'a negative maximum'], answer: 0, reveal: { set: { cx: 0 } } }, after: 'Flat means no change, so nothing to detect: about 0.' },
        { say: 'A CNN learns thousands of filters like this from examples: edges first, then shapes, then whole objects.', focus: ['output'] },
      ],
    },
  },
  {
    id: 'watch-the-sky',
    name: 'Watch the sky',
    use: 'Why the sky is blue, sunsets, sunrise colours, haze and dust in the air. Use the SKY template (the path length and the light left are computed for you).',
    moves: 'Sun high: blue sky, short path → lower the Sun and watch the path stretch and the blue drain away → predict what dust does → state the rule.',
    example: {
      title: 'Why sunsets are red',
      params: [
        { id: 'sun', label: 'Sun height', min: 1, max: 90, step: 1, value: 70, unit: '°' },
        { id: 'du', label: 'Dust in the air', min: 0, max: 1, step: 1, value: 0, choices: ['Clean', 'Dusty'] },
      ],
      scene: { type: 'sky', sun: 'sun', dust: 'du', caption: 'Sunlight crossing the air to you' },
      steps: [
        { say: 'At midday the Sun is high and its light crosses only a thin layer of air to reach you.', task: { kind: 'tap', target: 'path', hint: 'Tap the path the sunlight takes.' }, after: 'A short path: most blue light survives, and air scatters it across the whole sky.' },
        { say: 'Now let the Sun set.', task: { kind: 'slide', param: 'sun', goal: 'sun<=5', hint: 'Drag the Sun height down to 5° or less.' }, after: 'At {sun}° the light crosses about {round(1/(sin(sun*pi/180)+0.50572*(sun+6.07995)^(-1.6364)))} times more air: the blue is scattered away on the way, red and orange are left.' },
        { say: 'Dust and smoke add more scattering.', task: { kind: 'predict', question: 'With dusty air at sunset, the sky…', choices: ['turns an even deeper red', 'turns blue again', 'does not change'], answer: 0, reveal: { set: { du: 1 } } }, after: 'More scattering strips even more blue: dusty evenings glow deep red.' },
        { say: 'Sunsets are red because their light crosses much more air, which scatters the blue away before it reaches you.', set: { du: 0 } },
      ],
    },
  },
];

/** The playbook as prompt text: every pattern's use and moves, plus each example lesson in full. */
export function playbookPrompt(): string {
  return PLAYBOOK.map((p) => `### ${p.id}: ${p.name}\nUse for: ${p.use}\nSteps: ${p.moves}\nExample:\n${JSON.stringify(p.example)}`).join('\n\n');
}

export const PATTERN_IDS = PLAYBOOK.map((p) => p.id);
