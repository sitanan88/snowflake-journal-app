import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

export default function BadgeCard({ badge, unlocked, justUnlocked }) {
  const wasUnlocked = useRef(unlocked && !justUnlocked);

  // Color overlay — starts at 1 if already unlocked, 0 if locked
  const colorOpacity = useRef(new Animated.Value(wasUnlocked.current ? 1 : 0)).current;

  // Icon scale + rotation for the unlock pop
  const iconScale = useRef(new Animated.Value(1)).current;
  const iconRot   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!justUnlocked) return;

    // Sweep color overlay in
    Animated.timing(colorOpacity, {
      toValue:  1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    // Icon pop: scale + slight rotation
    Animated.sequence([
      Animated.spring(iconScale, {
        toValue: 1.35, damping: 5, stiffness: 300, useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1, damping: 12, stiffness: 200, useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(iconRot, { toValue: -10, duration: 90,  useNativeDriver: true }),
      Animated.timing(iconRot, { toValue:  10, duration: 140, useNativeDriver: true }),
      Animated.timing(iconRot, { toValue:   0, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [justUnlocked]);

  const rotation = iconRot.interpolate({
    inputRange:  [-10, 0, 10],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  return (
    <View style={styles.card}>
      {/* Gray base layer (always rendered) */}
      <View style={[styles.iconCircle, styles.iconCircleGray]}>
        <Animated.Text style={[
          styles.icon,
          !unlocked && styles.iconLocked,
          { transform: [{ scale: iconScale }, { rotate: rotation }] },
        ]}>
          {badge.icon}
        </Animated.Text>
      </View>

      {/* Color overlay — fades in when unlocked */}
      {unlocked && (
        <Animated.View
          style={[styles.colorOverlay, { opacity: colorOpacity }]}
          pointerEvents="none"
        />
      )}

      <Text style={[styles.name, !unlocked && styles.nameLocked]} numberOfLines={1}>
        {badge.name}
      </Text>
      <Text style={[styles.desc, !unlocked && styles.descLocked]} numberOfLines={2}>
        {badge.desc}
      </Text>

      {unlocked ? (
        <View style={styles.unlockedBadge}>
          <Text style={styles.unlockedText}>✓ Unlocked</Text>
        </View>
      ) : (
        <View style={styles.lockedBadge}>
          <Text style={styles.lockedText}>🔒 Locked</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    borderWidth:     1,
    borderColor:     COLORS.border,
    padding:         SPACING.sm + 4,
    alignItems:      'center',
    overflow:        'hidden',
    position:        'relative',
    minHeight:       148,
  },
  iconCircle: {
    width:          60,
    height:         60,
    borderRadius:   30,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   SPACING.xs,
  },
  iconCircleGray: {
    backgroundColor: COLORS.surface2,
  },
  icon: {
    fontSize: 28,
  },
  iconLocked: {
    opacity: 0.45,
  },
  colorOverlay: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    height:          80,
    backgroundColor: COLORS.accent2,
    opacity:         0.08,
    borderRadius:    RADIUS.lg,
  },
  name: {
    color:      COLORS.text,
    fontSize:   FONT.sm,
    fontWeight: '700',
    textAlign:  'center',
    marginBottom: 3,
  },
  nameLocked: {
    color: COLORS.textMuted,
  },
  desc: {
    color:     COLORS.textLight,
    fontSize:  10,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: SPACING.xs,
    flex: 1,
  },
  descLocked: {
    color: COLORS.textMuted,
    opacity: 0.6,
  },
  unlockedBadge: {
    backgroundColor: COLORS.success + '22',
    borderRadius:    RADIUS.full,
    paddingVertical:   3,
    paddingHorizontal: SPACING.sm,
    marginTop: 'auto',
  },
  unlockedText: {
    color:      COLORS.success,
    fontSize:   10,
    fontWeight: '700',
  },
  lockedBadge: {
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.full,
    paddingVertical:   3,
    paddingHorizontal: SPACING.sm,
    marginTop: 'auto',
  },
  lockedText: {
    color:    COLORS.textMuted,
    fontSize: 10,
  },
});
