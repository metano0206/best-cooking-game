// Boot, input and the one loop. The world advances in fixed 1/60 s steps
// however fast the display runs; the renderer paints what is there. The
// player stacks a burger by clicking the ingredient bins (or pressing 1-7),
// rings the bell to serve it (click or Enter), takes a layer back with
// Backspace, and throws the plate away with X or the trash can. Little
// synthesized WebAudio blips — no audio files — mark each of those.
//
// ?seed=N fixes the order pattern. ?shot=start|play|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, INGREDIENTS, LAYOUT, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER, EVENT_SERVED, EVENT_WALKOUT, EVENT_WRONG } from './world.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

// --- Tiny synthesized sounds (created lazily, after the first gesture). ---
let audio = null;
function blip(freq, seconds, type = 'square', gain = 0.05) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, audio.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + seconds);
    osc.connect(amp).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + seconds);
  } catch {
    // No audio in this browser: the game plays silently, as it should.
  }
}
const sounds = {
  add: (layer) => blip(320 + layer * 45, 0.07),
  serve: () => { blip(660, 0.1, 'triangle', 0.07); setTimeout(() => blip(880, 0.14, 'triangle', 0.07), 80); },
  wrong: () => blip(140, 0.18, 'sawtooth', 0.05),
  walkout: () => blip(196, 0.22, 'sawtooth', 0.05),
  trash: () => blip(220, 0.08, 'square', 0.04),
};

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best lasts this visit only.
  }
}

function runShot(name) {
  const screen = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, screen, Math.max(readBest(), world.state.score));
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Shift started. Build the burger on the ticket, then ring the bell.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Shift over. You earned ${world.state.score} dollars and served ${world.state.served} burgers.`);
  }

  function doServe() {
    const events = world.serve();
    if (events & EVENT_SERVED) {
      sounds.serve();
      announce(`Served! Plus ${world.state.lastGain} dollars. Score ${world.state.score}.`);
    } else if (events & EVENT_WRONG) {
      sounds.wrong();
      announce('That burger matches no ticket. The combo is lost.');
    }
  }

  function doAdd(id) {
    if (world.addIngredient(id)) sounds.add(world.state.plate.length);
  }

  function handleEvents(events) {
    if (events & EVENT_WALKOUT) {
      sounds.walkout();
      announce(`A customer walked out! ${world.state.stars} stars left.`);
    }
    if (events & EVENT_OVER) endGame();
  }

  function pointIn(x, y, box) {
    return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
  }

  function onTap(clientX, clientY) {
    const { x, y } = renderer.toLogical(clientX, clientY);
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      startGame();
      return;
    }
    if (screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      return;
    }
    // Ingredient bins.
    const bins = LAYOUT.bins;
    INGREDIENTS.forEach((ingredient, index) => {
      const bx = bins.x + index * (bins.width + bins.gap);
      if (pointIn(x, y, { x: bx, y: bins.y, width: bins.width, height: bins.height })) doAdd(ingredient.id);
    });
    // The bell serves; the trash can throws the plate away.
    const bell = LAYOUT.bell;
    if (Math.hypot(x - bell.cx, y - bell.cy) <= bell.r + 16) doServe();
    if (pointIn(x, y, LAYOUT.trash)) {
      world.trash();
      sounds.trash();
    }
  }

  canvas.addEventListener('pointerdown', (event) => onTap(event.clientX, event.clientY));

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      if (key === 'Enter' || key === ' ') startGame();
      return;
    }
    if (key === 'p' || key === 'P' || key === 'Escape') {
      screen = screen === SCREEN_PAUSED ? SCREEN_PLAY : SCREEN_PAUSED;
      announce(screen === SCREEN_PAUSED ? 'Paused.' : 'Playing.');
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const ingredient = INGREDIENTS.find((entry) => entry.key === key);
    if (ingredient) doAdd(ingredient.id);
    else if (key === 'Enter' || key === ' ') doServe();
    else if (key === 'Backspace') {
      world.undo();
      event.preventDefault();
    } else if (key === 'x' || key === 'X') {
      world.trash();
      sounds.trash();
    }
  });

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    if (screen === SCREEN_TITLE) {
      while (accumulator >= STEP) {
        world.step(STEP, true);
        accumulator -= STEP;
      }
    } else if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        handleEvents(world.step(STEP, false));
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Sizzle and Stack. Press Enter or click to start the shift.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
