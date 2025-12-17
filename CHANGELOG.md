# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
