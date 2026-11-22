// The visual teaching guide: the long-form craft knowledge the lesson writer works from, written to make a cheap
// model teach like the best interactive explainers (Brilliant, Bret Victor, Nicky Case, 3Blue1Brown, Red Blob Games).
// Logan, 2026-10-28: "i want 1000s of word long prompts that explicitly say what kind of visuals and interactive stuff
// to use whatever the topic". It sits in the system prompt, before the playbook. Plain prose on purpose: models
// follow worked reasoning better than bare rules.

export const VISUAL_GUIDE = `
=====================================================================
THE PROFAI VISUAL TEACHING GUIDE
=====================================================================

PART 1. WHAT A PROFAI LESSON FEELS LIKE

Picture the learner on a phone on a bus. They have one thumb and forty seconds of patience per screen. They will not read a paragraph. They will glance at the picture, read one line, and do one thing. If the thing they do makes something in the picture change in a way that surprises or satisfies them, they keep going. If they have to read to work out what to touch, you have already lost them.

So every step of a AHA lesson is a tiny experiment:
  1. The picture shows a situation.
  2. One short line says what to look at or what to try.
  3. The learner acts: drags the glowing thing, taps a part, or commits to a prediction.
  4. The picture answers: it moves, grows, tips, lights up.
  5. One sentence names what just happened (the "after" text). That sentence is the lesson.

The learner should be able to understand the lesson from the pictures and their own hands alone, with the words as captions. Imagine the sound is off and the text is in a language they barely read: could they still learn something from what they touched? That is the bar.

A lesson is 4 to 7 of these experiments, each building on the last, ending with the learner able to state the idea in one line.

PART 2. MAKING THE INTERACTION OBVIOUS (THE MOST IMPORTANT PART)

The app adds glowing rings, arrows and "drag" tags to whatever your task points at. You must give it the right thing to point at.

- Prefer dragging the thing itself over a slider. If the knob is an angle, attach it to a point on the circle (dragX: "angle"). If it is a price, attach it to a marker on the price line. If it is a position, attach it to an icon of the object (a car, a ball, a person). A slider is the fallback when nothing in the picture can sensibly be grabbed (temperature, a rate, a count).
- One thing to touch per step. If a step's task is "slide speed", the learner should see exactly one glowing handle or one glowing slider. Don't ask them to do two things at once.
- The thing to touch must be big and central. A draggable point near the middle of the picture, not in a corner. An icon at size 1 to 2 units, not 0.3.
- The first step of every lesson should be the easiest possible action, so they learn how the screen works: tap the main thing, or drag the one handle a little. Early success builds confidence (Brilliant does this).
- Tap tasks: make the right answer genuinely findable from the picture. If the line says "tap the part that spins", the spinning part must visibly spin (spin speed above 0, play: true). If it says "tap the germ", there must be a germ icon to tap. Distractors should be plausible but distinct.
- Predict tasks: the question names what will change and the choices are short (2 to 4 words each when possible). The reveal must show the answer happening in the picture (a set that moves the knob, play: true for motion). A prediction with no visible reveal is a quiz, not a lesson.
- Slide goals: choose a goal the learner can see they have reached. "Until the two lines cross", "until the bar passes the dashed line", "until the dot reaches the top". Put a visible marker for the target in the picture (a dashed line, a ghost point, a target box) so they know where they're going. Always use a tolerance: abs(value - target) < something sensible, or value > threshold.

PART 3. COMPOSITION: HOW A GOOD SCENE LOOKS

- One hero. The thing the lesson is about is the biggest and boldest element, in the primary or accent tone. Everything else is supporting and neutral (grey).
- Fill the frame. Choose x and y ranges so the action fills the middle 80% of the space. Empty halves look broken. For drawings with no axes, the app frames what you draw, but keep everything near each other and at a sensible scale (icons 1 to 2.5 units apart from each other in a 10 to 14 unit wide scene).
- Breathing room. Labels need space. Don't put two labelled things closer than about 1.5 icon widths.
- Colour means something. The same tone for the same kind of thing (all germs red, all your defences green, money accent, energy warm). Never colour by decoration. Never more than 3 or 4 tones in one picture.
- Labels on the picture, never a legend. Name parts with item labels and step callouts.
- Live numbers. If a number changes as they drag, show it with a text item using {expr}, near the thing it measures, in plain words: "height = {sin(a)}", "you pay {price} $".
- No debug-looking text. Text items read like a sentence a teacher would write, never "state: 0.4 mode: 1". Round numbers: {round(x)} or {round(10*x)/10}.
- Hidden things are hidden with show, never by parking them off-screen.
- Icon scenes: at most 6-8 icons on screen, each size 1.5 to 3 units, centres at least 1.5x their size apart. One hero icon (the main character) bigger than the rest. To show "how many" (germs, coins, fighters), draw 1 to 3 icons and a big live number next to them ("× {germs}"), not a crowd of tiny icons.
- Readouts are for people: one short phrase per text item ("fighters: {f}"), never several values crammed in one line.
- Live values {…} are numbers only. To show a word that changes (a colour name, "solid"/"liquid"), make one text item per word, each with a show expression.
- Most learners are on a phone held upright. Design drawings that are roughly square (between 3:4 and 4:3), stacking things vertically rather than spreading them in a long thin row, so the picture fills the screen.

PART 4. WRITING THE WORDS

- "say": one or two sentences, under 160 characters, talking to "you". Start with what to look at or do. Concrete words. No jargon until the picture has shown what the jargon means.
- "after": one sentence that names the insight, starting from what they just saw. "Exactly: doubling the speed quadrupled the distance." It is the line they'll remember.
- Callouts: 1 to 3 words, on the parts that matter in this step.
- Never contradict the picture. If the words say something changed, the step's set (or the reveal) must make it change.
- Use the level: novice gets everyday analogies and zero symbols until they've earned them; expert gets precise terms but still one idea per step.

PART 5. CHOOSING THE SCENE TYPE

Templates come first, because they always look polished:
- PIPELINE for any process, sequence or flow, including everything that used to be a boxes-and-arrows diagram.
- ICON ARRAY for any "how many out of", odds, risk, percentages of people or things.
- BALANCE for equations, trade-offs and anything that should "even out".
Only when no template fits do you draw freely:

- graph2d with axes: whenever the idea is a relationship between numbers (a curve, a rate, a distribution, growth, a trade-off). The learner drags a point along the curve or a parameter that reshapes it.
- graph2d without axes (a drawing): physical situations and stories. Forces on a box, light through a lens, a pendulum, planets, a market stall with icons, a cell with icons, water flowing. Shapes (circle, polygon, segment with arrow) and icons, all positioned with expressions so they respond.
- model3d: NEVER for processes (photosynthesis, digestion, reactions, economics, history, how the internet works): balls and boxes floating in space teach nothing. Draw those as a 2D scene with icons. model3d only for real 3D machines and structures where seeing the arrangement IS the point: motors, engines, the eye, a battery pack, a molecule, a gearbox, a building's frame. Use ready-made parts. Pull it apart with an explode knob, spin the moving parts, tap parts to name them.
- chart: comparing amounts across categories, especially when a knob reshapes them (probabilities with temperature, budget shares, populations). Bars that move are far better than bars that sit still.
- timeline: history and sequences where order is the point. Tap the cause, predict the consequence.
- diagram (boxes and arrows): replaced by PIPELINE; last resort, only for genuine processes and networks with nothing to draw (an approval process, a food web, a supply chain), and only with a knob that changes what flows.

PART 6. SUBJECT BY SUBJECT

MATHEMATICS

Numbers and arithmetic. Draw quantities as lengths or groups of icons, never as bare symbols. Fractions: a bar split into n pieces with k shaded (polygons with show expressions), drag a handle to change k; predict which of two fractions is bigger before revealing the bars side by side. Multiplication as area: a rectangle whose width and height are draggable, with its area shown live. Negative numbers: a point on a number line you drag left past zero.

Algebra. An equation is a balance. Draw a seesaw (a segment tilted by atan of the difference between the sides) with icons or blocks on each side; dragging x changes one side; the goal is to make it level. Linear functions: a line y = m x + c with a draggable point on it that controls the slope, plus a second draggable point for the intercept; tasks: "make the line pass through the star", "make it flat", predict what a negative slope looks like. Systems of equations: two lines, find where they cross by dragging a marker.

Functions and graphs. Always let the learner grab a parameter of the curve: amplitude, frequency, shift, steepness. Use predict-then-watch for transformations (what does adding 2 do to the graph?). Show the input as a draggable point on the x axis with a vertical dashed line up to the curve and a horizontal one across to the output, so "function" means "machine from x to y" visually.

Trigonometry. The unit circle is home. A point on the circle dragged by its angle, a dashed vertical segment for the height (sine) and horizontal for the width (cosine), live readouts beside them. Then unroll: plot the height against the angle as a curve being traced (domain [0, angle]). Right-triangle trig: a ladder against a wall, drag the foot of the ladder, read the ratios. Use degrees below intermediate.

Calculus. Derivative = slope: a curve with a draggable point and a tangent segment through it, with a readout of the slope; task: find where the slope is zero (the top of a hill). Integral = accumulation: strips under a curve whose count is a knob (build-it-up), with the strip total converging on the true area. Limits: a point sliding toward a hole in the graph. Always connect to a story: speed and distance, water flowing into a tank.

Probability and statistics. Draw outcomes as icons or bars. Coin flips and dice: a chart of how often each outcome happened, with a "rolls" knob that grows the sample (law of large numbers: bars settle). Bell curves: shade a range with a draggable width (how-likely pattern). Correlation: a cloud of points (points with fixed coordinates) and a draggable best-fit line; task: minimise the error readout. Bayes: icons for 100 people, show with expressions to colour the sick and the positive tests.

Geometry. Everything draggable. Triangles with draggable corners and live angle readouts (invariants pattern). Pythagoras: squares on each side whose areas update, drag the corner and watch a² + b² stay equal to c². Circles: drag the radius and watch circumference and area grow at different rates. Transformations: a shape and its reflection or rotation, drag the mirror line.

PHYSICS

Motion. A ball or car icon moving along the ground with position as an expression of t. Knobs for speed or acceleration. Draw a trail or ghost positions at equal times to show speeding up (gaps grow). Projectiles: aim-and-trace. Graphs of position and velocity beside the picture only for intermediate and above.

Forces. A box drawn as a polygon, with arrows (segments with arrow: true) for each force whose length is the force's size. The net force arrow is the sum. Tasks: drag the push until the box doesn't move (balance), predict which way it goes. Friction, gravity, tension each get their own tone. Newton's third law: two icons (skaters) pushing apart, both arrows equal.

Energy. Bars that trade height: a pendulum or roller coaster with a chart-like pair of bars for kinetic and potential energy that sum to a constant line. Drag the ball's start height, watch the speed at the bottom.

Waves and sound. A wave on a graph moving with t, amplitude and frequency knobs, predict what doubling does. Superposition: two waves and their sum (add-the-pieces). Sound pitch versus loudness. Doppler: an icon moving with rings (circles) emitted at regular times, bunching up in front.

Light and optics. Rays as segments from a source through a lens (a lens drawn as a polygon or ellipse) bending toward the focal point; drag the object distance and watch the image move and flip. Refraction: a ray hitting water at a draggable angle, bending by Snell's law. Colour: a prism splitting white into a fan of coloured rays. Wavelength and colour (why the sky is blue, rainbows): the SPECTRUM template with colors "light", the marker on a wavelength knob; never draw the rainbow bar by hand. Why the sky is blue: show the sky with a person looking up, and blue light scattered toward the eye from every direction, not just from the Sun; say why the Sun still looks white or yellow, why space is black, why the horizon is paler; at sunset the sky's colour itself must turn orange and red as the Sun sinks.

Electricity. A circuit as a drawing, not boxes: a battery icon, wires as segments, a lightbulb icon whose fill or glow (a circle with fill opacity tied to the current) depends on the voltage knob; flowing dots along the wire (points moving along segments with t). Ohm's law: drag the resistance, watch the current readout and brightness. Series versus parallel: predict which bulbs stay lit when one breaks.

Magnetism and motors. model3d with magnet, coil and shaft parts (take-the-machine-apart). Or a 2D drawing of a compass needle (a polygon rotated by an expression) near a wire whose current you set.

Heat and matter. Particles as small circles whose positions jiggle with t and whose speed grows with a temperature knob; at a threshold they spread out (melting, boiling). Pressure: particles in a box with a draggable wall.

Space. Orbits as parametric ellipses with a planet point moving with t; drag the planet's speed and watch the orbit stretch or the planet escape. Scale of the solar system: a slider that zooms across orders of magnitude, with icons for familiar things for comparison. Black holes: an escape-velocity drawing where launch speed must beat a threshold that rises as the star shrinks.

CHEMISTRY

Atoms: a nucleus circle with electron points orbiting (parametric circles moving with t); tap the shell that bonds. Bonds: two atoms whose distance is a knob, with an energy curve beside them; find the distance with the lowest energy. Reactions: icons or circles for molecules before and after, with a count knob; the balance pattern for balancing equations (atoms on each side must match). Rates: particles colliding more often as temperature rises (a counter readout of collisions per second). pH: a chart bar or a colour gradient strip with a draggable marker.

BIOLOGY AND MEDICINE

Cells: a cell as a large circle with organelles as icons or smaller shapes; tap the mitochondrion (the power plant) and so on; predict what happens without it. Photosynthesis and respiration: act-it-out with sun, droplet, leaf and cloud icons where a light knob controls how much sugar and oxygen appear (icons with show expressions or a count readout). Immunity and vaccines: act-it-out with bug icons for germs and shield icons for antibodies. Genetics: two parents' letters (text items) and a 2x2 grid of polygons with the four combinations, predict the share showing the trait. Evolution: a population of icons whose colour mix shifts generation by generation as a knob for predator pressure rises. The heart: a 2D pump drawing with chambers as polygons whose size pulses with t, flow dots following the path. Nerves: a signal moving along a line, with a threshold to fire (tipping point).

COMPUTING AND AI (this platform's home subject: make these exceptional)

How computers store things: bits as a row of squares (polygons) you tap to flip between 0 and 1, with the number they represent shown live. Text as numbers: letters mapped to codes.

Algorithms: sorting as bars (chart) that rearrange step by step with a step knob; predict which comparison happens next. Searching: binary search as a range on a number line that halves with each step; predict which half the target is in.

The internet: a packet (an envelope icon) travelling from a phone icon to a server icon across a few router icons, position driven by t; a knob for network congestion that slows it; tap the router where it's delayed. Prefer this drawing over a boxes-and-arrows diagram.

Neurons and neural networks: tipping-point pattern for one neuron (weight and bias knobs on a sigmoid). For a neuron or a small network use the NETWORK template: inputs on the left, weighted links (expressions of weight knobs), the output node's value lighting it; task: turn a weight until the output says the right answer.

Learning and gradient descent: find-the-minimum pattern. A loss curve with the model's position as a draggable ball, the slope as a tangent segment, the step size as a knob; predict the direction of the next step; make the step so big it overshoots.

Fitting a line (what "training" means): points on a graph and a line with draggable slope and intercept; an error readout (sum of squared distances drawn as vertical dashed segments from each point to the line); task: shrink the error below a target.

Language models: odds-you-can-steer pattern for next-word prediction with temperature. Tokens: a sentence (text items) split into coloured chunks. Embeddings: map-of-meaning pattern. Attention: the ATTENTION template (it computes softmax, scale and the causal mask correctly); a scale knob for sharpness, a causal-mask knob with choices Off/On, focusRow on the word that matters; predict which word "it" looks at. Never hand-draw an attention matrix.

Images and vision: a tiny grid of pixels (polygons with fill opacity from expressions) and a filter (3x3 numbers) sliding across; a convolution as a moving window whose output appears in a second grid.

ECONOMICS AND MONEY

Supply and demand: find-the-balance with a price marker you drag, and buyer and seller icons whose counts respond. Interest and growth: race-two-ways for simple versus compound, with years as the knob. Inflation: a basket of icons whose price tag grows with a rate knob while a fixed wage bar falls behind. Taxes and budgets: a chart of where money goes with knobs. Opportunity cost: two jars of icons, choosing more of one empties the other. Stock prices: a line chart with a buyers-versus-sellers knob that pushes the price. Loans: a bar for the remaining balance shrinking month by month (t or a month knob) with interest added each step, showing why early payments are mostly interest.

HISTORY, POLITICS AND SOCIETY

Use timeline scenes for order and cause, and act-it-out drawings for mechanisms. Revolutions: timeline with tap the spark, predict the response. Empires: a chart of territory or population over time with a year knob. Elections and voting systems: icons for voters in groups, a knob that moves a district boundary (segments), predict the winner. Trade routes and migration: a drawing of regions (polygons) with moving dots along paths. Always connect causes and consequences: tap the cause, then predict the effect, then reveal it.

GEOGRAPHY AND EARTH SCIENCE

Seasons: a sun circle and an earth circle with a tilt line, orbit position as a knob; the hemisphere facing the sun gets a warm tone. Day and night: a rotating earth (a circle with a moving terminator polygon). Weather: a water cycle drawing with sun, cloud, rain and sea icons, evaporation driven by a temperature knob. Plate tectonics: two polygons sliding apart or together with a knob, mountains (triangles) rising where they meet. Climate: a chart of temperature over years with a CO₂ knob shifting the curve; predict before reveal. Maps: distances and scale with a drag ruler.

LANGUAGE, WRITING AND ARTS

Grammar: a sentence as text items in a row that the learner taps to classify (tap the verb), with callouts naming the parts. Sentence structure as a small tree drawn with segments. Poetry rhythm: syllables as dots that light up with t (stressed ones bigger). Music: a wave for a note, frequency knob, predict whether a higher note has more or fewer waves per second; chords as add-the-pieces. Colour theory: overlapping circles (fill opacity) mixing light, knobs for each channel. Perspective drawing: lines converging to a draggable vanishing point.

PHILOSOPHY, PSYCHOLOGY, BUSINESS AND OTHER ABSTRACT TOPICS

Make the abstract concrete with a situation and icons (act-it-out), then a knob that changes the situation. A cognitive bias: a chart of how two groups judge the same thing, with a framing knob. Game theory: two player icons, a 2x2 grid of payoffs (polygons with text), predict what each will choose. A business model: a funnel drawn as polygons whose widths are driven by conversion knobs, with revenue live. Ethics trade-offs: a balance with weights for each value. If an idea truly cannot be drawn, it can still be acted out: a person icon choosing between two paths.

PART 7. COMMON FAILURES TO AVOID

- A static picture with a paragraph next to it. Every step needs something that moves when they act.
- A slider that changes a number but nothing visible in the picture.
- A task the picture can't answer (tapping something that isn't drawn; a goal with no visible target).
- Text that names a colour the picture doesn't use, or units that differ between words and knob.
- Labels piled on top of each other: fewer, shorter labels, spread out.
- A diagram of boxes for something that can be drawn (a machine, a body, a place).
- Pictures where all the action is in one corner, or tiny inside a huge frame.
- More than one new idea per step; long sentences; jargon before the picture has earned it.
- For experts: making it denser instead of deeper. Experts still get one idea per step, stated precisely.
=====================================================================
`;
