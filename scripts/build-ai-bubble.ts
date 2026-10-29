// @ts-nocheck: a Bun-only build script.
// The Frank experiment (Logan, 2026-10-29): "I want to see you actually do all the work instead of using deepseek
// v4.1 flash ... imagine youre the model thats doing it." Frank (Claude, on Logan's Anthropic subscription, no
// OpenRouter) researched, planned and wrote this course in the exact recipe format the cheap models must produce.
// It is checked by the same validator and served from the curated library at zero model cost.
// Run: bun scripts/build-ai-bubble.ts  ->  src/content/library/ai-bubble.json
import { checkLesson } from '../src/lib/validate';

const plan = {
  status: 'ok',
  topic: 'The AI bubble: real boom, risky bets',
  summary: 'You will be able to argue both sides with numbers: the payback gap, depreciation, circular deals, off-balance-sheet debt, and how today compares with 2000.',
  lang: 'English',
  lessons: [
    { title: 'The payback gap', pattern: 'find-the-balance', goal: 'Work out how much AI revenue one year of AI spending needs, and compare it with what AI earns today.', aha: 'The bubble question is a payback question: the spending is certain, the revenue that must follow is not yet.', visual: 'chart: 2026 capex vs revenue needed (live from life and margin knobs) vs OpenAI run-rate', facts: ['2026 capex guidance, mid-points: Amazon ~$220bn, Alphabet ~$200bn, Microsoft ~$175bn, Meta ~$140bn', 'OpenAI ~ $50bn annualised revenue, Sept 2026 (Sacra estimate)', 'Bain: ~$2tn annual revenue needed by 2030, ~$800bn short'] },
    { title: 'How long does a GPU earn?', pattern: 'drag-to-discover', goal: 'See how the depreciation schedule decides when AI spending hits profit.', aha: 'Stretch a chip\'s accounting life and today\'s profit rises with no extra cash; if chips age faster, the bill comes later.', visual: 'graph: straight-line book value over a draggable useful life vs an illustrative earning-power curve', facts: ['Hyperscalers depreciate servers over 5-6 years, up from ~3', 'Burry: ~$176bn understated depreciation 2026-28', 'Amazon shortened some server lives to 5 years'] },
    { title: 'Money that goes round in circles', pattern: 'go-round-the-loop', goal: 'Trace how one investment dollar can show up as revenue at several AI companies.', aha: 'Circular deals make demand look bigger than end-customer spending; the loop only holds while the end customer keeps growing.', visual: 'cycle: Nvidia invests, OpenAI buys compute, Oracle builds, Oracle buys Nvidia chips', facts: ['Nvidia: up to $100bn investment in OpenAI', 'Oracle-OpenAI ~ $300bn over ~5 years', 'OpenAI projected 2026 losses ~$14bn or more'] },
    { title: 'Debt you cannot see', pattern: 'out-of-a-hundred', goal: 'Understand how AI data centres are financed off the balance sheet, and where the risk really sits.', aha: 'Off the books is not off the hook: guarantees keep the risk with the company while the debt sits elsewhere.', visual: 'icon array: ownership of Meta\'s Hyperion campus, 100% Meta down to 20%', facts: ['Blue Owl funds 80%, Meta 20%', '~$27bn of bonds, sold via Pimco, due 2049', '4-year initial lease, residual value guarantee for 16 years'] },
    { title: '2000 vs now: bubble or boom?', pattern: 'find-the-balance', goal: 'Compare today with the dot-com peak on valuation, market concentration and overbuilding.', aha: 'A bubble can burst while the technology wins: investors can lose on timing even if AI is real, as fiber showed in 2001.', visual: 'chart with an era switch: leader forward P/E, S&P CAPE, top-10 share, 2000 vs 2026', facts: ['Cisco ~130x forward earnings, March 2000', 'Nvidia ~25-40x forward, 2026', 'CAPE ~44 (2000) vs ~40 (2026)', 'Top-10 weight ~27% (2000) vs ~36% (2026)', '~2.6% of 1990s fiber lit in 2001 (Merrill Lynch)'] },
  ],
};

const need = '(735/L + 73.5)/(m/100)'; // revenue needed for one year of capex: depreciation + a 10% return, at margin m

