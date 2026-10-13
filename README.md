# Magic G.O.A.T

App for Magic: The Gathering play groups: tournaments (1v1 single elimination and 4-player Commander pods), leagues with standings, a life counter, and notifications.

| Part | Stack | Folder |
| --- | --- | --- |
| API | NestJS 11, TypeORM, PostgreSQL, Socket.io | `apps/api` |
| App | Expo 54 / React Native (web, iOS, Android) | `apps/client` |
| Sign-in | AWS Cognito (the API only verifies Cognito ID tokens) | |

## Requirements

- Node.js 20.12 or newer (developed on 24)
- PostgreSQL 15+ (Docker is easiest; see below)
- A Cognito account in the configured user pool (sign up from the app)

## Run it locally

```bash
# 1. Database (only the postgres service is needed)
docker compose up -d postgres

# 2. API on http://localhost:3000
cd apps/api
npm install
npm run start:dev

# 3. App on http://localhost:8081 (in another terminal)
cd apps/client
npm install
npx expo start --web --port 8081
```

Open <http://localhost:8081> (use `localhost`, not `127.0.0.1`: the API only allows listed browser origins) and sign up or sign in.

The database schema is created automatically on start (`synchronize`; development only).

### Test data

Sign in once, then:

```bash
cd apps/api
SEED_OWNER=<your username> npm run seed
```

This adds 8 test players (`player1`-`player8`) and a play group and league owned by you that contain them, so they show up in the "add player" pickers. The test players can't sign in.

## Configuration

Everything works with the defaults. To change something, copy the example file and edit it:

- `apps/api/.env.example` → `apps/api/.env`: port, Postgres, Cognito pool/client, allowed browser origins (`CORS_ORIGINS`). Real environment variables take precedence over the file.
- `apps/client/.env.example` → `apps/client/.env`: API URL (`EXPO_PUBLIC_API_URL`, e.g. your computer's LAN address when testing on a phone) and Cognito settings. Restart Expo after changing it. These values are built into the app, so never put secrets there.

## Tests

```bash
cd apps/api
npx jest src                         # unit tests
npx tsc --noEmit -p tsconfig.json    # type-check (also in apps/client)
```

## Project docs

- `CHANGELOG.md`: what changed
- `PENDING_TASKS.md`: what's left
- `CONTEXT.md`: conventions and notes for working on the code
- `aws_migration_plan.md`: deployment plan

Before deploying to production, replace TypeORM `synchronize` with migrations (see `PENDING_TASKS.md`).
