# Sidebar Unread Badge Report

## Files Changed

- `src/app/components/Sidebar.tsx`
- `src/app/components/sidebarUnreadStore.ts`
- `src/app/globals.css`

## Behavior Summary

- Added global unread state for sidebar chat badge with mock default `3`.
- Added helper `formatUnreadCount(count)` with `9+` cap.
- Added future-ready `handleIncomingMessage(message)` for route-aware unread behavior.
- Badge appears only on the Chat icon in the left sidebar.
- Badge hides automatically after entering `/inbox`.
- Clicking the Chat icon also marks messages as seen and removes the badge.
- Added optional pulse animation when a new message arrives.

## Current Flow

- Default mock unread count starts at `3`.
- If the current route is not `/inbox`, incoming messages increment unread count.
- If the current route is `/inbox`, unread count is cleared and badge stays hidden.
