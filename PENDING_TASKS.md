# Pending Tasks

Last updated: 2026-10-12. Security findings that are still open are tracked privately in
`private/SECURITY_AUDIT.md` (gitignored, local only).

## UI / UX

- [ ] **Consistent screens**: some screens show two stacked headers (the navigator's plus the screen's own); the "+" button is bottom-right on Leagues but top-right elsewhere; dialogs use three different styles. Pick one header, one FAB position, one modal style.
- [ ] **Home tiles** grow very large on wide browser windows; cap tile size / max content width (`utils/layouts.ts`).
- [ ] **Self-notifications**: users get notified about actions they did themselves (e.g. adding their own play group to a tournament). Skip the actor when creating notifications.
- [ ] **Life counter reset** has no confirmation; one stray tap wipes the game.
- [ ] **Silent successes on web**: "Member added" etc. use `Alert.alert`, which does nothing on web. Use a toast or rely on the list updating.
- [ ] **League standings table**: "W-D-L" and "Actions" column headers run together.
- [ ] **Starts/Started date** wording and format could be unified across league list and detail.

## Features / logic

- [ ] **Commander tournaments** (4-player pods): no automatic completion/champion and no bye resolution (`resolveByes` skips them).
- [ ] **League standings source of truth**: standings are recalculated from tournament results every time the league is opened (DB writes on a GET), overwriting manual edits for players who have results. Decide manual vs computed; if computed, recalculate when a result is reported instead.
- [ ] **`seed.ts` is broken**: its entity list is missing `Notification` (and `PlayGroup`, `LeagueParticipant`), so it crashes on start.
- [ ] **Offline sync hook** (`useOfflineSync`) is not mounted anywhere and nothing calls `storage.queueMutation`.
- [ ] Add a user search endpoint so the player dropdowns can find people outside your play groups.

## Engineering

- [ ] Replace `synchronize: true` with TypeORM migrations before any production deploy.
- [ ] `npm audit` (2026-10-12, after non-breaking fixes): API 23 moderate, all dev tooling (jest/ts-jest/autocannon), 0 in production deps. Client 35 (23 high, 12 moderate), all in the Expo/React Native build toolchain (metro, @expo/cli, config plugins); needs an Expo SDK major upgrade (54 → current) and a full app re-test.
- [ ] Remove unused deps now that local auth is gone: `passport-local`, `@nestjs/jwt`, `@types/passport-local`.
- [ ] Move `API_URL` and Cognito IDs into env (`EXPO_PUBLIC_*` / API `.env`) and add `.env.example`.
- [ ] CI (GitHub Actions): lint, test, `npm audit --audit-level=high` per app.
- [ ] Root README with setup steps (see `CONTEXT.md` for the current ones).
- [ ] e2e tests for ownership checks (403) on every mutating endpoint.
