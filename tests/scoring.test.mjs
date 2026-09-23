import assert from 'node:assert/strict';
import {
  ALLOWED_ROUND_COUNTS,
  DEFAULT_ROUND_COUNT,
  MAX_ACTUAL_WINS,
  ROUND_TARGET,
  score,
  validActual,
  validBid,
  validRoundCount,
  newGame,
  commitRound,
  cumulative,
  actualWinsTotal,
  roundActualTotal,
  roundComplete,
} from '../app/scoring.ts';

for (const [bid, actual, expected] of [
  [1, 4, 5n],
  [4, 1, -3n],
  [2, 2, 4n],
  [0, 0, 0n],
]) {
  assert.equal(score({ bid: String(bid), actual: String(actual) }), expected);
}

assert.deepEqual(ALLOWED_ROUND_COUNTS, [3, 4, 5, 6, 7]);
assert.equal(DEFAULT_ROUND_COUNT, 5);
assert.equal(ROUND_TARGET, 13);
for (const count of ALLOWED_ROUND_COUNTS) {
  assert.equal(validRoundCount(count), true);
  assert.equal(newGame(count).length, count);
}
assert.throws(() => newGame(2));
assert.throws(() => newGame(8));

assert.equal(MAX_ACTUAL_WINS, 13);
assert.equal(validActual('0'), true);
assert.equal(validActual('13'), true);
assert.equal(validActual('14'), false);

// Individual and combined bids remain uncapped and independent from 13.
const unlimitedBid = '1000000000000000000000000000000';
for (const bid of ['1', '13', '89', '98', '9087', '10000']) {
  assert.equal(validBid(bid), true);
}
assert.equal(validBid(unlimitedBid), true);
assert.equal(
  score({ bid: unlimitedBid, actual: '13' }),
  13n - BigInt(unlimitedBid),
);

const players = ['a', 'b', 'c', 'd'];
const entries = (bids, actuals) =>
  Object.fromEntries(
    players.map((id, index) => [
      id,
      { bid: String(bids[index]), actual: String(actuals[index]) },
    ]),
  );

const unlimitedBidEntries = entries([89, 98, 9087, 76], [5, 4, 1, 3]);
const total5 = entries([89, 98, 9087, 76], [2, 1, 1, 1]);
const total12 = entries([89, 98, 9087, 76], [5, 4, 1, 2]);
const total19 = entries([89, 98, 9087, 76], [8, 6, 4, 1]);
assert.equal(roundActualTotal(total5, players), 5n);
assert.equal(roundActualTotal(total12, players), 12n);
assert.equal(roundActualTotal(unlimitedBidEntries, players), 13n);
assert.equal(roundComplete(total5, players), false);
assert.equal(roundComplete(total12, players), false);
assert.equal(roundComplete(total19, players), false);
assert.equal(roundComplete(unlimitedBidEntries, players), true);

assert.throws(
  () => commitRound(newGame(5, players), 0, players, total5),
  /Actual Won must total exactly 13.*5 \/ 13/,
);
assert.throws(
  () => commitRound(newGame(5, players), 0, players, total12),
  /Actual Won must total exactly 13.*12 \/ 13/,
);
assert.throws(
  () => commitRound(newGame(5, players), 0, players, total19),
  /Actual Won must total exactly 13.*19 \/ 13/,
);

// A single player's 13 is not the completion condition when the round total is 14.
const singlePlayerTriggerBug = entries([89, 98, 9087, 76], [13, 1, 0, 0]);
assert.equal(roundComplete(singlePlayerTriggerBug, players), false);
assert.throws(
  () => commitRound(newGame(5, players), 0, players, singlePlayerTriggerBug),
  /Current total: 14 \/ 13/,
);

const largeBidRound = commitRound(
  newGame(5, players),
  0,
  players,
  unlimitedBidEntries,
);
assert.equal(largeBidRound[0].saved, true);

// Non-four-player games never inherit the combined Actual Won target.
const threePlayers = ['a', 'b', 'c'];
const threePlayerEntries = {
  a: { bid: '754', actual: '8' },
  b: { bid: '545', actual: '6' },
  c: { bid: '85', actual: '4' },
};
assert.equal(roundActualTotal(threePlayerEntries, threePlayers), 18n);
assert.equal(roundComplete(threePlayerEntries, threePlayers), true);
const threePlayerGame = commitRound(
  newGame(3, threePlayers),
  0,
  threePlayers,
  threePlayerEntries,
);
assert.equal(threePlayerGame[0].saved, true);
assert.equal(cumulative(threePlayerGame, 'a'), -746n);

const fivePlayers = ['a', 'b', 'c', 'd', 'e'];
const fivePlayerEntries = Object.fromEntries(
  fivePlayers.map((id) => [id, { bid: '10000', actual: '13' }]),
);
assert.equal(roundActualTotal(fivePlayerEntries, fivePlayers), 65n);
assert.equal(
  commitRound(newGame(3, fivePlayers), 0, fivePlayers, fivePlayerEntries)[0]
    .saved,
  true,
);

// Verify dynamic games, fresh zeroed rounds, and preserved cumulative scores.
for (const roundCount of [3, 5, 7]) {
  let game = newGame(roundCount, players);
  for (let index = 0; index < roundCount; index++) {
    assert.deepEqual(
      players.map((id) => game[index].entries[id].actual),
      ['0', '0', '0', '0'],
    );
    const scoreBeforeSave = cumulative(game, 'a');
    game = commitRound(game, index, players, unlimitedBidEntries);
    assert.equal(cumulative(game, 'a'), scoreBeforeSave - 84n);
    if (index + 1 < roundCount) {
      assert.equal(roundActualTotal(game[index + 1].entries, players), 0n);
      assert.equal(game[index + 1].saved, false);
    }
  }
  assert.ok(game.every((round) => round.saved));
  assert.equal(actualWinsTotal(game, players), BigInt(13 * roundCount));
  assert.equal(cumulative(game, 'a'), BigInt(-84 * roundCount));
}

assert.throws(() =>
  commitRound(newGame(5, players), 0, ['a', 'a'], {
    a: { bid: '13', actual: '13' },
  }),
);

console.log(
  'Passed: four-player-only Actual target of 13, non-four-player games without the target, unlimited bids, independent zeroed rounds, preserved totals, and 3/5/7-round games.',
);
