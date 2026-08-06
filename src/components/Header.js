import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StatsBar    from './StatsBar';
import ThoughtCard from './ThoughtCard';
import VocabCard   from './VocabCard';
import { COLORS, SPACING, FONT } from '../theme';

export default function Header() {
  return (
    <View style={styles.container}>
      {/* App title row */}
      <View style={styles.titleRow}>
        <Text style={styles.appIcon}>❄️</Text>
        <Text style={styles.appName}>Snowflake Journal</Text>
      </View>

      <StatsBar />
      <ThoughtCard />
      <VocabCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  titleRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop:      SPACING.xs,
    paddingBottom:   SPACING.xs,
  },
  appIcon: {
    fontSize: 20,
  },
  appName: {
    color:      COLORS.text,
    fontSize:   FONT.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
