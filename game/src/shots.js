// The screenshot scenes behind ?shot=start|play|end. Each one is staged from
// the real world with the seeded random source, so the frame is a state the
// game itself can be in — the play scene even serves one burger through the
// ordinary serve() rule — and the same seed always stages the same frame.

import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/**
 * Stage `world` as the named scene (start, play or end; any other name is
 * start) and return the screen to draw over it.
 */
export function stageShot(name, world) {
  const state = world.state;
  world.reset();

  if (name === 'play') {
    // Forty-six seconds into a good shift: one burger already served, a
    // combo running, two tickets on the board, and the next burger half
    // stacked on the plate, matching the first ticket layer for layer.
    state.elapsed = 46;
    state.shiftLeft = 74;
    const first = state.orders[0];
    for (const layer of first.recipe) world.addIngredient(layer);
    world.serve();
    world.spawnOrder();
    const ticket = state.orders[0];
    for (const layer of ticket.recipe.slice(0, 3)) world.addIngredient(layer);
    state.score = 340;
    state.served = 3;
    state.combo = 2;
    state.bestCombo = 3;
    state.orders[0].patience = state.orders[0].patienceMax * 0.55;
    if (state.orders[1]) state.orders[1].patience = state.orders[1].patienceMax * 0.85;
    state.fx.push({ text: '+$96', x: 640, y: 300, colour: '#4d9e57', ttl: 5 });
    return SCREEN_PLAY;
  }

  if (name === 'end') {
    // The full shift worked: the clock ran out with a full board of takings.
    state.elapsed = 120;
    state.shiftLeft = 0;
    state.score = 860;
    state.served = 9;
    state.combo = 0;
    state.bestCombo = 5;
    state.stars = 2;
    state.over = true;
    return SCREEN_OVER;
  }

  // Start: the kitchen at rest, one ticket already pinned up, title over it.
  state.elapsed = 0;
  return SCREEN_TITLE;
}
