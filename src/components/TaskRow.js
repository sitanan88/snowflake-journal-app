import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AREA_MAP } from '../constants/areas';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

const ROW_HEIGHT = 76;

export default function TaskRow({ task, onComplete, onEdit, onDelete }) {
  const area = AREA_MAP[task.area] ?? AREA_MAP['goals'];

  // Completion animation
  const checkScale  = useRef(new Animated.Value(1)).current;
  const rowHeight   = useRef(new Animated.Value(ROW_HEIGHT)).current;
  const rowOpacity  = useRef(new Animated.Value(1)).current;
  const [completing, setCompleting] = useState(false);

  // Double-tap delete
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteTimer = useRef(null);

  useEffect(() => () => clearTimeout(deleteTimer.current), []);

  const handleComplete = () => {
    if (completing) return;
    setCompleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Checkmark burst
    Animated.sequence([
      Animated.spring(checkScale, {
        toValue: 1.4, damping: 5, stiffness: 300, useNativeDriver: true,
      }),
      Animated.timing(checkScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    // Collapse row after brief pause
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(rowHeight,  { toValue: 0, duration: 280, useNativeDriver: false }),
        Animated.timing(rowOpacity, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start(() => onComplete(task));
    }, 420);
  };

  const handleDeletePress = () => {
    if (confirmDelete) {
      clearTimeout(deleteTimer.current);
      setConfirmDelete(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      onDelete(task.id);
    } else {
      setConfirmDelete(true);
      deleteTimer.current = setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <Animated.View style={[styles.wrapper, { height: rowHeight, opacity: rowOpacity }]}>
      <View style={[styles.card, { borderLeftColor: area.color }]}>
        {/* Complete circle */}
        <TouchableOpacity onPress={handleComplete} activeOpacity={0.7} disabled={completing}>
          <Animated.View
            style={[
              styles.circle,
              completing && { backgroundColor: area.color, borderColor: area.color },
              { transform: [{ scale: checkScale }] },
            ]}
          >
            {completing && <Text style={styles.checkmark}>✓</Text>}
          </Animated.View>
        </TouchableOpacity>

        {/* Task info */}
        <View style={styles.info}>
          <Text style={styles.taskName} numberOfLines={1}>{task.name}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.areaBadge, { backgroundColor: area.color + '22' }]}>
              <Text style={styles.areaIcon}>{area.icon}</Text>
              <Text style={[styles.areaName, { color: area.color }]}>{area.name}</Text>
            </View>
            <Text style={styles.tokens}>✦ {task.tokens}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onEdit(task)}
            hitSlop={{ top: 8, right: 4, bottom: 8, left: 4 }}
          >
            <Text style={styles.editBtn}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeletePress}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 4 }}
          >
            <Text style={[styles.deleteBtn, confirmDelete && styles.deleteBtnConfirm]}>
              {confirmDelete ? 'sure?' : '✕'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom:     SPACING.sm,
    borderRadius:     RADIUS.md,
    borderLeftWidth:  3,
    borderLeftColor:  COLORS.border,
    paddingVertical:  SPACING.sm + 2,
    paddingHorizontal: SPACING.sm + 4,
    gap:              SPACING.sm,
  },
  circle: {
    width:          26,
    height:         26,
    borderRadius:   13,
    borderWidth:    2,
    borderColor:    COLORS.border,
    alignItems:     'center',
    justifyContent: 'center',
  },
  checkmark: {
    color:      COLORS.white,
    fontSize:   13,
    fontWeight: '800',
    lineHeight: 16,
  },
  info: {
    flex: 1,
    gap:  3,
  },
  taskName: {
    color:      COLORS.text,
    fontSize:   FONT.base,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.sm,
  },
  areaBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             3,
    borderRadius:    RADIUS.full,
    paddingVertical:   2,
    paddingHorizontal: 7,
  },
  areaIcon: { fontSize: 11 },
  areaName: {
    fontSize:   11,
    fontWeight: '600',
  },
  tokens: {
    color:      COLORS.gold,
    fontSize:   FONT.sm,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.md,
  },
  editBtn: {
    color:    COLORS.textMuted,
    fontSize: FONT.md,
  },
  deleteBtn: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },
  deleteBtnConfirm: {
    color:      COLORS.danger,
    fontWeight: '700',
  },
});
