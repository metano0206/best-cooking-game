// A small seeded random number generator (mulberry32). The same seed always
// produces the same sequence, which is what makes the screenshot scenes and
// any fixed-seed game perfectly repeatable.

export function createRandom(seed) {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (a >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one entry of `list` with the given random source. */
export function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

/** An integer from `low` to `high`, both included. */
export function intBetween(random, low, high) {
  return low + Math.floor(random() * (high - low + 1));
}
