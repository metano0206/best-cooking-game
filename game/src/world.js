// The whole game as data and rules, with no drawing and no DOM: a shift of
// burger orders. Customers arrive with a recipe (bottom bun, fillings, top
// bun) and a patience bar; the player stacks the same layers on the plate and
// rings the bell. An exact match is served for its price plus a tip that
// shrinks as patience runs out; a customer whose patience empties walks out
// and costs a star. Three walk-outs, or the shift clock reaching zero, ends
// the game. Everything random flows from the one seeded source, so a seed
// always plays the same shift.

import { DIFFICULTY, FILLINGS, INGREDIENTS, PRICE, RUSH, SHIFT } from './config.js';
import { intBetween, pick } from './random.js';

export const EVENT_SERVED = 1;
export const EVENT_WRONG = 2;
export const EVENT_WALKOUT = 4;
export const EVENT_OVER = 8;
export const EVENT_ADDED = 16;

/** The difficulty row in force at `elapsed` seconds into the shift. */
function difficultyAt(elapsed) {
  let row = DIFFICULTY[0];
  for (const candidate of DIFFICULTY) if (elapsed >= candidate.at) row = candidate;
  return row;
}

/** The shouty display name of an ingredient, for ticket notes. */
function shoutName(id) {
  const found = INGREDIENTS.find((entry) => entry.id === id);
  return (found ? found.name : id).toUpperCase();
}

/**
 * One random recipe: a bottom bun, some fillings, a top bun — plus, about
 * half the time, a special request the ticket spells out in red. A DOUBLE
 * order stacks two of its favourite filling back to back; a NO order is
 * built without the named filling at all. Either way the recipe itself is
 * the whole truth: the plate still has to match it layer for layer.
 */
function makeRecipe(random, elapsed) {
  const row = difficultyAt(elapsed);
  const count = intBetween(random, row.fillings[0], row.fillings[1]);
  const fillings = [];
  for (let index = 0; index < count; index += 1) fillings.push(pick(random, FILLINGS));
  let note = null;
  const roll = random();
  if (roll < 0.24) {
    const excluded = pick(random, ['cheese', 'onion', 'tomato', 'lettuce']);
    const pool = FILLINGS.filter((filling) => filling !== excluded);
    for (let index = 0; index < fillings.length; index += 1) {
      if (fillings[index] === excluded) fillings[index] = pick(random, pool);
    }
    note = `NO ${shoutName(excluded)}`;
  } else if (roll < 0.48) {
    const doubled = pick(random, ['patty', 'cheese']);
    const at = fillings.indexOf(doubled);
    if (at === -1) fillings[0] = doubled;
    fillings.splice(at === -1 ? 1 : at + 1, 0, doubled);
    note = `DOUBLE ${shoutName(doubled)}`;
  }
  return { layers: ['bunB', ...fillings, 'bunT'], note };
}

/** What a finished burger pays before its tip: a base plus a price per layer. */
function priceOf(recipe) {
  return PRICE.base + PRICE.perLayer * recipe.length;
}

