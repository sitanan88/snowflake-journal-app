import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { AREAS } from '../constants/areas';
import { COLORS, SPACING, FONT, RADIUS } from '../theme';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const CX        = 160;
const CY        = 160;
const SVG_DIM   = 320;   // logical SVG canvas size
const MAX_R     = 115;
const MIN_R     = 12;
const MAX_DEEDS = 50;

function armAngle(i) {
  return (i * 2 * Math.PI / 12) - Math.PI / 2;
}

function computeBranches(angle, length, fraction) {
  if (length < 28) return [];
  const numBranches = Math.min(Math.ceil(fraction * 5), 5);
  const perpAngle   = angle + Math.PI / 2;
  const branches    = [];

  for (let b = 1; b <= numBranches; b++) {
    const t    = b / (numBranches + 1);
    const bx   = CX + length * t * Math.cos(angle);
    const by   = CY + length * t * Math.sin(angle);
    const bLen = length * 0.22 * (1 - t * 0.35) * Math.max(fraction, 0.2);
    branches.push({ bx, by, bLen, perpAngle });
  }
  return branches;
}

export default function SnowflakeScreen() {
  const { stats }   = useApp();
  const areaCounts  = stats.areaCounts;
  const countsKey   = AREAS.map(a => areaCounts[a.id] || 0).join(',');

  // Responsive SVG size
  const screenW   = Dimensions.get('window').width;
  const svgSize   = Math.min(screenW - SPACING.md * 2, SVG_DIM);
  const svgScale  = svgSize / SVG_DIM;

  // One Animated.Value per arm (fraction 0–1)
  const animFracs = useRef(AREAS.map(() => new Animated.Value(0))).current;
  const isMounted = useRef(false);

  // On mount: staggered entrance from 0 → current value
  useEffect(() => {
    animFracs.forEach(f => f.setValue(0));
    const anims = AREAS.map((area, i) =>
      Animated.spring(animFracs[i], {
        toValue: Math.min((areaCounts[area.id] || 0) / MAX_DEEDS, 1),
        damping: 18,
        stiffness: 65,
        useNativeDriver: false,
      })
    );
    Animated.stagger(50, anims).start(() => { isMounted.current = true; });
  }, []);

  // After mount: animate any arm whose count changed
  useEffect(() => {
    if (!isMounted.current) return;
    AREAS.forEach((area, i) => {
      const target = Math.min((areaCounts[area.id] || 0) / MAX_DEEDS, 1);
      Animated.spring(animFracs[i], {
        toValue: target,
        damping: 18,
        stiffness: 80,
        useNativeDriver: false,
      }).start();
    });
  }, [countsKey]);

  // Stable interpolated tip positions for each arm (main animated line)
  const armTips = useMemo(() =>
    AREAS.map((_area, i) => {
      const angle = armAngle(i);
      const cosA  = Math.cos(angle);
      const sinA  = Math.sin(angle);
      return {
        x2: animFracs[i].interpolate({
          inputRange: [0, 1],
          outputRange: [CX + MIN_R * cosA, CX + MAX_R * cosA],
        }),
        y2: animFracs[i].interpolate({
          inputRange: [0, 1],
          outputRange: [CY + MIN_R * sinA, CY + MAX_R * sinA],
        }),
        cosA, sinA, angle,
      };
    })
  , []); // animFracs are stable refs

  // Static branch geometry, recomputed when counts change
  const armBranches = useMemo(() =>
    AREAS.map((area, i) => {
      const count    = areaCounts[area.id] || 0;
      const fraction = Math.min(count / MAX_DEEDS, 1);
      const length   = MIN_R + (MAX_R - MIN_R) * fraction;
      const angle    = armAngle(i);
      return computeBranches(angle, length, fraction);
    })
  , [countsKey]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Crystal</Text>
      <Text style={styles.subtitle}>Your snowflake grows with every deed</Text>

      {/* SVG + emoji label overlay */}
      <View style={[styles.svgWrapper, { width: svgSize, height: svgSize }]}>
        <Svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${SVG_DIM} ${SVG_DIM}`}
        >
          {/* Guide rings */}
          {[0.25, 0.5, 0.75, 1].map(t => (
            <Circle
              key={t}
              cx={CX} cy={CY}
              r={MIN_R + (MAX_R - MIN_R) * t}
              fill="none"
              stroke={COLORS.border}
              strokeWidth={0.75}
              opacity={0.4}
            />
          ))}

          {/* Arms */}
          {AREAS.map((area, i) => {
            const { x2, y2, cosA, sinA, angle } = armTips[i];
            const count    = areaCounts[area.id] || 0;
            const fraction = Math.min(count / MAX_DEEDS, 1);
            const length   = MIN_R + (MAX_R - MIN_R) * fraction;
            const tipX     = CX + length * cosA;
            const tipY     = CY + length * sinA;

            return (
              <G key={area.id}>
                {/* Main arm — animated */}
                <AnimatedLine
                  x1={CX} y1={CY}
                  x2={x2} y2={y2}
                  stroke={area.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />

                {/* Branches — static */}
                {armBranches[i].map(({ bx, by, bLen, perpAngle }, bi) => (
                  <G key={bi}>
                    <Line
                      x1={bx} y1={by}
                      x2={bx + bLen * Math.cos(perpAngle)}
                      y2={by + bLen * Math.sin(perpAngle)}
                      stroke={area.color} strokeWidth={1.2}
                      strokeLinecap="round" opacity={0.75}
                    />
                    <Line
                      x1={bx} y1={by}
                      x2={bx - bLen * Math.cos(perpAngle)}
                      y2={by - bLen * Math.sin(perpAngle)}
                      stroke={area.color} strokeWidth={1.2}
                      strokeLinecap="round" opacity={0.75}
                    />
                  </G>
                ))}

                {/* Tip dot */}
                {count > 0 && (
                  <Circle cx={tipX} cy={tipY} r={3.5} fill={area.color} opacity={0.9} />
                )}
              </G>
            );
          })}

          {/* Center */}
          <Circle cx={CX} cy={CY} r={7} fill={COLORS.accent} opacity={0.9} />
          <Circle cx={CX} cy={CY} r={3} fill={COLORS.white} opacity={0.95} />
        </Svg>

        {/* Emoji labels overlaid on top of SVG */}
        {AREAS.map((area, i) => {
          const count      = areaCounts[area.id] || 0;
          const fraction   = Math.min(count / MAX_DEEDS, 1);
          const length     = MIN_R + (MAX_R - MIN_R) * fraction;
          const angle      = armAngle(i);
          const labelDist  = length + 18;
          const lx = (CX + labelDist * Math.cos(angle)) * svgScale;
          const ly = (CY + labelDist * Math.sin(angle)) * svgScale;
          return (
            <View
              key={area.id}
              pointerEvents="none"
              style={[styles.labelOverlay, { left: lx - 10, top: ly - 10 }]}
            >
              <Text style={styles.labelEmoji}>{area.icon}</Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <Text style={styles.legendHeading}>Per-area deed count</Text>
      <View style={styles.legend}>
        {AREAS.map(area => {
          const count = areaCounts[area.id] || 0;
          const frac  = Math.min(count / MAX_DEEDS, 1);
          return (
            <View key={area.id} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: area.color }]} />
              <Text style={styles.legendEmoji}>{area.icon}</Text>
              <Text style={styles.legendName}>{area.name}</Text>
              <View style={styles.legendBarBg}>
                <View style={[
                  styles.legendBarFill,
                  { width: `${frac * 100}%`, backgroundColor: area.color },
                ]} />
              </View>
              <Text style={[styles.legendCount, { color: area.color }]}>{count}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.maxNote}>Arms reach full length at {MAX_DEEDS} deeds</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingBottom: SPACING.xxl,
    alignItems:    'center',
  },
  screenTitle: {
    alignSelf:        'flex-start',
    color:            COLORS.text,
    fontSize:         FONT.lg,
    fontWeight:       '700',
    paddingHorizontal: SPACING.md,
    paddingTop:       SPACING.md,
    paddingBottom:    2,
  },
  subtitle: {
    alignSelf:        'flex-start',
    color:            COLORS.textMuted,
    fontSize:         FONT.sm,
    paddingHorizontal: SPACING.md,
    marginBottom:     SPACING.md,
  },
  svgWrapper: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  labelOverlay: {
    position:       'absolute',
    width:          20,
    height:         20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  labelEmoji: {
    fontSize: 13,
  },
  legendHeading: {
    alignSelf:         'flex-start',
    color:             COLORS.textMuted,
    fontSize:          FONT.sm,
    fontWeight:        '600',
    textTransform:     'uppercase',
    letterSpacing:     0.8,
    paddingHorizontal: SPACING.md,
    marginBottom:      SPACING.sm,
  },
  legend: {
    width:             '100%',
    paddingHorizontal: SPACING.md,
    gap:               SPACING.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.sm,
  },
  legendDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    flexShrink:   0,
  },
  legendEmoji: {
    fontSize:  14,
    width:     20,
    flexShrink: 0,
  },
  legendName: {
    color:      COLORS.textLight,
    fontSize:   FONT.sm,
    width:      90,
    flexShrink: 0,
  },
  legendBarBg: {
    flex:            1,
    height:          5,
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.full,
    overflow:        'hidden',
  },
  legendBarFill: {
    height:       '100%',
    borderRadius: RADIUS.full,
  },
  legendCount: {
    fontSize:   FONT.sm,
    fontWeight: '700',
    width:      28,
    textAlign:  'right',
    flexShrink: 0,
  },
  maxNote: {
    color:    COLORS.textMuted,
    fontSize: 10,
    marginTop: SPACING.md,
    opacity:  0.55,
  },
});
