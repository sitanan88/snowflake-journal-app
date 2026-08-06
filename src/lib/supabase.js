import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Placeholder — replace once you have your Supabase project ───────────────
export const SUPABASE_URL      = 'https://gdcddyilficehvjzmkmq.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2RkeWlsZmljZWh2anpta21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMjM2MDQsImV4cCI6MjEwMTU5OTYwNH0.Zf0gIi_Vk8QLbY2rBmH3XeaBByKhJYTyU7f-Gx4MgRg';
// ─────────────────────────────────────────────────────────────────────────────

// Supabase session JWTs can exceed SecureStore's 2048-byte value limit.
// This adapter tries SecureStore first and falls back to AsyncStorage for
// values that are too large.
const StorageAdapter = {
  async getItem(key) {
    const secure = await SecureStore.getItemAsync(key).catch(() => null);
    if (secure !== null) return secure;
    return AsyncStorage.getItem(key);
  },
  async setItem(key, value) {
    if (value.length > 2000) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value).catch(() =>
        AsyncStorage.setItem(key, value)
      );
    }
  },
  async removeItem(key) {
    await Promise.all([
      SecureStore.deleteItemAsync(key).catch(() => {}),
      AsyncStorage.removeItem(key),
    ]);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:            StorageAdapter,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});
