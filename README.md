# Snowflake Journal

A habit and deed-logging app built with Expo + React Native. Log small positive actions across eleven life areas and watch your snowflake crystal grow with every entry.

## Life areas

Social · Professional · Finance · Love · Family · Pets · Investing · Gaming · Health · Fitness · Goals

## Features

- **Today tab** — Tap any of the 11 area cards to log a deed in under 5 seconds. Note field is optional and never blocks confirm.
- **Tasks tab** — Create your own tasks with custom token values and area assignments. Completing a task logs an entry automatically.
- **Crystal tab** — SVG snowflake visualization where each of the 11 arms grows and branches with your deed count for that area.
- **Badges tab** — 12 built-in badges (streak thresholds, token milestones, area-specific counts, log-all-areas) plus fully custom badges with your own icon, name, metric, and threshold.
- **History tab** — Every entry grouped by day with inline edit (area, note, tokens) and delete. Export/import JSON backup.
- **Persistent header** — Thought-of-the-day card (18 built-in + your own, tap to shuffle) and a Vocab card for words you want to remember.

## Tech stack

- [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/) (React Native 0.81.5, React 19.1.0)
- [`react-native-svg`](https://github.com/software-mansion/react-native-svg) — snowflake crystal visualization
- [`@react-native-async-storage/async-storage`](https://react-native-async-storage.github.io/async-storage/) — persistence
- [`expo-haptics`](https://docs.expo.dev/versions/v54.0.0/sdk/haptics/) — tactile feedback

## Getting started

```bash
npm install
npx expo start          # scan QR code with Expo Go
npx expo start --web    # open in browser
```

> Requires [Expo Go](https://expo.dev/go) on your device (SDK 54).
