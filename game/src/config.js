// Every tuning number, colour and layout box for Sizzle & Stack in one place.
// The kitchen is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule anywhere depends on the real screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second at any refresh rate. */
export const STEP = 1 / 60;

/** How long one shift lasts, and how many walk-outs end it early. */
export const SHIFT = { seconds: 120, stars: 3, maxOrders: 3 };

/**
 * The seven things a burger is built from, in bin order. `layer` is how the
 * renderer draws the slice on the plate; `key` is the keyboard shortcut.
 */
export const INGREDIENTS = [
  { id: 'bunB', name: 'Bottom Bun', key: '1', layer: 'bunB' },
  { id: 'patty', name: 'Patty', key: '2', layer: 'patty' },
  { id: 'cheese', name: 'Cheese', key: '3', layer: 'cheese' },
  { id: 'lettuce', name: 'Lettuce', key: '4', layer: 'lettuce' },
  { id: 'tomato', name: 'Tomato', key: '5', layer: 'tomato' },
  { id: 'onion', name: 'Onion', key: '6', layer: 'onion' },
  { id: 'bunT', name: 'Top Bun', key: '7', layer: 'bunT' },
];

/** Fillings a recipe may ask for between its two buns; patty and cheese come up most. */
export const FILLINGS = ['patty', 'patty', 'cheese', 'cheese', 'lettuce', 'tomato', 'onion'];

/** Recipe and patience growth over a shift: `at` is elapsed seconds. */
export const DIFFICULTY = [
  { at: 0, fillings: [1, 2], patience: 36, spawn: 4.6 },
  { at: 30, fillings: [2, 3], patience: 33, spawn: 4.2 },
  { at: 60, fillings: [3, 4], patience: 30, spawn: 3.8 },
  { at: 90, fillings: [3, 5], patience: 27, spawn: 3.4 },
];

/** Money: a flat price per layer, plus a tip that fades as patience runs out. */
export const PRICE = { perLayer: 14, base: 12, maxTip: 30 };

export const PALETTE = {
  wall: '#f3e2c7',
  wallShade: '#e8d0a9',
  floor: '#b08968',
  counter: '#8a5a33',
  counterTop: '#a9713f',
  counterFront: '#744a29',
  board: '#9c6b30',
  boardInner: '#c98f4e',
  ticket: '#fff8e7',
  ticketEdge: '#d9c391',
  ink: '#3d2b18',
  mutedInk: '#8a7355',
  red: '#d94f3d',
  green: '#4d9e57',
  gold: '#f2b33d',
  plate: '#fdfdf8',
  plateShade: '#cfd4d1',
  bin: '#5d3d22',
  binFace: '#6f4a2a',
};

/** Colours and heights for one drawn burger layer, by ingredient id. */
export const LAYER_STYLE = {
  bunB: { fill: '#e8a94e', top: '#f4bc63', height: 20 },
  patty: { fill: '#7a4a26', top: '#8f5a30', height: 18 },
  cheese: { fill: '#f7b731', top: '#ffc94d', height: 10 },
  lettuce: { fill: '#58b368', top: '#6fc97e', height: 12 },
  tomato: { fill: '#e04a38', top: '#ec6a55', height: 14 },
  onion: { fill: '#cdb4e0', top: '#dcc6ec', height: 10 },
  bunT: { fill: '#e8a94e', top: '#f7c873', height: 26 },
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'sizzle-and-stack.best';

/**
 * Clickable layout, shared by the renderer (which draws the boxes) and by
 * main.js (which hit-tests the pointer). All in logical 1280x720 space.
 */
export const LAYOUT = {
  board: { x: 24, y: 40, width: 1232, height: 168 },
  ticket: { width: 384, height: 132, gap: 24, top: 62 },
  plate: { cx: 640, baseY: 618, width: 216 },
  bell: { cx: 1136, cy: 540, r: 52 },
  trash: { x: 66, y: 486, width: 108, height: 108 },
  bins: { x: 32, y: 640, width: 168, height: 66, gap: 8 },
  timerBar: { x: 0, y: 0, width: 1280, height: 14 },
};
