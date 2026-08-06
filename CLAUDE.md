# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Expo SDK Version

**Before writing any code, read the versioned docs for the SDK in use:**
https://docs.expo.dev/versions/v54.0.0/

This project uses **Expo SDK 54** (React Native 0.81.5, React 19.1.0). The Expo Go client on the test device supports SDK 54 only — do not upgrade the SDK without verifying Expo Go compatibility first.

## Commands

```bash
npx expo start          # Start Metro bundler (LAN mode, QR code for Expo Go)
npx expo start --web    # Start web version (React Native Web)
npx expo start --ios    # Open iOS simulator
npx expo start --android # Open Android emulator
```

When adding new packages, always use `npx expo install <package>` — it resolves the SDK-compatible version automatically.

If `npm install` fails due to peer dep conflicts, use `npm install --legacy-peer-deps`.
If installs fail with `EACCES`, run `sudo chown -R $(whoami) ~/.npm` first.

## Architecture

This is **Snowflake Journal** — a habit/deed logging app. Entry point is `index.js` → `App.js`.

### State & data flow

All app state lives in a single `useReducer` inside `src/context/AppContext.js`. The context is consumed everywhere via `useApp()`. Stats (streak, token totals, per-area deed counts) are **never stored** — they are derived from `state.entries` on every render via `computeStats()` in `src/utils/stats.js`. This is intentional: edits and deletes always recompute from scratch to prevent drift.

Persistence is `AsyncStorage` (key: `snowflake-journal-v1`). The state auto-saves on every change via a `useEffect` in `AppProvider`. On load, a `null` result from `getItem` means genuinely empty (fresh start); a thrown error shows `ErrorScreen` and blocks all rendering/saving.

Badge checking (`checkBuiltinBadges` + `checkCustomBadges`) runs inside `AppContext` after every `addEntry`, `completeTask`, and `addCustomBadge` call. Badges never revoke once unlocked.

### Navigation

No navigation library. `App.js` manages a single `activeTab` string and renders the matching screen. The five tabs are: `today`, `tasks`, `snowflake`, `badges`, `history`.

### Modal sheets

All six bottom sheets reuse `src/components/BottomSheet.js` (spring slide-up, keyboard-avoiding). Sheets are opened by setting local `useState` in their parent screen.

### Key source locations

| What | Where |
|---|---|
| App shell, load/error states, tab routing | `App.js` |
| All state, actions, badge checking | `src/context/AppContext.js` |
| State shape & AsyncStorage read/write | `src/utils/storage.js` |
| Streak + stats derived from entries | `src/utils/stats.js` |
| 11 life areas (id, name, icon, color, tokens) | `src/constants/areas.js` |
| 12 built-in badge definitions | `src/constants/badges.js` |
| Reusable bottom sheet | `src/components/BottomSheet.js` |
| Persistent header (stats bar + Thought + Vocab) | `src/components/Header.js` |
| SVG snowflake crystal | `src/screens/SnowflakeScreen.js` |

### Installed non-default packages

- `@react-native-async-storage/async-storage` — persistence
- `react-native-svg` — snowflake SVG visualization (uses `Animated.createAnimatedComponent(Line)` for arm animation)
- `expo-haptics` — tactile feedback (no-op on web, fine)
- `react-dom`, `react-native-web`, `@expo/metro-runtime` — web target

### Patterns to follow

- **Delete confirmation**: double-tap pattern (first tap → "sure?" state with 3s auto-reset, second tap → delete). Used in TaskRow, EntryRow, and BadgesScreen. Do not use `Alert.alert` for destructive confirmation.
- **Animations**: use React Native `Animated` API with `useNativeDriver: true` for transform/opacity, `useNativeDriver: false` for layout changes (height, width). `expo-haptics` for feedback.
- **New screens**: add to the `activeTab` switch in `App.js` and the `TABS` array in `src/components/BottomNav.js`.
- **New actions**: add a case to the `reducer` in `AppContext.js`, create a `useCallback` action function, and expose it via the `value` object and `useMemo` deps array.
