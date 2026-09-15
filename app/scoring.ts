export const ROUND_COUNT = 5;
export const MAX_ACTUAL_WINS = 13;
export type Entry = { bid: string; actual: string };
export type Round = { entries: Record<string, Entry>; saved: boolean };
export const validBid = (value: string) => /^\d+$/.test(value);
export const validActual = (value: string) =>
  /^\d+$/.test(value) && BigInt(value) <= BigInt(MAX_ACTUAL_WINS);
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
      `Enter a non-negative whole-number bid and actual wins from 0–${MAX_ACTUAL_WINS} for every player.`,
    );
  if (rounds.slice(0, index).some((r) => !r.saved))
    throw new Error('Save the earlier rounds first.');
  return rounds.map((r, i) =>
    i === index ? { entries: structuredClone(entries), saved: true } : r,
  );
}
export const cumulative = (rounds: Round[], id: string) =>
  rounds.reduce(
    (total, round) => total + (round.saved ? score(round.entries[id]) : 0n),
    0n,
  );
