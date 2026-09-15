import assert from 'node:assert/strict';
import {
  MAX_ACTUAL_WINS,
  score,
  validActual,
  validBid,
  newGame,
  commitRound,
  cumulative,
} from '../app/scoring.ts';

for (const [bid, actual, expected] of [
  [1, 4, 5n],
  [2, 5, 7n],
  [4, 1, -3n],
  [5, 2, -3n],
  [2, 2, 4n],
  [3, 2, -1n],
  [0, 0, 0n],
]) {
  assert.equal(score({ bid: String(bid), actual: String(actual) }), expected);
}

assert.equal(MAX_ACTUAL_WINS, 13);
assert.equal(validActual('13'), true);
assert.equal(validActual('14'), false);
assert.equal(validActual('999'), false);
assert.equal(score({ bid: '1', actual: '13' }), 14n);
assert.equal(score({ bid: '1', actual: '14' }), 0n);

assert.equal(validBid('13'), true);
assert.equal(validBid('14'), true);
assert.equal(validBid('1000'), true);
const unlimitedBid = '1000000000000000000000000000000';
assert.equal(validBid(unlimitedBid), true);
assert.equal(
  score({ bid: unlimitedBid, actual: '13' }),
  13n - BigInt(unlimitedBid),
);

for (const value of ['', '-1', 'NaN', 'Infinity', '1.5']) {
  assert.equal(score({ bid: value, actual: '4' }), 0n);
}

let game = newGame();
assert.equal(game.length, 5);
assert.equal(cumulative(game, 'a'), 0n);
assert.throws(() =>
  commitRound(game, 1, ['a'], { a: { bid: '1', actual: '4' } }),
);
assert.throws(() =>
  commitRound(game, 0, ['a'], { a: { bid: '', actual: '4' } }),
);
assert.throws(() =>
  commitRound(game, 0, ['a'], { a: { bid: '1', actual: '14' } }),
);
for (let i = 0; i < 5; i++) {
  game = commitRound(game, i, ['a'], { a: { bid: '1', actual: '4' } });
}
assert.equal(cumulative(game, 'a'), 25n);
assert.ok(game.every((round) => round.saved));
assert.throws(() =>
  commitRound(game, 5, ['a'], { a: { bid: '1', actual: '4' } }),
);
game = commitRound(game, 0, ['a'], { a: { bid: '4', actual: '1' } });
assert.equal(cumulative(game, 'a'), 17n);
assert.equal(cumulative(newGame(), 'a'), 0n);

console.log(
  'Passed: actual wins stop at 13, bids remain uncapped, large bids retain precision, scoring examples, five-round flow, cumulative totals, round replacement, and reset.',
);
