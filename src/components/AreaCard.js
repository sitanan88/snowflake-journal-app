import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

export default function AreaCard({ area, todayCount, totalCount, onPress, justLogged }) {
  const pressScale  = useRef(new Animated.Value(1)).current;
  const ringScale   = useRef(new Animated.Value(0.85)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const iconBounce  = useRef(new Animated.Value(1)).current;
  const plusOpacity = useRef(new Animated.Value(0)).current;
  const plusTranslY = useRef(new Animated.Value(0)).current;

  // Trigger glow + bounce when a deed is logged for this area
  useEffect(() => {
    if (!justLogged) return;

    // Glow ring
    ringScale.setValue(0.85);
    ringOpacity.setValue(0.7);
    Animated.parallel([
      Animated.timing(ringScale,   { toValue: 1.5, duration: 450, useNativeDriver: true }),
      Animated.timing(ringOpacity, { toValue: 0,   duration: 450, useNativeDriver: true }),
    ]).start();

    // Icon bounce
    Animated.sequence([
      Animated.timing(iconBounce, { toValue: 1.25, duration: 110, useNativeDriver: true }),
      Animated.spring(iconBounce, { toValue: 1, damping: 7, stiffness: 200, useNativeDriver: true }),
    ]).start();

    // Floating "+N" label
    plusOpacity.setValue(1);
    plusTranslY.setValue(0);
    Animated.parallel([
      Animated.timing(plusTranslY, { toValue: -28, duration: 700, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(plusOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [justLogged]);

  const handlePressIn = () => {
    Animated.spring(pressScale, { toValue: 0.95, useNativeDriver: true, speed: 40 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  };

  const hasLoggedToday = todayCount > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.wrapper}
    >
      <Animated.View
        style={[
          styles.card,
          hasLoggedToday && { borderColor: area.color + '66' },
          { transform: [{ scale: pressScale }] },
        ]}
      >
        {/* Glow ring (absolutely positioned behind card content) */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              borderColor:  area.color,
              transform:    [{ scale: ringScale }],
              opacity:      ringOpacity,
            },
          ]}
          pointerEvents="none"
        />

        {/* Today streak dot */}
        {hasLoggedToday && (
          <View style={[styles.loggedDot, { backgroundColor: area.color }]} />
        )}

        {/* Icon with bounce */}
        <Animated.Text style={[styles.icon, { transform: [{ scale: iconBounce }] }]}>
          {area.icon}
        </Animated.Text>

        {/* Floating +tokens */}
        <Animated.Text
          style={[
            styles.plusLabel,
            { color: area.color, opacity: plusOpacity, transform: [{ translateY: plusTranslY }] },
          ]}
          pointerEvents="none"
        >
          +{area.tokens}
        </Animated.Text>

        <Text style={styles.name}>{area.name}</Text>

        <View style={styles.countRow}>
          {todayCount > 0 && (
            <Text style={[styles.todayCount, { color: area.color }]}>
              {todayCount} today
            </Text>
          )}
          <Text style={styles.totalCount}>{totalCount} total</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex:   1,
    margin: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    borderWidth:     1,
    borderColor:     COLORS.border,
    padding:         SPACING.md,
    alignItems:      'center',
    minHeight:       110,
    overflow:        'visible',
    position:        'relative',
  },
  glowRing: {
    position:     'absolute',
    top:          -4,
    left:         -4,
    right:        -4,
    bottom:       -4,
    borderRadius: RADIUS.lg + 4,
    borderWidth:  2,
  },
  loggedDot: {
    position:     'absolute',
    top:          SPACING.sm,
    right:        SPACING.sm,
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  icon: {
    fontSize:     32,
    marginBottom: SPACING.xs,
    marginTop:    SPACING.xs,
  },
  plusLabel: {
    position:   'absolute',
    top:        8,
    left:       SPACING.sm,
    fontSize:   FONT.sm,
    fontWeight: '800',
  },
  name: {
    color:      COLORS.text,
    fontSize:   FONT.sm,
    fontWeight: '600',
    textAlign:  'center',
    marginBottom: 4,
  },
  countRow: {
    flexDirection: 'row',
    gap:           SPACING.xs,
    alignItems:    'center',
  },
  todayCount: {
    fontSize:   10,
    fontWeight: '700',
  },
  totalCount: {
    fontSize: 10,
    color:    COLORS.textMuted,
  },
});
