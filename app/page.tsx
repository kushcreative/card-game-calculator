'use client';
import { useState } from 'react';
import { useGameTools } from './game-tools';
import {
  ALLOWED_ROUND_COUNTS,
  DEFAULT_ROUND_COUNT,
  ROUND_TARGET,
  validBid,
  validActual,
  score,
  newGame,
  commitRound,
  cumulative,
  roundActualTotal,
  type Entry,
  type Round,
} from './scoring';
import {
  Spade,
  Settings,
  RotateCcw,
  Users,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  Trophy,
  History,
  ArrowUpRight,
  Crown,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
type Player = { id: string; name: string };
const empty = (): Entry => ({ bid: '', actual: '0' });

const signed = (n: bigint) => (n > 0n ? `+${n}` : String(n));
const tone = (n: bigint) =>
  n > 0n ? 'positive' : n < 0n ? 'negative' : 'neutral';
export default function Home() {
  const [roundCount, setRoundCount] = useState(DEFAULT_ROUND_COUNT);
  const [players, setPlayers] = useState<Player[]>([]),
    [rounds, setRounds] = useState<Round[]>(() => newGame(roundCount)),
    [index, setIndex] = useState(0),
    [saved, setSaved] = useState<Round[]>(() => newGame(roundCount)),
    [final, setFinal] = useState(false);
  const [modal, setModal] = useState<'add' | 'settings' | null>(null),
    [name, setName] = useState(''),
    [reset, setReset] = useState(false),
    [removing, setRemoving] = useState<string | null>(null),
    [all, setAll] = useState(true),
    [notice, setNotice] = useState(''),
    [error, setError] = useState('');
  const round = rounds[index];
  const total = (id: string) => cumulative(saved, id);
  const completed = saved.filter((r) => r.saved).length;
  const finished = completed === roundCount;
  const playerIds = players.map((player) => player.id);
  const currentActual = roundActualTotal(round.entries, playerIds);
  const firstOpen = saved.findIndex((r) => !r.saved);
  const canVisit = (i: number) =>
    i >= 0 && i < roundCount && (firstOpen === -1 || i <= firstOpen);
  function navigate(i: number) {
    if (canVisit(i)) {
      setIndex(i);
      setFinal(false);
      setError('');
      setNotice('');
    }
  }
  function record(entries: Record<string, Entry>) {
    const next = commitRound(
      saved,
      index,
      players.map((p) => p.id),
      entries,
    );
    setSaved(next);
    setRounds((rs) => rs.map((r, i) => (i === index ? next[i] : r)));
    const gameComplete = next.every((savedRound) => savedRound.saved);
    setNotice(
      gameComplete
        ? `Round ${index + 1} saved. Game complete.`
        : `Round ${index + 1} saved. Round ${index + 2} is ready.`,
    );
    setError('');
    if (gameComplete) {
      setFinal(true);
    } else {
      setIndex(index + 1);
    }
  }
  function chooseRoundCount(nextCount: number) {
    if (nextCount === roundCount) return;
    const playerIds = players.map((player) => player.id);
    setRoundCount(nextCount);
    setRounds(newGame(nextCount, playerIds));
    setSaved(newGame(nextCount, playerIds));
    setIndex(0);
    setFinal(false);
    setNotice(`New ${nextCount}-round game ready`);
    setError('');
  }
  const ranked = [...players].sort((a, b) => {
    const difference = total(b.id) - total(a.id);
    return difference > 0n ? 1 : difference < 0n ? -1 : 0;
  });
  const leaders = ranked.filter((p) => total(p.id) === total(ranked[0]?.id));
  useGameTools(
    () => ({
      players,
      rounds,
      currentRound: index + 1,
      totals: players.map((p) => ({
        ...p,
        total: total(p.id).toString(),
      })),
    }),
    (input) => {
      const data = input as {
        entries?: {
          playerId: string;
          bid: number | string;
          actual: number | string;
        }[];
      };
      if (
        !data ||
        !Array.isArray(data.entries) ||
        data.entries.length !== players.length ||
        !players.length
      )
        throw new Error('Supply exactly one entry for each current player.');
      const entries: Record<string, Entry> = {};
      for (const e of data.entries) {
        if (
          !e ||
          !players.some((p) => p.id === e.playerId) ||
          entries[e.playerId] ||
          !(
            (typeof e.bid === 'number' &&
              Number.isSafeInteger(e.bid) &&
              e.bid >= 0) ||
            (typeof e.bid === 'string' && validBid(e.bid))
          ) ||
          !(
            (typeof e.actual === 'number' &&
              Number.isSafeInteger(e.actual) &&
              e.actual >= 0) ||
            (typeof e.actual === 'string' && validActual(e.actual))
          )
        )
          throw new Error('Invalid player or score.');
        entries[e.playerId] = { bid: String(e.bid), actual: String(e.actual) };
      }
      record(entries);
      return { round: index + 1, saved: true };
    },
  );
  function edit(id: string, key: keyof Entry, value: string) {
    const isValid = key === 'bid' ? validBid(value) : validActual(value);
    if (value !== '' && !isValid) return;
    setRounds((rs) =>
      rs.map((r, i) =>
        i === index
          ? {
              saved: false,
              entries: {
                ...r.entries,
                [id]: { ...(r.entries[id] || empty()), [key]: value },
              },
            }
          : r,
      ),
    );
    setNotice('');
    setError('');
  }
  function save() {
    try {
      record(round.entries);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function add() {
    if (players.length >= 12) {
      setError('The table supports up to 12 players.');
      return;
    }
    const clean = name.trim();
    if (!clean) {
      setError('Enter a player name.');
      return;
    }
    if (players.some((p) => p.name.toLowerCase() === clean.toLowerCase())) {
      setError('This player is already at the table.');
      return;
    }
    const player = { id: crypto.randomUUID(), name: clean };
    setPlayers((ps) => [...ps, player]);
    const addEntry = (gameRounds: Round[]) =>
      gameRounds.map((gameRound) =>
        gameRound.saved
          ? gameRound
          : {
              ...gameRound,
              entries: { ...gameRound.entries, [player.id]: empty() },
            },
      );
    setRounds(addEntry);
    setSaved(addEntry);
    setModal(null);
    setName('');
    setError('');
  }
  return (
    <main className="app">
      <header className="top">
        <div className="brand">
          <div className="brand-icon">
            <Spade size={28} fill="currentColor" />
          </div>
          <div>
            <h1>Card Game Calculator</h1>
            <p>
              {roundCount} Rounds <span>•</span> Track Scores <span>•</span>{' '}
              Find the Winner
            </p>
          </div>
        </div>
        <div className="actions">
          <button onClick={() => setModal('settings')}>
            <Settings size={16} />
            Settings
          </button>
          <button onClick={() => setReset(true)}>
            <RotateCcw size={16} />
            Reset Game
          </button>
        </div>
      </header>
      <div className="session">
        <span>
          <i />{' '}
          {finished
            ? 'GAME COMPLETE'
            : players.length
              ? 'GAME IN PROGRESS'
              : 'READY TO PLAY'}
        </span>
        <span className="suits">
          ♠ <b>♥</b> ♣ <b>♦</b>
        </span>
      </div>
      <section className="panel players-panel">
        <div className="section-head">
          <h2>
            <Users />
            Players <span className="count">({players.length})</span>
          </h2>
          <span className="hint">Click a name to rename</span>
        </div>
        <div className="players">
          {players.map((p, i) => (
            <div className="player-card" key={p.id}>
              <span className={`avatar color-${i % 6}`}>
                {p.name[0]?.toUpperCase()}
              </span>
              <input
                aria-label={`Rename ${p.name}`}
                maxLength={24}
                value={p.name}
                onChange={(e) =>
                  setPlayers((ps) =>
                    ps.map((x) =>
                      x.id === p.id ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
                onBlur={() =>
                  setPlayers((ps) =>
                    ps.map((x) =>
                      x.id === p.id
                        ? { ...x, name: x.name.trim() || 'Player' }
                        : x,
                    ),
                  )
                }
              />
              <button
                className="icon remove"
                disabled={finished}
                aria-label={`Remove ${p.name}`}
                onClick={() => setRemoving(p.id)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            className="add-player"
            disabled={players.length >= 12 || finished}
            onClick={() => {
              setName('');
              setError('');
              setModal('add');
            }}
          >
            <Plus size={17} />
            Add Player
          </button>
        </div>
      </section>
      {final && finished ? (
        <section className="panel final-result">
          <span className="eyebrow">{roundCount} ROUNDS. ONE GREAT GAME.</span>
          <div className="trophy-halo">
            <Trophy size={58} strokeWidth={1.2} />
          </div>
          <p>FINAL RESULT</p>
          <h2>{leaders.length > 1 ? 'WINNERS' : 'WINNER'}</h2>
          <h3>{leaders.map((p) => p.name).join(' & ')}</h3>
          <div className="final-points">
            Final Score: {leaders.length ? total(leaders[0].id) : 0} points
          </div>
          <div className="final-stats">
            <span>
              Total Rounds: <b>{roundCount}</b>
            </span>
            <span>
              Winner Margin:{' '}
              <b>
                {ranked.length > 1
                  ? total(ranked[0].id) - total(ranked[1].id)
                  : 0}{' '}
                points
              </b>
            </span>
          </div>
          <div className="final-ranks">
            {ranked.map((p) => (
              <div key={p.id}>
                <span>
                  {ranked.findIndex((x) => total(x.id) === total(p.id)) + 1}
                </span>
                <strong>{p.name}</strong>
                <b className={tone(total(p.id))}>
                  {total(p.id)} <small>pts</small>
                </b>
              </div>
            ))}
          </div>
          <div className="actions">
            <button className="primary" onClick={() => setReset(true)}>
              <RotateCcw size={17} />
              Play Again
            </button>
            <button
              onClick={() => {
                setFinal(false);
                setIndex(roundCount - 1);
              }}
            >
              Review Rounds
            </button>
          </div>
        </section>
      ) : (
        <section className="panel scoring">
          <div className="section-head">
            <div className="round-title">
              <span className="round-symbol">
                <Spade size={18} />
              </span>
              <h2>
                Round {index + 1} <span className="count">/ {roundCount}</span>
              </h2>
              <span className="badge">
                {round.saved ? 'Saved' : 'In progress'}
              </span>
            </div>
            <div className="actions">
              <div className="arrows">
                <button
                  className="icon"
                  aria-label="Previous round"
                  disabled={index === 0}
                  onClick={() => navigate(index - 1)}
                >
                  <ChevronLeft />
                </button>
                <span>
                  {index + 1} / {roundCount}
                </span>
                <button
                  className="icon"
                  aria-label="Next round"
                  disabled={!canVisit(index + 1)}
                  onClick={() => navigate(index + 1)}
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          </div>
          <nav className="round-steps" aria-label="Game rounds">
            {rounds.map((r, i) => (
              <button
                key={i}
                disabled={!canVisit(i)}
                onClick={() => navigate(i)}
                aria-current={i === index ? 'step' : undefined}
                className={
                  i === index ? 'active' : saved[i]?.saved ? 'done' : ''
                }
              >
                <span>
                  {saved[i]?.saved && i !== index ? <Check size={14} /> : i + 1}
                </span>
                <b>Round {i + 1}</b>
              </button>
            ))}
          </nav>
          <Table className="score-table">
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>
                  Bid <small>(How many)</small>
                </TableHead>
                <TableHead>
                  Actual Won <small>(How many won)</small>
                </TableHead>
                <TableHead>Round Score</TableHead>
                <TableHead>Total Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="person">
                      <span className={`dot color-${i % 6}`} />
                      {p.name}
                    </div>
                  </TableCell>
                  {(['bid', 'actual'] as const).map((key) => (
                    <TableCell key={key}>
                      <div className="number-field">
                        <input
                          className="number"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          aria-label={`${p.name} ${
                            key === 'actual' ? 'actual wins' : 'bid'
                          }`}
                          placeholder="0"
                          value={
                            round.entries[p.id]?.[key] ??
                            (key === 'actual' ? '0' : '')
                          }
                          onChange={(e) => edit(p.id, key, e.target.value)}
                          onFocus={(e) => {
                            if (
                              key === 'actual' &&
                              e.currentTarget.value === '0'
                            )
                              e.currentTarget.select();
                          }}
                        />
                      </div>
                    </TableCell>
                  ))}
                  <TableCell>
                    <span
                      className={`score ${tone(score(round.entries[p.id]))}`}
                    >
                      {signed(score(round.entries[p.id]))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <strong className={tone(total(p.id))}>{total(p.id)}</strong>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!players.length && (
            <p className="empty">
              Your table is empty. Add a player to get started.
            </p>
          )}
          <div className="score-footer">
            <div className="actions">
              <button className="primary" onClick={save}>
                <Check size={18} />
                Save Round
              </button>
              <button
                className="clear"
                onClick={() => {
                  setRounds((rs) =>
                    rs.map((r, i) =>
                      i === index
                        ? {
                            entries: Object.fromEntries(
                              players.map((player) => [player.id, empty()]),
                            ),
                            saved: false,
                          }
                        : r,
                    ),
                  );
                  setNotice('');
                  setError('');
                }}
              >
                Clear Inputs
              </button>
            </div>
            <div className="rules">
              <Info size={15} />
              <span>
                Actual ≥ Bid: <b className="positive">Bid + Actual</b>
              </span>
              <span className="rule-divider" />
              <span>
                Actual &lt; Bid: <b className="negative">Actual − Bid</b>
              </span>
              {players.length === 4 && (
                <>
                  <span className="rule-divider" />
                  <span>
                    Actual:{' '}
                    <b>
                      {currentActual.toString()} / {ROUND_TARGET}
                    </b>
                  </span>
                </>
              )}
            </div>
          </div>
          {(notice || error) && (
            <output className={`message ${error ? 'negative' : 'positive'}`}>
              {error || notice}
            </output>
          )}
        </section>
      )}
      <div className="results">
        <section className="panel scoreboard">
          <div className="section-head">
            <h2>
              <Trophy className="gold" />
              Scoreboard
            </h2>
            <span className="live">
              <i />
              Saved rounds
            </span>
          </div>
          <div className="ranking">
            {!players.length && (
              <p className="empty">Add players to see the standings.</p>
            )}
            {ranked.map((p, i) => (
              <div
                className={`rank-row ${total(p.id) === total(ranked[0].id) ? 'leader' : ''}`}
                key={p.id}
              >
                <span className="rank">
                  {i === 0 ? (
                    <Crown size={17} />
                  ) : (
                    ranked.findIndex((x) => total(x.id) === total(p.id)) + 1
                  )}
                </span>
                <span className={`avatar color-${players.indexOf(p) % 6}`}>
                  {p.name[0]?.toUpperCase()}
                </span>
                <strong>{p.name}</strong>
                {i === 0 && <span className="leader-label">LEADING</span>}
                <span className={`rank-score ${tone(total(p.id))}`}>
                  {total(p.id)} <small>pts</small>
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="winner">
          <div className="winner-top">
            <span>THE TABLE’S BEST</span>
            <ArrowUpRight size={17} />
          </div>
          <div className="trophy-halo">
            <Trophy size={52} strokeWidth={1.25} />
          </div>
          <p>
            {finished ? 'Final Winner' : 'Current Winner'}
            {leaders.length > 1 ? 's' : ''}
          </p>
          <h2>
            {leaders.length
              ? leaders.map((p) => p.name).join(' & ')
              : 'Up for grabs'}
          </h2>
          <span className="winner-points">
            {leaders.length
              ? `${total(leaders[0].id)} points`
              : 'Add your players'}
          </span>
          <div className="winner-bottom">
            <span />{' '}
            {leaders.length > 1
              ? 'Sharing the lead'
              : 'A little strategy. A little luck.'}{' '}
            <span />
          </div>
        </section>
      </div>
      <section className="panel history">
        <div className="section-head">
          <h2>
            <History />
            Round History{' '}
            <span className="count">
              ({saved.filter((r) => r.saved).length})
            </span>
          </h2>
          <button className="view-all" onClick={() => setAll(!all)}>
            {all ? 'Show Recent' : 'View All'}
            <ArrowUpRight size={15} />
          </button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Round</TableHead>
              {players.map((p) => (
                <TableHead key={p.id}>
                  {p.name} <small>(B/A)</small>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {saved
              .map((r, i) => ({ r, i }))
              .filter((x) => x.r.saved)
              .slice(all ? 0 : -3)
              .map(({ r, i }) => (
                <TableRow key={i}>
                  <TableCell>
                    <button
                      className="history-round"
                      onClick={() => {
                        navigate(i);
                        window.scrollTo({ top: 180, behavior: 'smooth' });
                      }}
                    >
                      Round {i + 1}
                    </button>
                  </TableCell>
                  {players.map((p) => (
                    <TableCell key={p.id}>
                      {r.entries[p.id] ? (
                        <>
                          {r.entries[p.id].bid} <span className="slash">/</span>{' '}
                          {r.entries[p.id].actual}{' '}
                          <span className={tone(score(r.entries[p.id]))}>
                            ({signed(score(r.entries[p.id]))})
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {!saved.filter((r) => r.saved).length && (
          <p className="empty">Saved rounds will appear here.</p>
        )}
      </section>
      <footer className="page-footer">
        <span>
          <Spade size={13} />
          Good company. Great games.
        </span>
        <span>Every round counts.</span>
      </footer>
      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setModal(null);
            setError('');
          }
        }}
      >
        <DialogContent className="game-dialog">
          <DialogTitle>
            {modal === 'add' ? 'Add a player' : 'Game settings'}
          </DialogTitle>
          <DialogDescription>
            {modal === 'add'
              ? 'Make room at the table.'
              : 'Scoring rules for this game'}
          </DialogDescription>
          {modal === 'add' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                add();
              }}
            >
              <label htmlFor="player-name">Player name</label>
              <input
                id="player-name"
                maxLength={24}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name"
              />
              <p className="negative">{error}</p>
              <button className="primary" type="submit">
                <Plus size={16} />
                Add Player
              </button>
            </form>
          ) : (
            <div className="settings-copy">
              <label htmlFor="round-count">Rounds in this game</label>
              <select
                id="round-count"
                value={roundCount}
                onChange={(event) =>
                  chooseRoundCount(Number(event.target.value))
                }
              >
                {ALLOWED_ROUND_COUNTS.map((count) => (
                  <option key={count} value={count}>
                    {count} rounds
                    {count === DEFAULT_ROUND_COUNT ? ' (default)' : ''}
                  </option>
                ))}
              </select>
              <small>
                Changing the round count starts a fresh scorecard and keeps the
                players at the table.
              </small>
              <p>
                When Actual Won is greater than or equal to Bid, score Bid +
                Actual Won. When Actual Won is lower, score Actual Won − Bid.
              </p>
              <p>
                An exact match uses the addition rule: a bid of 2 and actual of
                2 earns +4. Bids are non-negative whole numbers with no game
                cap. Bid values are never compared with the round target.
              </p>
              <p>
                Totals and standings include saved rounds only. Saving a valid
                round automatically advances through the selected {roundCount}{' '}
                rounds. Every new round starts at 0 Actual Won. This game lasts
                for this open session.
              </p>
              {players.length === 4 && (
                <p>Round completes when total Actual Won reaches 13.</p>
              )}
              <button onClick={() => setModal(null)}>Got it</button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={reset || removing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReset(false);
            setRemoving(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {reset ? 'Start a fresh game?' : 'Remove this player?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {reset
              ? `This clears all ${roundCount} rounds and scores, removes all player names, restores the default ${DEFAULT_ROUND_COUNT}-round game, and returns to Round 1.`
              : 'Their scores will be removed from all rounds and the standings.'}
          </AlertDialogDescription>
          <div className="actions">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (reset) {
                  setPlayers([]);
                  setName('');
                  setRoundCount(DEFAULT_ROUND_COUNT);
                  setRounds(newGame(DEFAULT_ROUND_COUNT));
                  setSaved(newGame(DEFAULT_ROUND_COUNT));
                  setIndex(0);
                  setFinal(false);
                } else {
                  setPlayers((ps) => ps.filter((p) => p.id !== removing));
                  const removeEntries = (rs: Round[]) =>
                    rs.map((r) => {
                      if (!r) return r;
                      const entries = { ...r.entries };
                      delete entries[removing!];
                      return { ...r, entries };
                    });
                  setRounds(removeEntries);
                  setSaved(removeEntries);
                }
                setReset(false);
                setRemoving(null);
                setNotice('');
                setError('');
              }}
            >
              {reset ? 'Reset Game' : 'Remove Player'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
