# Project Context (for picking up work)

Last session: 2026-10-12. Branch `security-fixes` (ahead of `main`, pushed to `origin/security-fixes`, not merged; see `git log main..security-fixes`).

## What this is

Magic G.O.A.T — Magic: The Gathering play-group / tournament / league app.

- `apps/api` — NestJS 11 + TypeORM 0.3 + PostgreSQL. Auth = AWS Cognito JWTs verified via JWKS (`auth/jwt.strategy.ts`). Socket.io gateway in `events/`.
- `apps/client` — Expo 54 / React Native (web + mobile). Cognito via Amplify (`aws-config.ts`). API base in `config.ts` (`http://localhost:3000`, `10.0.2.2` on Android emulator).

## Conventions established

- **Authorization**: every mutating route calls `<service>.assertOwner(id, req.user.id)` before acting; every read-by-id route calls `<service>.assertCanView(id, req.user.id)` (owner or member). Notifications are scoped by `userId` in the query.
- **Tokens**: only Cognito ID tokens for this app client (`auth/cognito.ts` holds pool/client IDs; `verifyIdToken` is used by the socket gateway, `JwtStrategy` by HTTP).
- **Sockets**: client sends the ID token as `auth.token` (`hooks/useSocket.ts`); server joins `user_<id>` on connect and checks membership on `join_tournament`.
- **CORS**: `src/cors.ts`, allowlist from `CORS_ORIGINS` (comma-separated, default `http://localhost:8081`). Use `localhost`, not `127.0.0.1`, for the web client.
- **Users**: `findOrCreateUser` (users.service.ts) matches by Cognito `sub`; links by email only if `email_verified`. `password_hash` and `email` are `select: false`.
- **Validation**: every body/query is a DTO class (`<module>/dto.ts`, `class-validator`); global `ValidationPipe({ whitelist: true, transform: true })` in `main.ts`. Malformed UUIDs become 400 via `query-error.filter.ts`. New routes need a DTO, or the pipe skips validation.
- **Errors (API)**: throw Nest HTTP exceptions with a user-readable message — never `throw new Error(...)` (becomes a 500).
- **Errors (client)**: on a failed fetch use `showApiError(res, 'Could not …')`; on a thrown fetch use `showError(NETWORK_ERROR)` (`utils/errors.ts`). Works on web.
- **UI**: no stack header (each screen draws its own header + back button); create "+" goes top-right in the header; dialogs use `utils/modalStyles.ts`; destructive actions use `confirmAction` (`utils/errors.ts`); no success popups when a list visibly updates.
- **Notifications**: pass the actor as the last arg of `NotificationsService.create`; it skips notifying them.
- **League standings**: stored totals = tournament results + owner adjustment (`adj_*` columns). `applyResults`/`setTotals` in `leagues.service.ts`; PATCH sets totals (stored as diff), DELETE `.../standings/:userId/adjustments` resets. Tournaments link to a league at creation (`leagueId`, league owner only).
- **Join requests**: `join-requests/` module (entity with nullable tournament/league FK). `POST /:kind/:id/join` asks, owner uses `GET /:kind/:id/join-requests` and `POST .../:requestId/approve|decline`. Client: `components/JoinWithCode.tsx` (list headers), `components/JoinRequests.tsx` (owner, detail screens). Express 5: no regex route params, use separate routes.
- **Pick lists**: `components/Dropdown.tsx` + `hooks/useMyPlayGroups.ts` (players/groups from the caller's play groups).
- **Dates**: date-only strings via `utils/dates.ts` (`todayLocal`, `formatDateOnly`, `isValidDateOnly`).
- **Brackets**: `TournamentsService.resolveByes` advances winners/byes and sets COMPLETED; runs after bracket generation and every result. Commander goes through `resolveCommanderPods` (pods send 2 on, final 1; results are seat lists like `p1_p3` / `p3_win`, see `resultSeats`/`seatsResult` in `pairing.entity.ts`).

## Running locally

Docker/PostgreSQL are not installed on this PC. Last session used a throwaway portable Postgres:

```bash
# in any scratch folder (outside the repo)
npm i embedded-postgres@17.4.0-beta.15
# start script: user mtg_user / mtg_password, db mtg_db, port 5432 (see docker-compose.yml values)
```

Or `docker compose up -d` if Docker is installed. Then:

```bash
cd apps/api && npx nest start --watch          # http://localhost:3000
cd apps/client && npx expo start --web --port 8081
```

- Don't set `CI=1` for Expo — it disables file watching (stale bundle).
- On Windows, stopping a background `npx` shell can leave the `node` child holding ports 3000/8081.
- `seed.ts` is broken (see PENDING_TASKS.md); insert test users directly if needed.
- Sign-in uses the real Cognito pool, so test with a real account.

## Tests

- API: `cd apps/api && npx jest src` — users.service.spec (account-takeover cases), tournaments.service.spec (bye resolution, completion, view check), events.gateway.spec (socket auth + room check), validation.spec (DTOs + invalid-ID filter).
- Type-check: `npx tsc --noEmit -p tsconfig.json` in each app.
- Browser testing on web: `window.alert`/`confirm` block automation; override them first (`window.alert = m => console.log(m)`).
- If the Chrome window is in the background, screenshots time out and `requestAnimationFrame` stops, so modals look stuck open. Measure via the DOM, or bring the window to the front. To test widths, load the app in a same-origin iframe of the wanted width.

## Where things are tracked

- `CHANGELOG.md` — what changed.
- `PENDING_TASKS.md` — what's left (UI, features, engineering).
- `private/SECURITY_AUDIT.md` — full audit + open security items (gitignored, local only).
