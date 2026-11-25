# Sizzle & Stack

[![make.fun bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![make.fun rank](https://make.fun/badge/best-cooking-game-20261125-0137/metano0206/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![make.fun reward](https://make.fun/badge/best-cooking-game-20261125-0137/metano0206/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A tiny burger kitchen game, built for the make.fun bounty
[best-cooking-game-20261125-0137](https://make.fun/bounty/best-cooking-game-20261125-0137).

## The game

You work a two-minute shift in a burger kitchen. Customers pin order tickets
to the board — each one shows its burger as a little stack of layers, a price,
and a patience bar that drains while they wait. Stack the same layers on the
plate (click the ingredient bins, or press 1–7), then ring the golden bell to
serve. An exact match pays the price plus a tip that shrinks as patience runs
out, and consecutive good serves build a combo. A customer whose patience
empties walks out and costs you a star; lose three stars, or run out the
shift clock, and the shift is over.

- **Controls:** mouse or keyboard — 1–7 add ingredients, Enter serves,
  Backspace takes a layer back, X (or the trash can) throws the plate away,
  P pauses.
- **Difficulty:** recipes grow from 3 to 7 layers and patience shrinks as the
  shift goes on.
- **Sound:** small synthesized WebAudio blips; no audio files.
- **Offline:** plain static files under `game/`, no library, no network
  request. Open it through `node serve.ts` (http://localhost:8080) and play.

## Layout

- `main.ts` — the hand-in program (Node 22, standard library only): copies
  `game/` and `screenshots/` to the output directory and writes
  `dossier.json` with the vendored make.fun library.
- `vendor/makefun-game.ts` — the kit's library, copied unchanged.
- `game/` — the playable game: `index.html` plus ES modules under `src/`
  (`config` for tuning and layout, `world` for the rules, `render` for the
  canvas kitchen, `shots` for the deterministic screenshot scenes,
  `main` for boot, input and sound).
- `screenshots/` — three real renders of the game (`?shot=start|play|end`
  with a fixed seed).

## Running the hand-in locally

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

MIT licensed.
