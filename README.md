# Card Game Calculator

A complete, responsive card-game scoring companion with a forest-green/black interface, editable players, instant round scoring, saved totals, history, and a gold-accented final result.

## Start a game

The app opens with **zero players**, no scores, no history, and an empty, unsaved Round 1. Click **Add Player** to enter each name (up to 12 players). Names can be edited directly on player cards; use the X button to remove a player.

The game has exactly **Round 1 → Round 2 → Round 3 → Round 4 → Round 5 → Final Result**. Enter each player's Bid and Actual Won, then choose **Save Round**. Saving validates all entries, records the round, updates cumulative totals, and advances to the next round with empty inputs. Standings reflect saved rounds only. Earlier rounds can be reviewed and updated without double-counting their scores.

Saving Round 5 displays the final ranking, winner (or tied winners), final score, and winner margin. There is no Round 6. **Reset Game** and **Play Again** ask for confirmation, clear every player and score, and return to a completely empty Round 1.

## Scoring

| Condition        | Round score                                  | Example    |
| ---------------- | -------------------------------------------- | ---------- |
| Actual Won > Bid | Bid + Actual Won                             | 1 / 4 → +5 |
| Actual Won < Bid | Actual Won − Bid                             | 4 / 1 → −3 |
| Actual Won = Bid | Bid + Actual Won (existing exact-match rule) | 2 / 2 → +4 |

Bids are non-negative whole numbers with no game-imposed maximum. Actual wins are whole numbers from 0 through 13 and stop at 13. Empty and invalid entries cannot be saved. Zero / zero scores zero. The separate bid and actual-win validators, scoring rules, five-round limit, and cumulative total calculation are isolated in `app/scoring.ts` for future special-case changes.

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

The tests cover both supplied scoring examples, the 13-win maximum, uncapped and precision-safe bids, exact matches, invalid inputs, five-round progression, total replacement when editing a saved round, and empty state.

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
