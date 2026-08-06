import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { AREAS } from '../constants/areas';
import { getTodayStr } from '../utils/date';
import { COLORS, SPACING } from '../theme';
import AreaCard    from '../components/AreaCard';
import LogDeedSheet from '../components/LogDeedSheet';

export default function TodayScreen({ showToast }) {
  const { state, stats, addEntry } = useApp();
  const [selectedArea,  setSelectedArea]  = useState(null);
  const [sheetOpen,     setSheetOpen]     = useState(false);
  const [lastLoggedId,  setLastLoggedId]  = useState(null);

  // Per-area counts for today and all-time
  const todayCounts = {};
  AREAS.forEach(a => { todayCounts[a.id] = 0; });
  state.entries
    .filter(e => e.date === getTodayStr())
    .forEach(e => { if (todayCounts[e.area] !== undefined) todayCounts[e.area]++; });

  const handleAreaPress = useCallback((area) => {
    setSelectedArea(area);
    setSheetOpen(true);
  }, []);

  const handleLog = useCallback((area, note) => {
    addEntry({ area: area.id, tokens: area.tokens, note });
    setSheetOpen(false);
    setLastLoggedId(area.id);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    showToast?.(`+${area.tokens} tokens · ${area.name}`, 'success');

    // Clear the justLogged flag after animation completes
    setTimeout(() => setLastLoggedId(null), 800);
  }, [addEntry, showToast]);

  return (
    <View style={styles.container}>
      <FlatList
        data={AREAS}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <AreaCard
            area={item}
            todayCount={todayCounts[item.id]}
            totalCount={stats.areaCounts[item.id] ?? 0}
            justLogged={lastLoggedId === item.id}
            onPress={() => handleAreaPress(item)}
          />
        )}
      />

      <LogDeedSheet
        visible={sheetOpen}
        area={selectedArea}
        onClose={() => setSheetOpen(false)}
        onLog={handleLog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.bg,
  },
  grid: {
    padding: SPACING.sm,
  },
  row: {
    justifyContent: 'space-between',
  },
});
