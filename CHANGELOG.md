# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed (2026-10-12, configuration)

- API and client read their settings from environment variables, with `.env.example` in each app. API: `PORT`, `POSTGRES_*`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `CORS_ORIGINS`, `SEED_OWNER` (loaded from `apps/api/.env` with Node's built-in loader; real env vars win). Client: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_COGNITO_*`, `EXPO_PUBLIC_AUTH_REDIRECT_URLS`. Defaults are the current dev values, so nothing changes without a `.env`.
- Removed `@nestjs/config` (it was only loading `.env`).

### Added (2026-10-12, offline + search)

- **Offline match results**: reporting a result with no connection saves it on the device, shows it right away and sends it automatically when the connection is back (on reconnect, app start, or the next time the tournament is opened). Your tournament list and each tournament you opened are kept on the device, so they open offline with an "Offline" banner. Results the server rejects later are dropped with a message.
- **Find any player**: the "Add" dialogs (tournament, league, play group) suggest matching players from the whole app as you type a username or U-ID (`GET /users/search`). Emails are never searched or shown.

### Fixed (2026-10-12, seed)

- `npm run seed` works again (it listed entities by hand and missed newer ones; it now loads all of them). It creates 8 test players; with `SEED_OWNER=<your username>` it also creates a play group and a league owned by you with those players. Removed the unusable admin/password user.
- Removed unused dependencies left from the old local login: `bcrypt`, `passport-local`, `@nestjs/jwt` (and their types).

### Added (2026-10-12, Commander standings)

- Commander tournaments in a league count toward standings: each player who wins a pod (moves on, or wins the final) gets 3 points and a win; the others in the pod get a loss. A short pod that moved on without playing counts like a bye (win in round 1 only).

### Fixed (2026-10-12, Commander)

- Commander results could not be saved (the result column only allowed 1v1 values); pod results are now stored.
- Commander pods showed only 2 of their 4 players (seats 3-4 were never loaded).
- Commander tournaments now finish: pods send two players on, the final pod picks one winner, the tournament becomes COMPLETED and shows a Champion banner. Pods with no more players than move on (byes) advance automatically.
- Picking winners in a different order no longer changes the result (seats are normalized).

### Added (2026-10-12, join requests)

- **Join with a code, approved by the owner** (tournaments and leagues): owners see a join code and a list of pending requests (approve / decline) on the detail screen; anyone can paste a code from the Tournaments or Leagues list ("Join" button) to send a request. Owners are notified of new requests, requesters are notified of the answer. Tournaments only accept requests before they start and while there is room; asking twice doesn't create a second request.
- **Move a tournament into or out of a league** after creation (owner, from the tournament screen).

### Security (2026-10-12, join requests)

- `POST /tournaments/:id/join` no longer adds the caller directly; it creates a request the owner must approve.

### Added (2026-10-12, league standings)

- **Tournaments can belong to a league**: pick one of your leagues when creating a tournament, or use "New League Tournament" on the league screen. The league screen lists its tournaments, and a tournament shows its league. League members can open the league's tournaments.
- **Standings from results, with manual corrections**: standings are calculated from the league's tournament results. The owner can still edit a player's totals; the edit is saved as a correction on top of results, so new results keep counting and the edit is never overwritten. Edited rows show "· edited", and "Use results only" removes the correction. OMW% is always calculated.

### Fixed (2026-10-12, league standings)

- Manual standing edits were overwritten every time the league was opened.
- Players whose results disappeared (e.g. a tournament removed) kept stale standings.
- Walkovers through empty bracket branches counted as wins; only a first-round bye counts now.

### Changed (2026-10-12, UI pass)

- One header per screen: the navigator's header is off everywhere; each screen keeps its own title and back button (League list/detail, Create League, Tournament detail and Notifications showed two).
- The Leagues "+" button sits top-right in the header like Tournaments and Play Groups (was a floating button bottom-right).
- Dialogs on League, Play Group and Tournament screens share one style (`utils/modalStyles.ts`) and stay at most 420px wide on desktop (Play Group and Tournament dialogs stretched across the window). Tournament dialogs close with the Android back button.
- Home tiles follow the window size and are capped at 180px (were sized once at load, unbounded).
- League start dates read "Starts: …" or "Started: …" depending on the date, the same on the list and detail screens.
- Removed "Success" popups after adding a member, user or group; the list updating is the feedback (they never showed on web).

### Fixed (2026-10-12, UI pass)

- Life counter reset asks for confirmation first.
- Users are no longer notified about things they did themselves (e.g. adding themselves or their own play group).
- League standings: "W-D-L" and "Actions" column headers no longer run together.

### Security (2026-10-12, second pass)

- Reading a tournament (and its pairings), league (and its standings) or play group now requires signing in and being its owner or a member (403 otherwise). Standings are no longer recalculated for anonymous callers.
- Only Cognito ID tokens issued for this app's client are accepted (`aud` and `token_use` checked).
- Live updates (WebSocket) require a valid sign-in; sockets can only join tournament rooms the user belongs to.
- CORS allows only known browser origins (`CORS_ORIGINS`, default `http://localhost:8081`) and no longer sends credentials headers.
- The client no longer logs the Cognito session to the console.

- Every request body is validated (DTO classes + global `ValidationPipe`); unknown fields are dropped and bad values return 400 with a list of what is wrong. A malformed ID returns 400 "Invalid ID." instead of 500.
- CSV export quotes every field and neutralises values that spreadsheets would run as formulas (e.g. a username starting with `=`). Export filenames are reduced to safe characters, so a tournament name can no longer break the download header (was a 500).
- User `custom_id` is unique in the database; a rare collision on sign-up is re-rolled instead of failing.
- Dependencies: applied all non-breaking `npm audit` fixes. API production dependencies now report 0 vulnerabilities (was 74 total incl. 2 critical); client 73 → 35 with 0 critical. Expo 54.0.27 → 54.0.37, expo-font 14.0.10 → 14.0.12.

### Fixed (2026-10-12, second pass)

- Real-time invitations never arrived: nothing joined the `user_<id>` room, and the socket hook never re-rendered with its connection. Sockets now join the user's room on connect.

### Security (2026-10-12)

- Cognito users are matched by their token `sub` only; an existing account is linked by email only when Cognito reports the email as verified (unverified collisions return 409). Prevents taking over an account by registering the same username.
- Ownership checks on every tournament, league and play group change (403 for non-owners); match results are scoped to their tournament; league edits limited to name, description and dates; notifications scoped to their recipient.
- A play group's owner is always the signed-in user.
- `password_hash` and `email` are no longer returned in any response.
- Removed the unused local username/password login and its hard-coded JWT secret.
- Stopped tracking `node_modules`, `dist` and `.idea`; added a root `.gitignore`.

### Added (2026-10-12)

- **Readable error messages**: `utils/errors.ts` turns failed API responses into user-facing messages (401/403/404/409/429/5xx and network errors) on every screen, including web where `Alert.alert` does nothing. Account problems at sign-in are shown on the login screen.
- **Dropdowns**: shared `components/Dropdown.tsx` (no dependencies).
  - Pick players from your play groups in the tournament, league and play group "Add" dialogs (typing a username, email or ID still works).
  - Pick a play group for a tournament instead of typing its ID.
  - "Report result" dropdown on each match replaces tapping a player name.
- **Tournament completion**: single-elimination tournaments become COMPLETED when the final is decided, with a Champion banner.
- **Date picker** for the league start date on web.

### Fixed (2026-10-12)

- Bracket byes never advanced, so tournaments with fewer players than capacity could not finish. Byes and empty bracket branches now resolve automatically.
- Matches in a round were displayed out of order.
- New play groups did not appear in the list until the screen was reopened.
- League dates were shown one day early in time zones west of UTC.
- Invalid league dates crashed the API (500); now a 400 with a message, and the form validates before sending.
- "Create League" with an empty name silently did nothing.
- Invitations screen and offline sync used a placeholder token and `localhost`; they now use the real session and `API_URL`. Offline sync drops changes the server rejects (and says why) and retries temporary failures.
- User errors such as "tournament is full" returned 500; now 400 with their message.

### Added

- **AWS Migration Plan** (2025-12-17)
  - Comprehensive guide for migrating API to ECS/Fargate, DB to RDS, and Client to Amplify.

- **Notification System** (2025-12-17)
  - **Full Feature**: Real-time notifications for Game/Tournament/League invites.
  - **UI**: Notifications screen with "Mark as Read", "Delete", and "Navigate to Item" actions.
  - **Design**: Standardized UI (Purple theme, Lucide icons, consistent headers).
  - **Management**: Ability to delete individual notifications and see unread badge counts.

- **Bug Fixes & Refactoring** (2025-12-17)
  - **Leave Logic**: Fixed critical bug where "Leave" failed due to ID mismatch (Cognito vs DB ID) across PlayGroups, Tournaments, and Leagues.
  - **Navigation**: Fixed crash when navigating from notifications to entities (params mismatch).
  - **Consistency**: Refactored `NotificationsScreen` to use standard App components and styling.

- **Leave Functionality & User Sync** (2025-12-12)
  - **Leave Actions**: Members can now voluntarily leave Play Groups, Tournaments, and Leagues.
  - **User Synchronization**: Fixed critical issue where new Cognito users weren't created in the local database until first authenticated API call.
  - **Auth Context**: Updated login flow to automatically sync user existence with backend.
  - **UI**: Added "Leave" buttons with confirmation dialogs for non-owner participants.
  - **Security**: Validates proper user ownership before processing leave requests.

- **Leagues Feature Enhancements** (2025-12-11)
  - Access control: Users only see leagues they own or participate in
  - Member management: Add/remove members by username, ID, or email
  - PlayGroup integration: Add entire playgroups to leagues
  - Delete league functionality with cascade cleanup
  - Modern UI matching app design (purple theme)
  - Auto-navigation to detail page after league creation
  - Refresh control on all league screens
  - Admin-only actions for league owners
  - Fixed hardcoded auth token issue

- **Life Counter Feature** (2025-12-09)
  - Full-featured life counter supporting 2-6 players
  - Dynamic layout adjustments based on player count
  - Commander damage tracking per opponent
  - Poison counter tracking
  - Player name customization
  - Animated backgrounds with color-based gradients
  - Settings modal for configuring player count and starting life
  - Tap to increment/decrement life, hold for +/-10

- **Commander Tournament Format** (2025-12-09)
  - Support for 4-player Commander pods
  - Multi-winner selection (2 winners per match)
  - Automatic bracket progression with 4-player pods
  - Updated tournament creation UI with format selection
  - Commander-specific result recording and advancement logic

- **Tournament Management Enhancements** (2025-12-09)
  - Delete button now available for active tournaments (previously only upcoming)
  - Cascade delete for tournaments (automatically removes participants and pairings)
  - Tournament visibility restricted to owners and participants only

- **Play Groups Feature** (2025-12-09)
  - Create and manage play groups
  - Add/remove members from play groups
  - Add entire play groups to tournaments
  - Play group detail screen with member management

### Changed

- Tournament detail screen now shows format (Single Elimination vs Commander)
- Tournament list filtered by user participation (security enhancement)
- Improved bracket visualization for Commander format

### Fixed

- Cascade delete issues when removing tournaments
- Tournament participant management with custom user IDs
- TypeORM entity relationships for proper cascade behavior

## [0.1.0] - 2025-12-01

### Added

- Initial project setup
- User authentication with AWS Cognito
- Basic tournament creation and management
- League system foundation
- Profile management
- Home screen with navigation
- Custom splash screen

### Infrastructure

- NestJS backend API
- React Native (Expo) frontend
- PostgreSQL database with TypeORM
- JWT authentication
- WebSocket support for real-time updates
