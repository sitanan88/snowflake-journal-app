import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS, FONT, SPACING } from '../theme';

export default function LoadingScreen() {
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.flake, { opacity: pulse }]}>❄️</Animated.Text>
      <Text style={styles.label}>Loading your journal…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             SPACING.md,
  },
  flake: {
    fontSize: 56,
  },
  label: {
    color:    COLORS.textMuted,
    fontSize: FONT.base,
  },
});
