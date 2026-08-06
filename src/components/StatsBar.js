import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

function useCountUp(target, duration = 300) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    if (prev.current === target) return;
    const start     = prev.current;
    const diff      = target - start;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(start + diff * progress));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return display;
}

export default function StatsBar() {
  const { stats, state, toggleSound } = useApp();
  const displayTokens = useCountUp(stats.totalTokens);

  // Flame scale animation on streak change
  const flameScale = useRef(new Animated.Value(1)).current;
  const prevStreak = useRef(stats.streak);
  useEffect(() => {
    if (stats.streak !== prevStreak.current) {
      prevStreak.current = stats.streak;
      Animated.sequence([
        Animated.timing(flameScale, { toValue: 1.5, duration: 150, useNativeDriver: true }),
        Animated.spring(flameScale, { toValue: 1, damping: 6, useNativeDriver: true }),
      ]).start();
    }
  }, [stats.streak]);

  return (
    <View style={styles.bar}>
      {/* Tokens pill */}
      <View style={styles.pill}>
        <Text style={styles.pillIcon}>✦</Text>
        <Text style={styles.pillValue}>{displayTokens}</Text>
        <Text style={styles.pillLabel}> tokens</Text>
      </View>

      {/* Streak */}
      <View style={styles.pill}>
        <Animated.Text style={[styles.pillIcon, { transform: [{ scale: flameScale }] }]}>
          🔥
        </Animated.Text>
        <Text style={styles.pillValue}>{stats.streak}</Text>
        <Text style={styles.pillLabel}> day streak</Text>
      </View>

      {/* Sound toggle */}
      <TouchableOpacity
        onPress={toggleSound}
        style={styles.soundBtn}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Ionicons
          name={state.soundOn ? 'volume-high-outline' : 'volume-mute-outline'}
          size={20}
          color={state.soundOn ? COLORS.accent : COLORS.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  pill: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.full,
    paddingVertical:   4,
    paddingHorizontal: SPACING.sm + 2,
  },
  pillIcon: {
    fontSize: 13,
    marginRight: 3,
    color: COLORS.gold,
  },
  pillValue: {
    color:      COLORS.text,
    fontSize:   FONT.sm,
    fontWeight: '700',
  },
  pillLabel: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },
  soundBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
});
