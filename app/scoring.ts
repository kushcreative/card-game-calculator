export const ROUND_COUNT = 5;
export const TOTAL_ACTUAL_WINS = 13;
export type Entry = { bid: string; actual: string };
export type Round = { entries: Record<string, Entry>; saved: boolean };
export const validBid = (value: string) => /^\d+$/.test(value);
export const validActual = (value: string) => /^\d+$/.test(value);
// Exact matches follow the supplied examples: 2 / 2 = +4.
export function score(entry?: Entry) {
  if (!entry || !validBid(entry.bid) || !validActual(entry.actual)) return 0n;
  const bid = BigInt(entry.bid),
    actual = BigInt(entry.actual);
  return actual >= bid ? bid + actual : actual - bid;
}
export const blankRound = (): Round => ({ entries: {}, saved: false });
export const newGame = () => Array.from({ length: ROUND_COUNT }, blankRound);
export function commitRound(
  rounds: Round[],
  index: number,
  playerIds: string[],
  entries: Record<string, Entry>,
) {
  if (!Number.isInteger(index) || index < 0 || index >= ROUND_COUNT)
    throw new Error('Invalid round.');
  if (
    !playerIds.length ||
    playerIds.some(
      (id) =>
        !entries[id] ||
        !validBid(entries[id].bid) ||
        !validActual(entries[id].actual),
    )
  )
    throw new Error(
      'Enter a non-negative whole-number bid and actual wins for every player.',
    );
  if (rounds.slice(0, index).some((r) => !r.saved))
    throw new Error('Save the earlier rounds first.');
  const nextRounds = rounds.map((r, i) =>
    i === index ? { entries: structuredClone(entries), saved: true } : r,
  );
  const actualTotal = actualWinsTotal(nextRounds, playerIds);
  if (actualTotal > BigInt(TOTAL_ACTUAL_WINS))
    throw new Error(
      `Actual wins across the game cannot exceed ${TOTAL_ACTUAL_WINS}. Distribute the remaining wins among the players.`,
    );
  if (
    nextRounds.every((round) => round.saved) &&
    actualTotal !== BigInt(TOTAL_ACTUAL_WINS)
  )
    throw new Error(
      `The game is complete only when all players' actual wins total exactly ${TOTAL_ACTUAL_WINS}.`,
    );
  return nextRounds;
}
export const actualWinsTotal = (rounds: Round[], playerIds: string[]) =>
  rounds.reduce(
    (total, round) =>
      total +
      (round.saved
        ? playerIds.reduce(
            (roundTotal, id) =>
              roundTotal +
              (validActual(round.entries[id]?.actual ?? '')
                ? BigInt(round.entries[id].actual)
                : 0n),
            0n,
          )
        : 0n),
    0n,
  );
export const cumulative = (rounds: Round[], id: string) =>
  rounds.reduce(
    (total, round) => total + (round.saved ? score(round.entries[id]) : 0n),
    0n,
  );
