# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