const lessons = [
  {
    title: 'The payback gap',
    params: [
      { id: 'L', label: 'Hardware life (years)', min: 2, max: 6, step: 1, value: 6 },
      { id: 'm', label: 'Operating margin', min: 20, max: 60, step: 5, value: 40, unit: '%' },
    ],
    scene: {
      type: 'chart', kind: 'bar', yLabel: '$ billions per year', unit: 'bn',
      bars: [
        { id: 'capex', label: '2026 AI build (big four)', value: 735, tone: 'neutral' },
        { id: 'need', label: 'AI revenue needed', value: need, tone: 'red' },
        { id: 'openai', label: 'OpenAI revenue (run-rate)', value: 50, tone: 'primary' },
      ],
    },
    steps: [
      { say: 'In 2026 Amazon, Alphabet, Microsoft and Meta plan to spend about $735bn on capital expenditure, mostly AI data centres.', task: { kind: 'tap', target: 'capex', hint: 'Tap this year\'s spending.' }, after: 'Guidance mid-points: Amazon ~$220bn, Alphabet ~$200bn, Microsoft ~$175bn, Meta ~$140bn.' },
      { say: 'That hardware wears out. Each year it must earn back a slice of its cost plus a return (here 10%), out of profit at your margin.', task: { kind: 'predict', question: 'If the chips last 3 years instead of 6, the revenue needed each year…', choices: ['rises by about 60%', 'halves', 'barely moves'], answer: 0, reveal: { set: { L: 3 } } }, after: 'At a {L}-year life: about ${round(' + need + ')}bn of AI revenue a year, just for 2026\'s build.' },
      { say: 'Software-like margins would help. Be generous.', task: { kind: 'slide', param: 'm', goal: 'm>=60', hint: 'Raise the margin to 60%.' }, after: 'Even at {m}% margin and a {L}-year life: about ${round(' + need + ')}bn a year.' },
      { say: 'The biggest AI seller, OpenAI, was at roughly $50bn a year in September 2026 (Sacra estimate).', focus: ['openai', 'need'], task: { kind: 'predict', question: 'At a 5-year life and 50% margin, AI revenue across all sellers must reach about…', choices: ['$440bn a year', '$100bn a year', '$2 trillion a year'], answer: 0, reveal: { set: { L: 5, m: 50 } } }, after: 'About ${round(' + need + ')}bn: roughly nine of today\'s OpenAIs, for one year of building. Bain puts the 2030 need at $2tn a year, about $800bn short.' },
      { say: 'Whether it is a bubble comes down to payback: the spending is certain, the revenue that must follow is not yet.', focus: ['need'] },
    ],
  },
  {
    title: 'How long does a GPU earn?',
    params: [{ id: 'L', label: 'Accounting life (years)', min: 2, max: 7, step: 1, value: 3 }],
    scene: {
      type: 'graph2d', x: [0, 7], y: [0, 105], xLabel: 'years after purchase', yLabel: 'value left (%)',
      items: [
        { id: 'earn', type: 'function', expr: '100*0.5^(x/2)', tone: 'neutral', dashed: true, label: 'earning power (illustrative)' },
        { id: 'book', type: 'function', expr: 'max(0, 100*(1 - x/L))', tone: 'primary', label: 'book value' },
        { id: 'dep', type: 'text', at: [3.6, 98], text: 'yearly cost per $100bn of GPUs: ${round(100/L)}bn' },
        { id: 'gap', type: 'text', at: [3.6, 88], text: 'profit added vs a 3-year life: ${round(100/3 - 100/L)}bn a year' },
      ],
    },
    steps: [
      { say: 'Accountants spread a chip\'s cost over its useful life: a straight line from 100% down to zero.', task: { kind: 'tap', target: 'book', hint: 'Tap the line the accountants use.' }, after: 'Straight-line: the same slice of cost every year until it reaches zero at {L} years.' },
      { say: 'Most hyperscalers now use 5 to 6 years for servers, up from about 3.', task: { kind: 'slide', param: 'L', goal: 'L>=6', hint: 'Stretch the schedule to 6 years.' }, after: 'The yearly cost falls to ${round(100/L)}bn per $100bn of chips: reported profit rises with no extra cash coming in.' },
      { say: 'The dashed curve is an illustration: new chip generations every year or two cut what an old chip can earn.', task: { kind: 'predict', question: 'If earning power falls faster than the book value, the difference…', choices: ['flatters today\'s profit and comes back as a later write-down', 'makes the chips faster', 'cancels out each year'], answer: 0 }, after: 'Michael Burry estimates this gap at about $176bn across big tech for 2026-28. Others dispute it.' },
      { say: 'The defence: older GPUs keep earning on lighter work like answering queries, and still rent out well.', task: { kind: 'predict', question: 'Amazon in 2025…', choices: ['shortened some server lives to 5 years', 'lengthened them to 8 years', 'stopped depreciating chips'], answer: 0 }, after: 'The real question is how long a chip earns, not how long it runs. The schedule decides when the bill shows up.' },
      { say: 'Depreciation is where AI spending meets profit: stretch the life and today looks better, tomorrow pays.', set: { L: 6 }, focus: ['book', 'earn'] },
    ],
  },
  {
    title: 'Money that goes round in circles',
    params: [{ id: 'sp', label: 'Speed', min: 0, max: 2, step: 0.1, value: 0.5 }],
    scene: {
      type: 'cycle', speed: 'sp', center: 'the same dollars, counted at each stop', caption: 'Follow one investment dollar',
      stages: [
        { id: 'nvidia', label: 'Nvidia invests in OpenAI', icon: 'cpu', tone: 'green' },
        { id: 'openai', label: 'OpenAI pays for compute', icon: 'sparkles', tone: 'primary' },
        { id: 'oracle', label: 'Oracle builds data centres', icon: 'server', tone: 'warm' },
        { id: 'chips', label: 'Oracle buys Nvidia chips', icon: 'coins', tone: 'accent' },
      ],
    },
    steps: [
      { say: 'In 2025 Nvidia agreed to invest up to $100bn in OpenAI as OpenAI rolls out Nvidia systems.', play: true, task: { kind: 'tap', target: 'chips', hint: 'Tap where the money returns to Nvidia.' }, after: 'OpenAI\'s CFO said much of it "will go back to Nvidia": an investment that returns as chip sales.' },
      { say: 'Each stop records the flow as revenue or as a contract backlog.', task: { kind: 'predict', question: 'One dollar that goes round once can show up as…', choices: ['revenue or backlog at several companies', 'revenue at one company only', 'no revenue anywhere'], answer: 0 }, after: 'That is why critics call it circular: demand looks larger than what end customers pay.' },
      { say: 'Only one stop brings in money from outside the loop.', task: { kind: 'tap', target: 'openai', hint: 'Tap the stop that needs outside customers.' }, after: 'OpenAI\'s subscriptions and API sales are the fuel. Its Oracle contract alone is about $300bn over five years.' },
      { say: 'Stress-test the loop.', task: { kind: 'predict', question: 'The loop is in trouble if…', choices: ['OpenAI\'s revenue growth stalls', 'Nvidia\'s chips get faster', 'Oracle hires more engineers'], answer: 0 }, after: 'Everything downstream rests on OpenAI\'s growth, while it is projected to lose $14bn or more in 2026, funded by new capital.' },
      { say: 'Circular deals are not fraud, but they stack every company\'s numbers on the same customer\'s future.', focus: ['openai'] },
    ],
  },
  {
    title: 'Debt you cannot see',
    params: [{ id: 'own', label: 'Meta\'s share', min: 0, max: 100, step: 10, value: 100, unit: '%' }],
    scene: {
      type: 'iconArray', total: 100, icon: 'building', caption: 'Who owns Meta\'s Hyperion AI campus, out of 100 parts',
      groups: [
        { id: 'meta', label: 'owned by Meta (on its books)', tone: 'primary', count: 'own' },
        { id: 'owl', label: 'owned by Blue Owl funds (off Meta\'s books)', tone: 'cool', count: '100-own' },
      ],
    },
    steps: [
      { say: 'Hyperion, in Louisiana, is one of Meta\'s biggest AI data centres. Normally a company owns what it builds.', task: { kind: 'tap', target: 'meta', hint: 'Tap Meta\'s share.' }, after: 'Owning it all puts the cost, and any debt, on Meta\'s balance sheet where investors see it.' },
      { say: 'In October 2025 Meta sold most of it to outside investors.', task: { kind: 'slide', param: 'own', goal: 'own<=20', hint: 'Move Meta\'s share down to 20%.' }, after: 'Blue Owl funds took 80%. About $27bn of bonds, sold via Pimco and due 2049, sit in the venture, not on Meta.' },
      { say: 'Meta leases the campus back, for an initial 4 years, and guarantees part of its value for the first 16.', task: { kind: 'predict', question: 'If AI demand fades and the campus is worth less, who covers the shortfall?', choices: ['Meta, through the value guarantee', 'only the bond buyers', 'nobody'], answer: 0 }, after: 'The debt is off Meta\'s books, but much of the risk is not.' },
      { say: 'Watch the debt that does not show: it lets AI building outrun what balance sheets alone would allow.', set: { own: 20 }, focus: ['owl'] },
    ],
  },
  {
    title: '2000 vs now: bubble or boom?',
    params: [{ id: 'e', label: 'Era', min: 0, max: 1, step: 1, value: 0, choices: ['March 2000', '2026'] }],
    scene: {
      type: 'chart', kind: 'bar', yLabel: 'approximate levels',
      bars: [
        { id: 'pe', label: 'Leader\'s forward P/E', value: '130*(1-e) + 30*e', tone: 'red' },
        { id: 'cape', label: 'S&P 500 CAPE', value: '44*(1-e) + 40*e', tone: 'accent' },
        { id: 'top', label: 'Top-10 share of S&P (%)', value: '27*(1-e) + 36*e', tone: 'primary' },
      ],
    },
    steps: [
      { say: 'March 2000. The darling of the internet build-out was Cisco, which sold the network gear.', task: { kind: 'tap', target: 'pe', hint: 'Tap the leader\'s price-to-earnings.' }, after: 'Cisco traded at roughly 130 times next year\'s earnings.' },
      { say: 'Now switch to today, where the darling sells the AI gear: Nvidia.', task: { kind: 'slide', param: 'e', goal: 'e>=1', hint: 'Tap 2026.' }, after: 'Nvidia trades at roughly 25 to 40 times forward earnings: high, but on large real profits.' },
      { say: 'Not everything looks calmer than in 2000.', task: { kind: 'predict', question: 'Which measure is more stretched now than in 2000?', choices: ['how much the top 10 stocks weigh', 'the leader\'s P/E', 'none of them'], answer: 0 }, after: 'The top 10 weigh about 36% of the S&P 500, against about 27% then: fewer companies carry the whole market.' },
      { say: 'In the 1990s telecoms laid about $90bn of fiber for the coming internet.', task: { kind: 'predict', question: 'By 2001, how much of that fiber was in use?', choices: ['about 3%', 'about half', 'nearly all'], answer: 0 }, after: 'About 2.6% (Merrill Lynch). Carriers went bust, yet that same fiber later carried the internet\'s growth.' },
      { say: 'A bubble can burst while the technology wins: investors lose on timing even when the thing is real.', focus: ['top', 'pe'] },
    ],
  },
];

