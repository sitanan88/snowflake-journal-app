import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_KEY = 'snowflake-journal-v1';

// User-scoped key so multiple accounts on the same device don't collide
function storageKey(userId) {
  return userId ? `${BASE_KEY}-${userId}` : BASE_KEY;
}

export const DEFAULT_STATE = {
  entries:            [], // { id, date, timestamp, area, tokens, note, taskId? }
  tasks:              [], // { id, name, area, tokens }
  customBadges:       [], // { id, name, icon, desc, metric, area?, threshold, unlocked, unlockedDate? }
  unlockedBuiltinIds: [],
  userQuotes:         [], // strings
  userVocab:          [], // { id, term, definition, example }
  soundOn:            true,
};

export async function loadState(userId) {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (raw === null) return null;
  return JSON.parse(raw);
}

export async function saveState(state, userId) {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(state));
}

export async function clearState(userId) {
  await AsyncStorage.removeItem(storageKey(userId));
}
