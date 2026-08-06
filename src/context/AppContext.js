import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { DEFAULT_STATE, saveState } from '../utils/storage';
import { computeStats, checkBuiltinBadges, checkCustomBadges } from '../utils/stats';
import { genId, getTodayStr } from '../utils/date';

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

export function AppProvider({ children, initialState, onBadgeUnlocked }) {
  const [state, dispatch] = useReducer(reducer, { ...DEFAULT_STATE, ...initialState });

  // Auto-save on every state change (except initial load)
  const isMounted = React.useRef(false);
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    saveState(state).catch(() => {}); // save errors are non-fatal after load
  }, [state]);

  // Recompute stats whenever entries change
  const stats = useMemo(() => computeStats(state.entries), [state.entries]);

  // ─── Badge checking helper ───────────────────────────────────────────────

  const runBadgeCheck = useCallback((nextState, nextStats) => {
    const newBuiltin = checkBuiltinBadges(nextStats, nextState.unlockedBuiltinIds);
    const newCustom  = checkCustomBadges(nextState.customBadges, nextStats);

    if (newBuiltin.length > 0) dispatch({ type: 'UNLOCK_BUILTIN_BADGES', payload: newBuiltin });
    if (newCustom.length > 0)  dispatch({ type: 'UNLOCK_CUSTOM_BADGES',  payload: newCustom });

    const allNew = [...newBuiltin, ...newCustom];
    if (allNew.length > 0 && onBadgeUnlocked) onBadgeUnlocked(allNew, nextState);
  }, [onBadgeUnlocked]);

  // ─── Actions ────────────────────────────────────────────────────────────

  const addEntry = useCallback((entry) => {
    const newEntry = { id: genId(), timestamp: new Date().toISOString(), date: getTodayStr(), ...entry };
    dispatch({ type: 'ADD_ENTRY', payload: newEntry });

    // Badge check against projected next state
    const nextEntries = [...state.entries, newEntry];
    const nextStats   = computeStats(nextEntries);
    const nextState   = { ...state, entries: nextEntries };
    runBadgeCheck(nextState, nextStats);

    return newEntry;
  }, [state, runBadgeCheck]);

  const editEntry = useCallback((entry) => {
    dispatch({ type: 'EDIT_ENTRY', payload: entry });
  }, []);

  const deleteEntry = useCallback((id) => {
    dispatch({ type: 'DELETE_ENTRY', payload: id });
  }, []);

  const addTask = useCallback((task) => {
    const newTask = { id: genId(), ...task };
    dispatch({ type: 'ADD_TASK', payload: newTask });
    return newTask;
  }, []);

  const editTask = useCallback((task) => {
    dispatch({ type: 'EDIT_TASK', payload: task });
  }, []);

  const deleteTask = useCallback((id) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  }, []);

  const completeTask = useCallback((task) => {
    // Completing a task logs an entry with the task's custom token value
    const newEntry = {
      id: genId(),
      timestamp: new Date().toISOString(),
      date: getTodayStr(),
      area: task.area,
      tokens: task.tokens,
      note: `Task: ${task.name}`,
      taskId: task.id,
    };
    dispatch({ type: 'ADD_ENTRY', payload: newEntry });

    const nextEntries = [...state.entries, newEntry];
    const nextStats   = computeStats(nextEntries);
    const nextState   = { ...state, entries: nextEntries };
    runBadgeCheck(nextState, nextStats);

    return newEntry;
  }, [state, runBadgeCheck]);

  const addCustomBadge = useCallback((badge) => {
    const newBadge = { id: genId(), unlocked: false, ...badge };
    dispatch({ type: 'ADD_CUSTOM_BADGE', payload: newBadge });

    // Check immediately if already met
    const nextState = { ...state, customBadges: [...state.customBadges, newBadge] };
    runBadgeCheck(nextState, stats);

    return newBadge;
  }, [state, stats, runBadgeCheck]);

  const editCustomBadge = useCallback((badge) => {
    dispatch({ type: 'EDIT_CUSTOM_BADGE', payload: badge });
  }, []);

  const deleteCustomBadge = useCallback((id) => {
    dispatch({ type: 'DELETE_CUSTOM_BADGE', payload: id });
  }, []);

  const addUserQuote = useCallback((text) => {
    dispatch({ type: 'ADD_USER_QUOTE', payload: text.trim() });
  }, []);

  const deleteUserQuote = useCallback((index) => {
    dispatch({ type: 'DELETE_USER_QUOTE', payload: index });
  }, []);

  const addUserVocab = useCallback((vocab) => {
    dispatch({ type: 'ADD_USER_VOCAB', payload: { id: genId(), ...vocab } });
  }, []);

  const editUserVocab = useCallback((vocab) => {
    dispatch({ type: 'EDIT_USER_VOCAB', payload: vocab });
  }, []);

  const deleteUserVocab = useCallback((id) => {
    dispatch({ type: 'DELETE_USER_VOCAB', payload: id });
  }, []);

  const toggleSound = useCallback(() => {
    dispatch({ type: 'TOGGLE_SOUND' });
  }, []);

  const importState = useCallback((imported) => {
    dispatch({ type: 'LOAD', payload: { ...DEFAULT_STATE, ...imported } });
  }, []);

  const value = useMemo(() => ({
    state,
    stats,
    addEntry,
    editEntry,
    deleteEntry,
    addTask,
    editTask,
    deleteTask,
    completeTask,
    addCustomBadge,
    editCustomBadge,
    deleteCustomBadge,
    addUserQuote,
    deleteUserQuote,
    addUserVocab,
    editUserVocab,
    deleteUserVocab,
    toggleSound,
    importState,
  }), [
    state, stats,
    addEntry, editEntry, deleteEntry,
    addTask, editTask, deleteTask, completeTask,
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
