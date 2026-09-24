export const ALLOWED_ROUND_COUNTS = [3, 4, 5, 6, 7] as const;
export const DEFAULT_ROUND_COUNT = 5;
export const DEFAULT_SCORING_MODE = 'easy' as const;
export const MAX_ACTUAL_WINS = 13;
export const ROUND_TARGET = 13;
export type ScoringMode = 'easy' | 'hard';
export type Entry = { bid: string; actual: string };
export type Round = { entries: Record<string, Entry>; saved: boolean };
export const validRoundCount = (value: number) =>
  ALLOWED_ROUND_COUNTS.includes(value as (typeof ALLOWED_ROUND_COUNTS)[number]);
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

// Hard-mode scores are stored in tenths so decimal results stay exact even
// when bids are larger than JavaScript's safe integer range.
export function hardScoreInTenths(entry?: Entry) {
  if (!entry || !validBid(entry.bid) || !validActual(entry.actual)) return 0n;
  const bid = BigInt(entry.bid),
    actual = BigInt(entry.actual);
  if (actual === bid) return bid * 10n;
  if (actual < bid) return -bid * 10n;
  return bid * 10n + (actual - bid);
}

export function scoreInTenths(
  entry?: Entry,
  mode: ScoringMode = DEFAULT_SCORING_MODE,
) {
  return mode === 'hard' ? hardScoreInTenths(entry) : score(entry) * 10n;
}
export const blankEntry = (): Entry => ({ bid: '', actual: '0' });
export const blankRound = (playerIds: string[] = []): Round => ({
  entries: Object.fromEntries(playerIds.map((id) => [id, blankEntry()])),
  saved: false,
});
export const newGame = (
  roundCount = DEFAULT_ROUND_COUNT,
  playerIds: string[] = [],
) => {
  if (!validRoundCount(roundCount))
    throw new Error('Choose 3, 4, 5, 6, or 7 rounds.');
  return Array.from({ length: roundCount }, () => blankRound(playerIds));
};
export const roundActualTotal = (
  entries: Record<string, Entry>,
  playerIds: string[],
) =>
  playerIds.reduce(
    (total, id) =>
      total +
      (validActual(entries[id]?.actual ?? '')
        ? BigInt(entries[id].actual)
        : 0n),
    0n,
  );
export function actualEditAllowed(
  entries: Record<string, Entry>,
  playerIds: string[],
  playerId: string,
  value: string,
) {
  if (value !== '' && !validActual(value)) return false;
  if (playerIds.length !== 4) return true;
  return (
    playerIds.reduce((total, id) => {
      const actual = id === playerId ? value : (entries[id]?.actual ?? '');
      return total + (validActual(actual) ? BigInt(actual) : 0n);
    }, 0n) <= BigInt(ROUND_TARGET)
  );
}
export const roundComplete = (
  entries: Record<string, Entry>,
  playerIds: string[],
) =>
  playerIds.length !== 4 ||
  roundActualTotal(entries, playerIds) === BigInt(ROUND_TARGET);
export function commitRound(
  rounds: Round[],
  index: number,
  playerIds: string[],
  entries: Record<string, Entry>,
) {
  if (!validRoundCount(rounds.length))
    throw new Error('The game must contain 3 to 7 rounds.');
  if (!Number.isInteger(index) || index < 0 || index >= rounds.length)
    throw new Error('Invalid round.');
  if (
    !playerIds.length ||
    new Set(playerIds).size !== playerIds.length ||
    playerIds.some(
      (id) =>
        !entries[id] ||
        !validBid(entries[id].bid) ||
        !validActual(entries[id].actual),
    )
  )
    throw new Error(
      `Use each player once and enter a non-negative whole-number bid and actual wins from 0–${MAX_ACTUAL_WINS} for every player.`,
    );
  if (rounds.slice(0, index).some((r) => !r.saved))
    throw new Error('Save the earlier rounds first.');
  if (playerIds.length === 4 && !roundComplete(entries, playerIds))
    throw new Error(
      `Actual Won must total exactly ${ROUND_TARGET} for this round. Current total: ${roundActualTotal(entries, playerIds)} / ${ROUND_TARGET}.`,
    );
  return rounds.map((r, i) =>
    i === index ? { entries: structuredClone(entries), saved: true } : r,
  );
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
export const cumulativeInTenths = (
  rounds: Round[],
  id: string,
  mode: ScoringMode = DEFAULT_SCORING_MODE,
) =>
  rounds.reduce(
    (total, round) =>
      total + (round.saved ? scoreInTenths(round.entries[id], mode) : 0n),
    0n,
  );
