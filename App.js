import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { loadState, DEFAULT_STATE } from './src/utils/storage';
import { AppProvider }  from './src/context/AppContext';
import LoadingScreen    from './src/screens/LoadingScreen';
import ErrorScreen      from './src/screens/ErrorScreen';
import BottomNav        from './src/components/BottomNav';
import Toast            from './src/components/Toast';
import Header           from './src/components/Header';
import { COLORS }       from './src/theme';

import TodayScreen    from './src/screens/TodayScreen';
import TasksScreen    from './src/screens/TasksScreen';
import SnowflakeScreen from './src/screens/SnowflakeScreen';
import BadgesScreen   from './src/screens/BadgesScreen';
import HistoryScreen  from './src/screens/HistoryScreen';

export default function App() {
  const [loadStatus,         setLoadStatus]         = useState('loading'); // 'loading' | 'error' | 'ready'
  const [errorMsg,           setErrorMsg]           = useState('');
  const [initialState,       setInitialState]       = useState(null);
  const [activeTab,          setActiveTab]          = useState('today');
  const [sessionUnlockedIds, setSessionUnlockedIds] = useState([]);
  const toastRef = useRef(null);

  const attemptLoad = useCallback(() => {
    setLoadStatus('loading');
    loadState()
      .then(data => {
        setInitialState(data ?? DEFAULT_STATE);
        setLoadStatus('ready');
      })
      .catch(err => {
        setErrorMsg(err?.message || 'Unknown error reading storage.');
        setLoadStatus('error');
      });
  }, []);

  useEffect(() => { attemptLoad(); }, []);

  const showToast = useCallback((msg, type) => {
    toastRef.current?.show(msg, type);
  }, []);

  const handleBadgeUnlocked = useCallback((newIds, state) => {
    const { BUILTIN_BADGES } = require('./src/constants/badges');
    setSessionUnlockedIds(prev => [...new Set([...prev, ...newIds])]);
    newIds.forEach(id => {
      const builtin = BUILTIN_BADGES.find(b => b.id === id);
      const custom  = state?.customBadges?.find(b => b.id === id);
      const badge   = builtin || custom;
      if (badge) {
        setTimeout(() => showToast(`${badge.icon} Badge unlocked: ${badge.name}!`, 'badge'), 400);
      }
    });
  }, [showToast]);

  if (loadStatus === 'loading') return <LoadingScreen />;
  if (loadStatus === 'error') {
    return <ErrorScreen message={errorMsg} onRetry={attemptLoad} />;
  }

  return (
    <AppProvider initialState={initialState} onBadgeUnlocked={handleBadgeUnlocked}>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.shell}>
          <Header />
          <View style={styles.content}>
            {activeTab === 'today'     && <TodayScreen    showToast={showToast} />}
            {activeTab === 'tasks'     && <TasksScreen    showToast={showToast} />}
            {activeTab === 'snowflake' && <SnowflakeScreen />}
            {activeTab === 'badges'    && <BadgesScreen   showToast={showToast} sessionUnlockedIds={sessionUnlockedIds} />}
            {activeTab === 'history'   && <HistoryScreen  showToast={showToast} />}
          </View>
          <BottomNav activeTab={activeTab} onTabPress={setActiveTab} />
        </View>
        <Toast ref={toastRef} />
      </SafeAreaView>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: COLORS.bg,
  },
  shell: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
