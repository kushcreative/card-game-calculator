# Card Game Calculator

A complete, responsive card-game scoring companion with a forest-green/black interface, editable players, instant round scoring, saved totals, history, and a gold-accented final result.

## Start a game

The app opens with **zero players**, no scores, no history, and an empty, unsaved Round 1. Click **Add Player** to enter each name (up to 12 players). Names can be edited directly on player cards; use the X button to remove a player.

Choose **3, 4, 5, 6, or 7 rounds** in Settings; a new game defaults to 5. Settings also offers **Easy** and **Hard** scoring, with Easy selected by default. Changing the scoring mode recalculates scores without changing players, bids, Actual Won values, rounds, or saved data. Enter each player's Bid and Actual Won, then choose **Save Round**. Saving validates all entries, records the round, updates cumulative totals, and advances to the next round. Standings reflect saved rounds only. Earlier rounds can be reviewed and updated without double-counting their scores.

Each round has its own Actual Won state and starts at 0. With exactly four players, a round completes when their combined Actual Won total equals 13. Other player counts keep their standard input validation without a combined target. Saving a valid round automatically opens the next independent round, and no previous Bid or Actual Won values carry forward. Saving the last selected round displays the final ranking, winner (or tied winners), final score, and winner margin. **Reset Game** and **Play Again** ask for confirmation, clear every player and score, restore the default 5 rounds, and return to a completely empty Round 1.

## Scoring modes

Easy Mode preserves the original scoring formula exactly:

| Condition        | Round score                                  | Example    |
| ---------------- | -------------------------------------------- | ---------- |
| Actual Won > Bid | Bid + Actual Won                             | 1 / 4 → +5 |
| Actual Won < Bid | Actual Won − Bid                             | 4 / 1 → −3 |
| Actual Won = Bid | Bid + Actual Won (existing exact-match rule) | 2 / 2 → +4 |

Hard Mode uses a separate exact, precision-safe formula:

| Condition        | Round score                      | Example     |
| ---------------- | -------------------------------- | ----------- |
| Actual Won = Bid | Bid                              | 5 / 5 → 5   |
| Actual Won < Bid | −Bid                             | 5 / 4 → −5  |
| Actual Won > Bid | Bid + ((Actual Won − Bid) × 0.1) | 5 / 7 → 5.2 |

Bids and actual wins are separate non-negative whole-number values. Every individual Bid is unlimited, and neither a Bid nor the sum of all Bids is compared with 13. Each player's actual wins retain the 0–13 limit. Only an exactly four-player table limits the combined current-round Actual Won total to 13 and requires exactly 13 before saving; the input rejects any edit that would take that total above 13. Every other player count can save without that combined target. All following rounds begin again at 0 Actual Won while saved Round Scores and Total Scores remain intact. Empty and invalid entries cannot be saved. Zero / zero scores zero. Easy and Hard scoring functions, bid and actual-win validators, four-player Actual Won validation, selectable round-count validation, and cumulative total calculation are isolated in `app/scoring.ts` for future scoring modes.

## Install and run

Use Node.js **22.13 or newer** and npm. All required packages are declared in `package.json`; `package-lock.json` pins the installation.

```sh
npm install
npm run dev
```

Open the local URL printed by the development server (normally `http://localhost:3000`). No API key or environment secret is required. Game state is kept in memory for the current browser session; refreshing the page starts an empty game. Accounts, shared storage, and cross-device synchronization are not implemented.

## Checks

```sh
npm run check
npm run lint
npm run test
npm run build
```

The tests cover the unchanged Easy formula, every supplied Hard Mode example, precision-safe decimal scoring, the 3–7 round selector and 5-round default, independent zeroed Actual Won state, the four-player Actual input cap and completion target, non-four-player totals without the target, unlimited individual and combined Bids, invalid inputs, progression, and preserved cumulative totals.

## Production

```sh
npm run build
npm run start
```

This project uses React 19, TypeScript, Vinext/Vite, Tailwind CSS, the existing Shadcn/Base UI components, and Lucide icons. The production build emits a Cloudflare-compatible Worker and client assets to `dist/`. The start command serves the built Worker locally through Wrangler; it does not publish to a hosting account.

The existing Sites deployment is configured in `.openai/hosting.json`. Its project ID is a non-secret hosting identifier; publishing requires separate authorized hosting access. Do not change it to deploy to another person's project. For independent hosting, configure your own deployment target. No hosting credentials are stored in this repository.

## Source layout

- `app/page.tsx`: complete game interface and interaction flow.
- `app/scoring.ts`: rules and round data operations.
- `app/game-tools.ts`: optional browser WebMCP integration, feature-detected.
- `app/globals.css`: existing premium dark styling and responsive layout.
- `components/ui/`, `lib/`: shared interface primitives and helpers used by the app.
- `public/`: application icon.
- `tests/`: automated scoring and game-state checks.

Dependencies, generated output, local environment files, private keys, and temporary files are excluded by `.gitignore`.