export function createWorld(random) {
  const state = {
    elapsed: 0,
    shiftLeft: SHIFT.seconds,
    score: 0,
    served: 0,
    attempts: 0,
    perfects: 0,
    combo: 0,
    bestCombo: 0,
    stars: SHIFT.stars,
    orders: [],
    plate: [],
    platePop: 0,
    spawnIn: 0,
    over: false,
    fx: [],
    lastGain: 0,
  };
  let nextOrderId = 1;

  function spawnOrder() {
    if (state.orders.length >= SHIFT.maxOrders || state.over) return;
    const row = difficultyAt(state.elapsed);
    const { layers, note } = makeRecipe(random, state.elapsed);
    state.orders.push({
      id: nextOrderId,
      recipe: layers,
      note,
      price: priceOf(layers),
      patience: row.patience,
      patienceMax: row.patience,
    });
    nextOrderId += 1;
    // Rush time: in the last stretch the gap between arrivals shrinks.
    const rush = state.shiftLeft <= RUSH.at && state.elapsed > 0 ? RUSH.spawnFactor : 1;
    state.spawnIn = row.spawn * rush * (0.75 + random() * 0.5);
  }

  function addFx(text, x, y, colour) {
    state.fx.push({ text, x, y, colour, ttl: 1.4 });
  }

  function reset() {
    state.elapsed = 0;
    state.shiftLeft = SHIFT.seconds;
    state.score = 0;
    state.served = 0;
    state.attempts = 0;
    state.perfects = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.stars = SHIFT.stars;
    state.orders = [];
    state.plate = [];
    state.platePop = 0;
    state.spawnIn = 0;
    state.over = false;
    state.fx = [];
    state.lastGain = 0;
    nextOrderId = 1;
    spawnOrder();
  }

  /**
   * Put one ingredient on the plate. Returns false when the stack is full.
   * A successful drop also starts the little squash animation the renderer
   * plays on the new top layer (`platePop` runs 1 → 0 in a fraction of a
   * second, ticked down in step()).
   */
  function addIngredient(id) {
    if (state.over || state.plate.length >= 9) return false;
    state.plate.push(id);
    state.platePop = 1;
    return true;
  }

  /**
   * Take the top layer back off the plate: the mistake recovery. It costs
   * nothing but the seconds it takes, which in a rush is cost enough.
   */
  function undo() {
    state.plate.pop();
    state.platePop = 0;
  }

  /** Throw the whole plate away; the combo survives, the layers do not. */
  function trash() {
    state.plate = [];
    state.platePop = 0;
  }

  function sameRecipe(a, b) {
    return a.length === b.length && a.every((layer, index) => layer === b[index]);
  }

  /**
   * Ring the bell: serve the plate to the first order it matches exactly.
   * Returns the events that happened (EVENT_SERVED or EVENT_WRONG).
   */
  function serve() {
    if (state.over || state.plate.length === 0) return 0;
    state.attempts += 1;
    const index = state.orders.findIndex((order) => sameRecipe(order.recipe, state.plate));
    if (index === -1) {
      state.combo = 0;
      addFx('No ticket matches!', 640, 300, '#d94f3d');
      return EVENT_WRONG;
    }
    const [order] = state.orders.splice(index, 1);
    const fresh = order.patience / order.patienceMax;
    const tip = Math.round(PRICE.maxTip * fresh);
    const gain = order.price + tip + Math.min(state.combo, 5) * 4;
    state.score += gain;
    state.lastGain = gain;
    state.served += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.plate = [];
    state.platePop = 0;
    // An exact burger served while the customer is still fresh: PERFECT!
    if (fresh >= PRICE.perfectFraction) {
      state.perfects += 1;
      addFx('PERFECT!', 640, 262, '#c07f13');
    }
    addFx(`+$${gain}`, 640, 300, '#4d9e57');
    if (tip >= 20) addFx('Great tip!', 640, 336, '#c07f13');
    if (state.orders.length < 2) spawnOrder();
    return EVENT_SERVED;
  }

  /**
   * Advance the shift by `dt` seconds. With `attract` set, the kitchen idles
   * for the title screen: orders hang on the board but nobody's patience
   * moves and the clock stands still.
   */
  function step(dt, attract = false) {
    let events = 0;
    for (const fx of state.fx) {
      fx.ttl -= dt;
      fx.y -= 26 * dt;
    }
    state.fx = state.fx.filter((fx) => fx.ttl > 0);
    state.platePop = Math.max(0, state.platePop - dt * 3.2);
    if (attract || state.over) return events;

    state.elapsed += dt;
    state.shiftLeft = Math.max(0, SHIFT.seconds - state.elapsed);

    state.spawnIn -= dt;
    if (state.spawnIn <= 0) spawnOrder();

    for (const order of [...state.orders]) {
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(state.orders.indexOf(order), 1);
        state.stars -= 1;
        state.combo = 0;
        events |= EVENT_WALKOUT;
        addFx('Walked out!', 640, 300, '#d94f3d');
        if (state.orders.length < 2) spawnOrder();
      }
    }

    if (state.shiftLeft <= 0 || state.stars <= 0) {
      state.over = true;
      events |= EVENT_OVER;
    }
    return events;
  }

  reset();
  return { state, reset, addIngredient, undo, trash, serve, step, spawnOrder };
}
