import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { DEFAULT_STATE, saveState } from '../utils/storage';
import { computeStats, computeAdultingStats, checkBuiltinBadges, checkCustomBadges } from '../utils/stats';
import { genId, getTodayStr, getWeekKey } from '../utils/date';
import * as Sync from '../lib/sync';

const AppContext = createContext(null);

// ─── Reducer ────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return { ...DEFAULT_STATE, ...action.payload };

    case 'ADD_ENTRY':
      return { ...state, entries: [...state.entries, action.payload] };

    case 'EDIT_ENTRY':
      return {
        ...state,
        entries: state.entries.map(e => e.id === action.payload.id ? action.payload : e),
      };

    case 'DELETE_ENTRY':
      return { ...state, entries: state.entries.filter(e => e.id !== action.payload) };

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };

    case 'EDIT_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t),
      };

    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };

    case 'ADD_BUNDLE':
      return { ...state, bundles: [...state.bundles, action.payload] };

    case 'EDIT_BUNDLE':
      return {
        ...state,
        bundles: state.bundles.map(b => b.id === action.payload.id ? action.payload : b),
      };

    case 'DELETE_BUNDLE':
      return {
        ...state,
        bundles:           state.bundles.filter(b => b.id !== action.payload),
        bundleCompletions: state.bundleCompletions.filter(c => c.bundleId !== action.payload),
        // Also remove entries that were part of this bundle
        entries:           state.entries.filter(e => e.bundleId !== action.payload),
      };

    case 'ADD_BUNDLE_COMPLETION':
      return { ...state, bundleCompletions: [...state.bundleCompletions, action.payload] };

    case 'UNLOCK_BUILTIN_BADGES':
      return {
        ...state,
        unlockedBuiltinIds: [...new Set([...state.unlockedBuiltinIds, ...action.payload])],
      };

    case 'ADD_CUSTOM_BADGE':
      return { ...state, customBadges: [...state.customBadges, action.payload] };

    case 'EDIT_CUSTOM_BADGE':
      return {
        ...state,
        customBadges: state.customBadges.map(b => b.id === action.payload.id ? action.payload : b),
      };

    case 'DELETE_CUSTOM_BADGE':
      return { ...state, customBadges: state.customBadges.filter(b => b.id !== action.payload) };

    case 'UNLOCK_CUSTOM_BADGES':
      return {
        ...state,
        customBadges: state.customBadges.map(b =>
          action.payload.includes(b.id) && !b.unlocked
            ? { ...b, unlocked: true, unlockedDate: getTodayStr() }
            : b
        ),
      };

    case 'ADD_USER_QUOTE':
      return { ...state, userQuotes: [...state.userQuotes, action.payload] };

    case 'DELETE_USER_QUOTE':
      return { ...state, userQuotes: state.userQuotes.filter((_, i) => i !== action.payload) };

    case 'ADD_USER_VOCAB':
      return { ...state, userVocab: [...state.userVocab, action.payload] };

    case 'EDIT_USER_VOCAB':
      return {
        ...state,
        userVocab: state.userVocab.map(v => v.id === action.payload.id ? action.payload : v),
      };

    case 'DELETE_USER_VOCAB':
      return { ...state, userVocab: state.userVocab.filter(v => v.id !== action.payload) };

    case 'TOGGLE_SOUND':
      return { ...state, soundOn: !state.soundOn };

    default:
      return state;
  }
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function AppProvider({ children, initialState, userId, onBadgeUnlocked }) {
  const [state, dispatch] = useReducer(reducer, { ...DEFAULT_STATE, ...initialState });

  const isMounted = React.useRef(false);
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    saveState(state, userId).catch(() => {});
  }, [state]);

  useEffect(() => {
    if (!userId) return;
    Sync.pullAll(userId)
      .then(remote => { dispatch({ type: 'LOAD', payload: remote }); })
      .catch(() => {});
  }, [userId]);

  const stats         = useMemo(() => computeStats(state.entries), [state.entries]);
  const adultingStats = useMemo(
    () => computeAdultingStats(state.bundles, state.bundleCompletions),
    [state.bundles, state.bundleCompletions]
  );

  // ─── Badge checking ──────────────────────────────────────────────────────

  const runBadgeCheck = useCallback((nextState, nextStats) => {
    const newBuiltin = checkBuiltinBadges(nextStats, nextState.unlockedBuiltinIds);
    const newCustom  = checkCustomBadges(nextState.customBadges, nextStats);

    if (newBuiltin.length > 0) {
      dispatch({ type: 'UNLOCK_BUILTIN_BADGES', payload: newBuiltin });
      if (userId) {
        const merged = [...new Set([...nextState.unlockedBuiltinIds, ...newBuiltin])];
        Sync.pushSettings(userId, { ...nextState, unlockedBuiltinIds: merged }).catch(() => {});
      }
    }
    if (newCustom.length > 0) dispatch({ type: 'UNLOCK_CUSTOM_BADGES', payload: newCustom });

    const allNew = [...newBuiltin, ...newCustom];
    if (allNew.length > 0 && onBadgeUnlocked) onBadgeUnlocked(allNew, nextState);
  }, [userId, onBadgeUnlocked]);

  // ─── Entry actions ───────────────────────────────────────────────────────

  const addEntry = useCallback((entry) => {
    const newEntry = { id: genId(), timestamp: new Date().toISOString(), date: getTodayStr(), ...entry };
    dispatch({ type: 'ADD_ENTRY', payload: newEntry });
    if (userId) Sync.pushEntry(newEntry, userId).catch(() => {});

    const nextEntries = [...state.entries, newEntry];
    runBadgeCheck({ ...state, entries: nextEntries }, computeStats(nextEntries));
    return newEntry;
  }, [state, userId, runBadgeCheck]);

  const editEntry = useCallback((entry) => {
    dispatch({ type: 'EDIT_ENTRY', payload: entry });
    if (userId) Sync.pushEntry(entry, userId).catch(() => {});
  }, [userId]);

  const deleteEntry = useCallback((id) => {
    dispatch({ type: 'DELETE_ENTRY', payload: id });
    if (userId) Sync.removeEntry(id).catch(() => {});
  }, [userId]);

  // ─── Task actions ────────────────────────────────────────────────────────

  const addTask = useCallback((task) => {
    const newTask = { id: genId(), ...task };
    dispatch({ type: 'ADD_TASK', payload: newTask });
    if (userId) Sync.pushTask(newTask, userId).catch(() => {});
    return newTask;
  }, [userId]);

  const editTask = useCallback((task) => {
    dispatch({ type: 'EDIT_TASK', payload: task });
    if (userId) Sync.pushTask(task, userId).catch(() => {});
  }, [userId]);

  const deleteTask = useCallback((id) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
    if (userId) Sync.removeTask(id).catch(() => {});
  }, [userId]);

  const completeTask = useCallback((task) => {
    const newEntry = {
      id:        genId(),
      timestamp: new Date().toISOString(),
      date:      getTodayStr(),
      area:      task.area,
      tokens:    task.tokens,
      note:      `Task: ${task.name}`,
      taskId:    task.id,
    };
    dispatch({ type: 'ADD_ENTRY', payload: newEntry });
    if (userId) Sync.pushEntry(newEntry, userId).catch(() => {});

    const nextEntries = [...state.entries, newEntry];
    runBadgeCheck({ ...state, entries: nextEntries }, computeStats(nextEntries));
    return newEntry;
  }, [state, userId, runBadgeCheck]);

  // ─── Bundle actions ──────────────────────────────────────────────────────

  const addBundle = useCallback((bundle) => {
    const newBundle = { id: genId(), ...bundle };
    dispatch({ type: 'ADD_BUNDLE', payload: newBundle });
    if (userId) Sync.pushBundle(newBundle, userId).catch(() => {});
    return newBundle;
  }, [userId]);

  const editBundle = useCallback((bundle) => {
    dispatch({ type: 'EDIT_BUNDLE', payload: bundle });
    if (userId) Sync.pushBundle(bundle, userId).catch(() => {});
  }, [userId]);

  const deleteBundle = useCallback((id) => {
    dispatch({ type: 'DELETE_BUNDLE', payload: id });
    if (userId) Sync.removeBundle(id).catch(() => {});
  }, [userId]);

  // Complete a single task within a bundle for today.
  // Returns { entry, completion } where completion is non-null if the whole bundle just finished.
  const completeBundleTask = useCallback((bundle, bundleTask) => {
    const today = getTodayStr();

    // Guard: already completed today
    const alreadyDone = state.entries.some(
      e => e.bundleId === bundle.id && e.bundleTaskId === bundleTask.id && e.date === today
    );
    if (alreadyDone) return null;

    const newEntry = {
      id:           genId(),
      timestamp:    new Date().toISOString(),
      date:         today,
      area:         bundleTask.area,
      tokens:       bundleTask.tokens,
      note:         `${bundle.name}: ${bundleTask.name}`,
      bundleId:     bundle.id,
      bundleTaskId: bundleTask.id,
    };
    dispatch({ type: 'ADD_ENTRY', payload: newEntry });
    if (userId) Sync.pushEntry(newEntry, userId).catch(() => {});

    // Project next entries to check if bundle is now fully complete
    const nextEntries = [...state.entries, newEntry];
    const todayBundleTaskIds = new Set(
      nextEntries
        .filter(e => e.bundleId === bundle.id && e.date === today)
        .map(e => e.bundleTaskId)
    );
    const allDone = bundle.tasks.every(t => todayBundleTaskIds.has(t.id));
    const alreadyCompleted = state.bundleCompletions.some(
      c => c.bundleId === bundle.id && c.date === today
    );

    let completion = null;
    if (allDone && !alreadyCompleted) {
      completion = {
        id:          genId(),
        bundleId:    bundle.id,
        date:        today,
        weekKey:     getWeekKey(today),
        bonusTokens: bundle.bonusTokens,
      };
      dispatch({ type: 'ADD_BUNDLE_COMPLETION', payload: completion });
      if (userId) Sync.pushBundleCompletion(completion, userId).catch(() => {});
    }

    // Badge checks use entry tokens only (bonus tokens are tracked separately)
    runBadgeCheck({ ...state, entries: nextEntries }, computeStats(nextEntries));

    return { entry: newEntry, completion };
  }, [state, userId, runBadgeCheck]);

  // ─── Other actions ───────────────────────────────────────────────────────

  const addCustomBadge = useCallback((badge) => {
    const newBadge = { id: genId(), unlocked: false, ...badge };
    dispatch({ type: 'ADD_CUSTOM_BADGE', payload: newBadge });
    if (userId) Sync.pushCustomBadge(newBadge, userId).catch(() => {});
    runBadgeCheck({ ...state, customBadges: [...state.customBadges, newBadge] }, stats);
    return newBadge;
  }, [state, stats, userId, runBadgeCheck]);

  const editCustomBadge = useCallback((badge) => {
    dispatch({ type: 'EDIT_CUSTOM_BADGE', payload: badge });
    if (userId) Sync.pushCustomBadge(badge, userId).catch(() => {});
  }, [userId]);

  const deleteCustomBadge = useCallback((id) => {
    dispatch({ type: 'DELETE_CUSTOM_BADGE', payload: id });
    if (userId) Sync.removeCustomBadge(id).catch(() => {});
  }, [userId]);

  const addUserQuote = useCallback((text) => {
    const trimmed = text.trim();
    dispatch({ type: 'ADD_USER_QUOTE', payload: trimmed });
    if (userId) {
      Sync.pushSettings(userId, { ...state, userQuotes: [...state.userQuotes, trimmed] }).catch(() => {});
    }
  }, [state, userId]);

  const deleteUserQuote = useCallback((index) => {
    dispatch({ type: 'DELETE_USER_QUOTE', payload: index });
    if (userId) {
      Sync.pushSettings(userId, { ...state, userQuotes: state.userQuotes.filter((_, i) => i !== index) }).catch(() => {});
    }
  }, [state, userId]);

  const addUserVocab = useCallback((vocab) => {
    const newVocab = { id: genId(), ...vocab };
    dispatch({ type: 'ADD_USER_VOCAB', payload: newVocab });
    if (userId) Sync.pushVocab(newVocab, userId).catch(() => {});
  }, [userId]);

  const editUserVocab = useCallback((vocab) => {
    dispatch({ type: 'EDIT_USER_VOCAB', payload: vocab });
    if (userId) Sync.pushVocab(vocab, userId).catch(() => {});
  }, [userId]);

  const deleteUserVocab = useCallback((id) => {
    dispatch({ type: 'DELETE_USER_VOCAB', payload: id });
    if (userId) Sync.removeVocab(id).catch(() => {});
  }, [userId]);

  const toggleSound = useCallback(() => {
    dispatch({ type: 'TOGGLE_SOUND' });
    if (userId) {
      Sync.pushSettings(userId, { ...state, soundOn: !state.soundOn }).catch(() => {});
    }
  }, [state, userId]);

  const importState = useCallback((imported) => {
    dispatch({ type: 'LOAD', payload: { ...DEFAULT_STATE, ...imported } });
  }, []);

  const value = useMemo(() => ({
    state,
    stats,
    adultingStats,
    addEntry, editEntry, deleteEntry,
    addTask, editTask, deleteTask, completeTask,
    addBundle, editBundle, deleteBundle, completeBundleTask,
    addCustomBadge, editCustomBadge, deleteCustomBadge,
    addUserQuote, deleteUserQuote,
    addUserVocab, editUserVocab, deleteUserVocab,
    toggleSound, importState,
  }), [
    state, stats, adultingStats,
    addEntry, editEntry, deleteEntry,
    addTask, editTask, deleteTask, completeTask,
    addBundle, editBundle, deleteBundle, completeBundleTask,
    addCustomBadge, editCustomBadge, deleteCustomBadge,
    addUserQuote, deleteUserQuote,
    addUserVocab, editUserVocab, deleteUserVocab,
    toggleSound, importState,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
