# Pending Tasks

Last updated: 2026-10-12. Security findings that are still open are tracked privately in
`private/SECURITY_AUDIT.md` (gitignored, local only).

## UI / UX

- [ ] Detail screens still inline their own web/native confirm branches; switch them to `confirmAction` (`utils/errors.ts`) when touching them.
- [ ] `InvitationsScreen` is registered but nothing navigates to it (and it has no back button now that the stack header is off). Link it from Notifications or remove it.
- [ ] Visual check on a real phone (native) of the header/modal changes; web was verified.

## Features / logic

- [ ] League standings recalculate on every GET (members only). Fine at this size; recalculate on result/delete instead if leagues grow large.

## Engineering

- [ ] Replace `synchronize: true` with TypeORM migrations before any production deploy.
- [ ] `npm audit` (2026-10-12, after non-breaking fixes): API 23 moderate, all dev tooling (jest/ts-jest/autocannon), 0 in production deps. Client 35 (23 high, 12 moderate), all in the Expo/React Native build toolchain (metro, @expo/cli, config plugins); needs an Expo SDK major upgrade (54 → current) and a full app re-test.
- [ ] CI (GitHub Actions): lint, test, `npm audit --audit-level=high` per app.
- [ ] e2e tests for ownership checks (403) on every mutating endpoint.
