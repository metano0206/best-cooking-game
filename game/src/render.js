// Everything the player sees, drawn on one canvas from the world state: a
// warm little kitchen. The order board hangs at the top with up to three
// tickets, each showing its burger as a tiny stack of layers and a patience
// bar; the counter below holds a trash can, the plate the player is stacking
// in the middle, and the serving bell; the ingredient bins line the front.
// Title, pause and game-over screens are drawn over the same kitchen, so a
// screenshot of any screen still shows the game it belongs to.

import { FIELD, FONT, INGREDIENTS, LAYER_STYLE, LAYOUT, PALETTE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** A rounded rectangle path (not yet filled or stroked). */
function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/** Deterministic little hash, so sesame seeds sit still between frames. */
function hash(n) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/** One burger layer centred at `cx`, its bottom edge at `baseY`. Returns its height. */
function drawLayer(ctx, id, cx, baseY, width) {
  const style = LAYER_STYLE[id];
  const h = style.height * (width / 216);
  const x = cx - width / 2;
  const y = baseY - h;
  ctx.fillStyle = style.fill;
  if (id === 'bunT') {
    // A dome: half-rounded top, flat bottom, with sesame seeds.
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, y + h * 0.45);
    ctx.quadraticCurveTo(x + width / 2, y - h * 0.55, x + width, y + h * 0.45);
    ctx.lineTo(x + width, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3cf';
    for (let seed = 0; seed < 7; seed += 1) {
      const sx = x + width * (0.18 + 0.64 * hash(seed * 3 + 1));
      const sy = y + h * (0.05 + 0.3 * hash(seed * 7 + 2));
      ctx.beginPath();
      ctx.ellipse(sx, sy, 4.5 * (width / 216), 2.4 * (width / 216), hash(seed) * 0.9 - 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    return h;
  }
  roundRect(ctx, x, y, width, h, 6);
  ctx.fill();
  ctx.fillStyle = style.top;
  if (id === 'cheese') {
    // Cheese drips over the edges.
    for (let drip = 0; drip < 4; drip += 1) {
      const dx = x + width * (0.14 + 0.24 * drip);
      ctx.beginPath();
      ctx.moveTo(dx, baseY - 2);
      ctx.lineTo(dx + 13, baseY - 2);
      ctx.lineTo(dx + 6.5, baseY + 7 + hash(drip * 11) * 5);
      ctx.closePath();
      ctx.fill();
    }
  } else if (id === 'lettuce') {
    // A wavy lettuce fringe along the bottom edge.
    ctx.beginPath();
    ctx.moveTo(x, baseY - 3);
    for (let wave = 0; wave <= 6; wave += 1) {
      ctx.quadraticCurveTo(
        x + (width / 6) * (wave + 0.5), baseY + (wave % 2 === 0 ? 5 : -4),
        x + (width / 6) * (wave + 1), baseY - 3,
      );
    }
    ctx.lineTo(x + width, baseY - 8);
    ctx.lineTo(x, baseY - 8);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'onion') {
    ctx.strokeStyle = '#b28fd1';
    ctx.lineWidth = 2;
    for (let ring = 0; ring < 3; ring += 1) {
      ctx.beginPath();
      ctx.arc(x + width * (0.28 + 0.22 * ring), y + h / 2, 6.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (id === 'patty') {
    ctx.strokeStyle = 'rgba(46,26,10,0.55)';
    ctx.lineWidth = 2.4;
    for (let mark = 0; mark < 4; mark += 1) {
      const mx = x + width * (0.16 + 0.2 * mark);
      ctx.beginPath();
      ctx.moveTo(mx, y + 3);
      ctx.lineTo(mx + 9, baseY - 3);
      ctx.stroke();
    }
  } else if (id === 'tomato') {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, y + h / 2, width * 0.16, h * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return h;
}

/** A whole stack of layers on a plate: the plate first, then bottom layer up. */
function drawBurger(ctx, layers, cx, baseY, width) {
  ctx.fillStyle = PALETTE.plateShade;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 8, width * 0.62, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 3, width * 0.62, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  let y = baseY;
  for (const layer of layers) y -= drawLayer(ctx, layer, cx, y, width);
  return y;
}

/** One order ticket: its burger as a mini stack, its price, its patience. */
function drawTicket(ctx, order, x, y) {
  const { width, height } = LAYOUT.ticket;
  ctx.fillStyle = 'rgba(61,43,24,0.25)';
  roundRect(ctx, x + 4, y + 5, width, height, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.ticket;
  roundRect(ctx, x, y, width, height, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ticketEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  // The pin.
  ctx.fillStyle = PALETTE.red;
  ctx.beginPath();
  ctx.arc(x + width / 2, y + 9, 7, 0, Math.PI * 2);
  ctx.fill();

  drawBurger(ctx, order.recipe, x + 62, y + height - 26, 84);

  ctx.fillStyle = PALETTE.ink;
  ctx.font = `700 25px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('BURGER', x + 122, y + 46);
  ctx.font = `600 21px ${FONT}`;
  ctx.fillStyle = PALETTE.mutedInk;
  ctx.fillText(`${order.recipe.length} layers`, x + 122, y + 76);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText(`$${order.price}`, x + 268, y + 48);
  ctx.font = `600 17px ${FONT}`;
  ctx.fillStyle = PALETTE.mutedInk;
  ctx.fillText('+ tip', x + 268, y + 76);

  // Patience: green while there is time, red once it runs low.
  const fraction = Math.max(0, order.patience / order.patienceMax);
  ctx.fillStyle = '#e3d3ae';
  roundRect(ctx, x + 122, y + height - 30, width - 142, 13, 6);
  ctx.fill();
  ctx.fillStyle = fraction > 0.35 ? PALETTE.green : PALETTE.red;
  roundRect(ctx, x + 122, y + height - 30, (width - 142) * fraction, 13, 6);
  ctx.fill();
}

function drawKitchen(ctx, state) {
  // Wall, wainscot and the chequered floor strip.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.wallShade;
  ctx.fillRect(0, 428, FIELD.width, 10);
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 690, FIELD.width, 30);
  for (let tile = 0; tile < 16; tile += 1) {
    ctx.fillStyle = tile % 2 ? '#a37c56' : '#bb9268';
    ctx.fillRect(tile * 80, 690, 80, 30);
  }

  // Two hanging lamps over the counter.
  for (const cx of [340, 940]) {
    ctx.strokeStyle = '#6d543a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, 208);
    ctx.lineTo(cx, 246);
    ctx.stroke();
    ctx.fillStyle = '#e2725b';
    ctx.beginPath();
    ctx.moveTo(cx - 34, 282);
    ctx.quadraticCurveTo(cx, 238, cx + 34, 282);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(242,179,61,0.20)';
    ctx.beginPath();
    ctx.moveTo(cx - 30, 284);
    ctx.lineTo(cx + 30, 284);
    ctx.lineTo(cx + 74, 470);
    ctx.lineTo(cx - 74, 470);
    ctx.closePath();
    ctx.fill();
  }

  // The shift clock: a bar across the very top that empties as time runs out.
  ctx.fillStyle = '#3d2b18';
  ctx.fillRect(LAYOUT.timerBar.x, LAYOUT.timerBar.y, LAYOUT.timerBar.width, LAYOUT.timerBar.height);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(0, 0, LAYOUT.timerBar.width * Math.max(0, state.shiftLeft / 120), LAYOUT.timerBar.height);

  // The order board and its tickets.
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, LAYOUT.board.x - 8, LAYOUT.board.y - 8, LAYOUT.board.width + 16, LAYOUT.board.height + 16, 14);
  ctx.fill();
  ctx.fillStyle = PALETTE.boardInner;
  roundRect(ctx, LAYOUT.board.x, LAYOUT.board.y, LAYOUT.board.width, LAYOUT.board.height, 10);
  ctx.fill();
  ctx.fillStyle = '#fff8e7';
  ctx.font = `800 24px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('ORDERS', LAYOUT.board.x + 18, LAYOUT.board.y + 4);
  state.orders.forEach((order, index) => {
    const x = LAYOUT.board.x + 18 + index * (LAYOUT.ticket.width + LAYOUT.ticket.gap);
    drawTicket(ctx, order, x, LAYOUT.ticket.top);
  });
  if (state.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,248,231,0.85)';
    ctx.font = `600 24px ${FONT}`;
    ctx.fillText('Waiting for customers…', LAYOUT.board.x + 30, LAYOUT.ticket.top + 76);
  }

  // The counter block.
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(0, 470, FIELD.width, 26);
  ctx.fillStyle = PALETTE.counter;
  ctx.fillRect(0, 496, FIELD.width, 140);
  ctx.fillStyle = PALETTE.counterFront;
  ctx.fillRect(0, 636, FIELD.width, 54);

  drawScorePanel(ctx, state);
  drawComboPanel(ctx, state);

  // Trash can (click to throw the plate away).
  const trash = LAYOUT.trash;
  ctx.fillStyle = '#7d8894';
  roundRect(ctx, trash.x, trash.y + 18, trash.width, trash.height - 18, 10);
  ctx.fill();
  ctx.fillStyle = '#98a4ae';
  roundRect(ctx, trash.x - 6, trash.y + 6, trash.width + 12, 16, 7);
  ctx.fill();
  ctx.fillStyle = '#39424b';
  ctx.font = `700 17px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('TRASH', trash.x + trash.width / 2, trash.y + trash.height + 24);

  // The serving bell (click to serve the plate).
  const bell = LAYOUT.bell;
  ctx.fillStyle = 'rgba(61,43,24,0.25)';
  ctx.beginPath();
  ctx.ellipse(bell.cx, bell.cy + bell.r * 0.72, bell.r * 1.05, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.moveTo(bell.cx - bell.r, bell.cy + bell.r * 0.55);
  ctx.quadraticCurveTo(bell.cx, bell.cy - bell.r * 1.25, bell.cx + bell.r, bell.cy + bell.r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c07f13';
  ctx.fillRect(bell.cx - bell.r - 6, bell.cy + bell.r * 0.55, bell.r * 2 + 12, 9);
  ctx.beginPath();
  ctx.arc(bell.cx, bell.cy - bell.r * 0.72, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `800 20px ${FONT}`;
  ctx.fillText('SERVE!', bell.cx, bell.cy + bell.r + 34);

  // The plate being built, centre counter.
  if (state.plate.length === 0) {
    drawBurger(ctx, [], LAYOUT.plate.cx, LAYOUT.plate.baseY, LAYOUT.plate.width);
    ctx.fillStyle = 'rgba(255,248,231,0.9)';
    ctx.font = `600 20px ${FONT}`;
    ctx.fillText('Click ingredients to stack a burger', LAYOUT.plate.cx, 452);
  } else {
    drawBurger(ctx, state.plate, LAYOUT.plate.cx, LAYOUT.plate.baseY, LAYOUT.plate.width);
  }

  drawBins(ctx);

  // Floating score notes.
  for (const fx of state.fx) {
    ctx.globalAlpha = Math.min(1, fx.ttl);
    ctx.fillStyle = fx.colour;
    ctx.font = `800 30px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(fx.text, fx.x, fx.y);
    ctx.globalAlpha = 1;
  }
}

/** The chalkboard on the left wall: score, dishes served, stars remaining. */
function drawScorePanel(ctx, state) {
  ctx.fillStyle = '#37474f';
  roundRect(ctx, 36, 238, 252, 196, 12);
  ctx.fill();
  ctx.strokeStyle = '#8a5a33';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = '#fff8e7';
  ctx.textAlign = 'left';
  ctx.font = `700 19px ${FONT}`;
  ctx.fillText('SCORE', 60, 282);
  ctx.font = `800 44px ${FONT}`;
  ctx.fillText(`$${state.score}`, 60, 330);
  ctx.font = `600 20px ${FONT}`;
  ctx.fillText(`Served: ${state.served}`, 60, 372);
  ctx.font = `24px ${FONT}`;
  let stars = '';
  for (let index = 0; index < 3; index += 1) stars += index < state.stars ? '★' : '☆';
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(stars, 60, 412);
}

/** The chalkboard on the right wall: the combo and the shift clock as text. */
function drawComboPanel(ctx, state) {
  ctx.fillStyle = '#37474f';
  roundRect(ctx, 992, 238, 252, 196, 12);
  ctx.fill();
  ctx.strokeStyle = '#8a5a33';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = '#fff8e7';
  ctx.textAlign = 'left';
  ctx.font = `700 19px ${FONT}`;
  ctx.fillText('COMBO', 1016, 282);
  ctx.font = `800 44px ${FONT}`;
  ctx.fillStyle = state.combo >= 3 ? PALETTE.gold : '#fff8e7';
  ctx.fillText(`x${state.combo}`, 1016, 330);
  ctx.fillStyle = '#fff8e7';
  ctx.font = `600 20px ${FONT}`;
  const clock = Math.max(0, Math.ceil(state.shiftLeft));
  ctx.fillText(`Time left: ${clock}s`, 1016, 372);
  ctx.fillText(`Best combo: x${state.bestCombo}`, 1016, 404);
}

/** The seven ingredient bins along the front of the counter. */
function drawBins(ctx) {
  const bins = LAYOUT.bins;
  INGREDIENTS.forEach((ingredient, index) => {
    const x = bins.x + index * (bins.width + bins.gap);
    const y = bins.y;
    ctx.fillStyle = PALETTE.bin;
    roundRect(ctx, x, y, bins.width, bins.height, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.binFace;
    roundRect(ctx, x + 5, y + 5, bins.width - 10, bins.height - 10, 8);
    ctx.fill();
    // A peek of the ingredient itself, drawn as its layer shape.
    drawLayer(ctx, ingredient.id, x + 34, y + 40, 52);
    ctx.fillStyle = '#fff8e7';
    ctx.font = `700 16px ${FONT}`;
    ctx.textAlign = 'left';
    const label = ingredient.name.replace(' ', '\n');
    label.split('\n').forEach((line, lineIndex) => {
      ctx.fillText(line, x + 68, y + 30 + lineIndex * 19);
    });
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `800 15px ${FONT}`;
    ctx.fillText(ingredient.key, x + bins.width - 20, y + 22);
  });
}

function drawCentredPanel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(36,24,12,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 340, 168, 600, 384, 18);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'center';
  ctx.font = `800 52px ${FONT}`;
  ctx.fillText(title, FIELD.width / 2, 258);
  ctx.font = `600 23px ${FONT}`;
  lines.forEach((line, index) => {
    ctx.fillText(line, FIELD.width / 2, 330 + index * 42);
  });
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    offsetX = (canvas.width - FIELD.width * scale) / 2;
    offsetY = (canvas.height - FIELD.height * scale) / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  /** Convert a pointer position in client pixels to logical kitchen space. */
  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = (clientX - rect.left) * dpr;
    const py = (clientY - rect.top) * dpr;
    return { x: (px - offsetX) / scale, y: (py - offsetY) / scale };
  }

  function draw(state, screen, best) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#241a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    drawKitchen(ctx, state);
    if (screen === SCREEN_TITLE) {
      drawCentredPanel(ctx, 'SIZZLE & STACK', [
        'Build each burger to match its ticket,',
        'then ring the bell to serve it.',
        'Click ingredients (or press 1-7), Enter to serve,',
        'Backspace to undo, X to trash the plate.',
        '',
        'Click or press Enter to start the shift!',
      ], PALETTE.gold);
    } else if (screen === SCREEN_PAUSED) {
      drawCentredPanel(ctx, 'PAUSED', ['The kitchen waits.', '', 'Press P or click to carry on.'], PALETTE.board);
    } else if (screen === SCREEN_OVER) {
      drawCentredPanel(ctx, 'SHIFT OVER!', [
        `You earned $${state.score} and served ${state.served} burgers.`,
        `Best combo: x${state.bestCombo}`,
        `Best ever: $${Math.max(best, state.score)}`,
        '',
        'Click or press Enter to work another shift!',
      ], PALETTE.red);
    }
  }

  return { draw, toLogical };
}