const sources = [
  { title: 'Hyperscaler capex trends: 2026 guidance passes $700bn (Datacentres.com)', url: 'https://www.datacentres.com/guides/hyperscaler-capex-trends' },
  { title: 'OpenAI revenue, valuation and funding (Sacra)', url: 'https://sacra.com/c/openai/' },
  { title: 'Bain: $2 trillion in new revenue needed by 2030 (The Register)', url: 'https://www.theregister.com/2025/09/24/bain_ai_costs' },
  { title: 'The debate about the quality of AI earnings (Yardeni)', url: 'https://www.yardeniquicktakes.com/deep-dive-the-debate-about-the-quality-of-ai-earnings/' },
  { title: 'Oracle-OpenAI $300B deal explained (IntuitionLabs)', url: 'https://intuitionlabs.ai/articles/oracle-openai-300b-deal-analysis' },
  { title: 'Meta pushes its largest data center off its books with $27B JV (Bisnow)', url: 'https://www.bisnow.com/news/national/data-center-capital-markets/meta-pushes-its-largest-data-center-project-off-its-books-with-27b-joint-venture-131490' },
  { title: 'AI stocks vs the dot-com bubble (The Next Web)', url: 'https://thenextweb.com/news/ai-stocks-dot-com-bubble-comparison-market-outlook' },
  { title: 'Overbuilding snares fiber optic industry (Tampa Bay Times, 2001)', url: 'https://www.tampabay.com/archive/2001/06/23/overbuilding-snares-fiber-optic-industry/' },
];

// Every dollar sign in this course is money, so it is escaped (\$) and never read as the start of maths.
const money = (v) => (typeof v === 'string' ? v.replace(/(?<!\\)\$/g, '\\$') : Array.isArray(v) ? v.map(money) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, money(x)])) : v);
let bad = 0;
const checked = lessons.map(money).map((l, i) => {
  const c = checkLesson(l);
  if (!c.lesson || c.errors.length) { bad++; console.log(`lesson ${i + 1} ${l.title}:`, c.errors); }
  return c.lesson ?? l;
});
const course = {
  slug: 'ai-bubble',
  levels: ['expert', 'professional', 'intermediate'],
  aliases: ['tell me about the ai bubble', 'tell me about the ai bubble [frank]', 'the ai bubble', 'ai bubble', 'is ai a bubble', 'is there an ai bubble'],
  plan, sources, lessons: checked,
};
await Bun.write('src/content/library/ai-bubble.json', JSON.stringify(course, null, 1));
console.log(bad ? `${bad} lesson(s) with problems` : `all ${lessons.length} lessons clean`);
