import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'snowflake-journal-v1';

export const DEFAULT_STATE = {
  entries: [],       // { id, date, timestamp, area, tokens, note, taskId? }
  tasks: [],         // { id, name, area, tokens }
  customBadges: [],  // { id, name, icon, desc, metric, area?, threshold, unlocked, unlockedDate? }
  unlockedBuiltinIds: [],
  userQuotes: [],    // strings
  userVocab: [],     // { id, term, definition, example }
  soundOn: true,
};

export async function loadState() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return null; // genuinely empty
  return JSON.parse(raw);
}

export async function saveState(state) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearState() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
