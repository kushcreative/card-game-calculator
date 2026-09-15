import assert from 'node:assert/strict';
import {
  TOTAL_ACTUAL_WINS,
  MAX_ACTUAL_WINS,
  score,
  validActual,
  validBid,
  newGame,
  commitRound,
  cumulative,
  actualWinsTotal,
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

assert.equal(TOTAL_ACTUAL_WINS, 13);
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
const players = ['a', 'b'];
assert.equal(game.length, 5);
assert.equal(actualWinsTotal(game, players), 0n);
assert.equal(cumulative(game, 'a'), 0n);
assert.throws(() =>
  commitRound(game, 1, players, {
    a: { bid: '1', actual: '4' },
    b: { bid: '1', actual: '4' },
  }),
);
assert.throws(() =>
  commitRound(game, 0, players, {
    a: { bid: '', actual: '4' },
    b: { bid: '1', actual: '1' },
  }),
);

const rounds = [
  [3, 2],
  [1, 2],
  [0, 1],
  [2, 1],
  [1, 0],
];
for (let i = 0; i < rounds.length; i++) {
  const [a, b] = rounds[i];
  game = commitRound(game, i, players, {
    a: { bid: '1', actual: String(a) },
    b: { bid: '1', actual: String(b) },
  });
}
assert.equal(actualWinsTotal(game, players), 13n);
assert.equal(cumulative(game, 'a'), 10n);
assert.equal(cumulative(game, 'b'), 9n);
assert.ok(game.every((round) => round.saved));
assert.throws(() =>
  commitRound(game, 5, players, {
    a: { bid: '1', actual: '1' },
    b: { bid: '1', actual: '0' },
  }),
);

const incomplete = newGame();
let partial = incomplete;
for (let i = 0; i < 4; i++) {
  partial = commitRound(partial, i, players, {
    a: { bid: '1', actual: '1' },
    b: { bid: '1', actual: '1' },
  });
}
assert.equal(actualWinsTotal(partial, players), 8n);
assert.throws(() =>
  commitRound(partial, 4, players, {
    a: { bid: '1', actual: '0' },
    b: { bid: '1', actual: '1' },
  }),
);

// A complete four-player game accepts a natural 3 + 4 + 2 + 4 distribution.
const fourPlayers = ['kush', 'aman', 'rohit', 'sarthak'];
let fourPlayerGame = newGame();
for (let i = 0; i < 4; i++) {
  fourPlayerGame = commitRound(
    fourPlayerGame,
    i,
    fourPlayers,
    Object.fromEntries(
      fourPlayers.map((id) => [id, { bid: '0', actual: '0' }]),
    ),
  );
}
fourPlayerGame = commitRound(fourPlayerGame, 4, fourPlayers, {
  kush: { bid: '3', actual: '3' },
  aman: { bid: '4', actual: '4' },
  rohit: { bid: '2', actual: '2' },
  sarthak: { bid: '1', actual: '4' },
});
assert.equal(actualWinsTotal(fourPlayerGame, fourPlayers), 13n);

const finishWithDistribution = (actuals) => {
  let candidate = newGame();
  for (let i = 0; i < 4; i++) {
    candidate = commitRound(
      candidate,
      i,
      fourPlayers,
      Object.fromEntries(
        fourPlayers.map((id) => [id, { bid: '0', actual: '0' }]),
      ),
    );
  }
  return () =>
    commitRound(
      candidate,
      4,
      fourPlayers,
      Object.fromEntries(
        fourPlayers.map((id, i) => [
          id,
          { bid: '0', actual: String(actuals[i]) },
        ]),
      ),
    );
};
assert.throws(finishWithDistribution([3, 4, 2, 3])); // total 12
assert.throws(finishWithDistribution([4, 4, 3, 4])); // total 15

console.log(
  'Passed: per-player actual-win limit, distributed total exactly 13, uncapped bids, precision-safe scoring, five-round validation, cumulative totals, and empty reset state.',
);
