import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import TaskRow    from '../components/TaskRow';
import TaskSheet  from '../components/TaskSheet';
import BundleSheet from '../components/BundleSheet';
import { AREA_MAP } from '../constants/areas';
import { getTodayStr } from '../utils/date';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

// ─── Bundle card ─────────────────────────────────────────────────────────────

function BundleCard({ bundle, todayEntries, todayCompletions, onCompleteTask, onUncompleteTask, onEdit, onDelete }) {
  const today = getTodayStr();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteTimer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(deleteTimer.current), []);

  // Which tasks are done today
  const doneTaskIds = useMemo(() => new Set(
    todayEntries
      .filter(e => e.bundleId === bundle.id)
      .map(e => e.bundleTaskId)
  ), [todayEntries, bundle.id]);

  const completedCount = bundle.tasks.filter(t => doneTaskIds.has(t.id)).length;
  const totalCount     = bundle.tasks.length;
  const isComplete     = completedCount === totalCount && totalCount > 0;
  const wasCompleted   = todayCompletions.some(c => c.bundleId === bundle.id && c.date === today);

  const handleDeletePress = () => {
    if (confirmDelete) {
      clearTimeout(deleteTimer.current);
      setConfirmDelete(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      onDelete(bundle.id);
    } else {
      setConfirmDelete(true);
      deleteTimer.current = setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <View style={[styles.bundleCard, isComplete && styles.bundleCardComplete]}>
      {/* Bundle header */}
      <View style={styles.bundleHeader}>
        <View style={styles.bundleTitleRow}>
          <Text style={styles.bundleName}>{bundle.name}</Text>
          {isComplete && (
            <Text style={styles.completeTag}>
              {wasCompleted ? `Complete ✦ +${bundle.bonusTokens}` : 'Complete'}
            </Text>
          )}
        </View>
        <View style={styles.bundleMeta}>
          <Text style={styles.bundleProgress}>
            {completedCount}/{totalCount} tasks
          </Text>
          <Text style={styles.bundleBonus}>✦ +{bundle.bonusTokens} bonus</Text>
        </View>
      </View>

      {/* Task rows — tap to complete, tap again to undo */}
      {bundle.tasks.map(task => {
        const done = doneTaskIds.has(task.id);
        const area = AREA_MAP[task.area] ?? AREA_MAP['goals'];
        return (
          <TouchableOpacity
            key={task.id}
            style={[styles.bundleTask, done && styles.bundleTaskDone]}
            onPress={() => done ? onUncompleteTask(bundle, task) : onCompleteTask(bundle, task)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={done ? `Undo ${task.name}` : `Complete ${task.name}`}
          >
            <View style={[styles.taskCircle, done && { backgroundColor: area.color, borderColor: area.color }]}>
              {done && <Text style={styles.taskCheck}>✓</Text>}
            </View>
            <View style={styles.taskInfo}>
              <Text style={[styles.taskName, done && styles.taskNameDone]}>{task.name}</Text>
              <View style={[styles.areaBadge, { backgroundColor: area.color + '22' }]}>
                <Text style={styles.areaIcon}>{area.icon}</Text>
                <Text style={[styles.areaName, { color: area.color }]}>{area.name}</Text>
              </View>
            </View>
            {done
              ? <Text style={styles.undoHint}>↺ undo</Text>
              : <Text style={styles.taskTokens}>✦ {task.tokens}</Text>}
          </TouchableOpacity>
        );
      })}

      {/* Footer actions */}
      <View style={styles.bundleActions}>
        <TouchableOpacity onPress={() => onEdit(bundle)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Text style={styles.editBtn}>✎ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeletePress} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Text style={[styles.deleteBtn, confirmDelete && styles.deleteBtnConfirm]}>
            {confirmDelete ? 'sure?' : '✕'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function TasksScreen({ showToast }) {
  const { state, adultingStats, addTask, editTask, deleteTask, completeTask,
          addBundle, editBundle, deleteBundle, completeBundleTask,
          uncompleteBundleTask } = useApp();
  const today = getTodayStr();

  const [taskSheetOpen,   setTaskSheetOpen]   = useState(false);
  const [bundleSheetOpen, setBundleSheetOpen] = useState(false);
  const [editingTask,     setEditingTask]     = useState(null);
  const [editingBundle,   setEditingBundle]   = useState(null);

  // Today's entries and completions (memoized)
  const todayEntries     = useMemo(() => state.entries.filter(e => e.date === today), [state.entries, today]);
  const todayCompletions = useMemo(() => state.bundleCompletions.filter(c => c.date === today), [state.bundleCompletions, today]);

  // ─── Task handlers ───────────────────────────────────────────────────────

  const openAddTask = () => { setEditingTask(null); setTaskSheetOpen(true); };
  const openEditTask = useCallback((task) => { setEditingTask(task); setTaskSheetOpen(true); }, []);

  const handleSaveTask = useCallback((fields) => {
    if (editingTask) { editTask({ ...editingTask, ...fields }); showToast?.('Task updated', 'info'); }
    else             { addTask(fields); showToast?.('Task created', 'info'); }
    setTaskSheetOpen(false);
    setEditingTask(null);
  }, [editingTask, addTask, editTask, showToast]);

  const handleCompleteTask = useCallback((task) => {
    completeTask(task);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast?.(`+${task.tokens} tokens · "${task.name}" done`, 'success');
  }, [completeTask, showToast]);

  const handleDeleteTask = useCallback((id) => {
    deleteTask(id);
    showToast?.('Task deleted', 'info');
  }, [deleteTask, showToast]);

  // ─── Bundle handlers ─────────────────────────────────────────────────────

  const openAddBundle  = () => { setEditingBundle(null); setBundleSheetOpen(true); };
  const openEditBundle = useCallback((bundle) => { setEditingBundle(bundle); setBundleSheetOpen(true); }, []);

  const handleSaveBundle = useCallback((fields) => {
    if (editingBundle) { editBundle({ ...editingBundle, ...fields }); showToast?.('Bundle updated', 'info'); }
    else               { addBundle(fields); showToast?.('Bundle created', 'info'); }
    setBundleSheetOpen(false);
    setEditingBundle(null);
  }, [editingBundle, addBundle, editBundle, showToast]);

  const handleDeleteBundle = useCallback((id) => {
    deleteBundle(id);
    showToast?.('Bundle deleted', 'info');
  }, [deleteBundle, showToast]);

  const handleCompleteBundleTask = useCallback((bundle, task) => {
    const result = completeBundleTask(bundle, task);
    if (!result) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (result.completion) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showToast?.(`Bundle complete · +${result.completion.bonusTokens} bonus tokens`, 'success');
    }
  }, [completeBundleTask, showToast]);

  const handleUncompleteBundleTask = useCallback((bundle, task) => {
    const result = uncompleteBundleTask(bundle, task);
    if (!result) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const bonusNote = result.bonus > 0 ? ` and ${result.bonus} bonus` : '';
    showToast?.(`Undone · −${result.tokens} tokens${bonusNote}`, 'info');
  }, [uncompleteBundleTask, showToast]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Adulting status bar (shown only if bundles exist) */}
      {state.bundles.length > 0 && (
        <View style={styles.adultingBar}>
          <Text style={styles.adultingText}>
            Lv.{adultingStats.adultingLevel} {adultingStats.adultingLevelName}
          </Text>
          <Text style={styles.adultingStreak}>
            🏠 {adultingStats.adultingStreak} day adulting streak
          </Text>
          {adultingStats.currentWeekFailed && (
            <Text style={styles.forfeitMsg}>
              Day missed — this week's bundle tokens forfeited, streak reset.
            </Text>
          )}
        </View>
      )}

      {/* ── Tasks section ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tasks</Text>
        <TouchableOpacity style={styles.newBtn} onPress={openAddTask} activeOpacity={0.8}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {state.tasks.length === 0 ? (
        <View style={styles.emptySmall}>
          <Text style={styles.emptySmallText}>No tasks yet.</Text>
          <TouchableOpacity onPress={openAddTask}>
            <Text style={styles.emptySmallLink}>Create one</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.taskList}>
          {state.tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={handleCompleteTask}
              onEdit={openEditTask}
              onDelete={handleDeleteTask}
            />
          ))}
        </View>
      )}

      {/* ── Bundles section ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bundles</Text>
        <TouchableOpacity style={styles.newBtn} onPress={openAddBundle} activeOpacity={0.8}>
          <Text style={styles.newBtnText}>+ Bundle</Text>
        </TouchableOpacity>
      </View>

      {state.bundles.length === 0 ? (
        <View style={styles.emptyBundles}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No bundles yet</Text>
          <Text style={styles.emptySubtitle}>
            Group daily tasks into a bundle. Complete all tasks in a day to earn bonus tokens and build your adulting streak.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={openAddBundle} activeOpacity={0.8}>
            <Text style={styles.emptyBtnText}>Create first bundle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bundleList}>
          {state.bundles.map(bundle => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              todayEntries={todayEntries}
              todayCompletions={todayCompletions}
              onCompleteTask={handleCompleteBundleTask}
              onUncompleteTask={handleUncompleteBundleTask}
              onEdit={openEditBundle}
              onDelete={handleDeleteBundle}
            />
          ))}
        </View>
      )}

      <View style={styles.bottomPad} />

      {/* Sheets */}
      <TaskSheet
        visible={taskSheetOpen}
        task={editingTask}
        onClose={() => { setTaskSheetOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
      />
      <BundleSheet
        visible={bundleSheetOpen}
        bundle={editingBundle}
        onClose={() => { setBundleSheetOpen(false); setEditingBundle(null); }}
        onSave={handleSaveBundle}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.bg,
  },
  adultingBar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.sm,
    gap:               3,
  },
  adultingText: {
    color:      COLORS.accent2,
    fontSize:   FONT.sm,
    fontWeight: '700',
  },
  adultingStreak: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },
  forfeitMsg: {
    color:     COLORS.textMuted,
    fontSize:  FONT.sm,
    marginTop: 2,
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop:        SPACING.md,
    paddingBottom:     SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    color:      COLORS.text,
    fontSize:   FONT.lg,
    fontWeight: '700',
  },
  newBtn: {
    backgroundColor:   COLORS.accent,
    borderRadius:      RADIUS.full,
    paddingVertical:   6,
    paddingHorizontal: SPACING.md,
  },
  newBtnText: {
    color:      COLORS.bg,
    fontSize:   FONT.sm,
    fontWeight: '700',
  },
  taskList: {
    paddingTop: SPACING.sm,
  },
  emptySmall: {
    flexDirection:     'row',
    gap:               SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.md,
  },
  emptySmallText: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },
  emptySmallLink: {
    color:      COLORS.accent,
    fontSize:   FONT.sm,
    fontWeight: '600',
  },
  // Bundle styles
  bundleList: {
    padding:    SPACING.md,
    gap:        SPACING.md,
    paddingTop: SPACING.sm,
  },
  bundleCard: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    overflow:        'hidden',
  },
  bundleCardComplete: {
    borderColor: COLORS.success + '66',
  },
  bundleHeader: {
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap:               2,
  },
  bundleTitleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.sm,
  },
  bundleName: {
    color:      COLORS.text,
    fontSize:   FONT.base,
    fontWeight: '700',
    flex:       1,
  },
  completeTag: {
    backgroundColor: COLORS.success + '22',
    color:           COLORS.success,
    fontSize:        11,
    fontWeight:      '700',
    borderRadius:    RADIUS.full,
    paddingVertical:   2,
    paddingHorizontal: SPACING.sm,
  },
  bundleMeta: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.sm,
  },
  bundleProgress: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },
  bundleBonus: {
    color:      COLORS.gold,
    fontSize:   FONT.sm,
    fontWeight: '600',
  },
  bundleTask: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bundleTaskDone: {
    opacity: 0.7,
  },
  taskCircle: {
    width:          22,
    height:         22,
    borderRadius:   11,
    borderWidth:    2,
    borderColor:    COLORS.border,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  taskCheck: {
    color:      COLORS.white,
    fontSize:   11,
    fontWeight: '800',
    lineHeight: 14,
  },
  taskInfo: {
    flex: 1,
    gap:  2,
  },
  taskName: {
    color:      COLORS.text,
    fontSize:   FONT.sm,
    fontWeight: '600',
  },
  taskNameDone: {
    textDecorationLine: 'line-through',
    color:              COLORS.textMuted,
  },
  areaBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               3,
    borderRadius:      RADIUS.full,
    paddingVertical:   2,
    paddingHorizontal: 6,
    alignSelf:         'flex-start',
  },
  areaIcon: { fontSize: 10 },
  areaName: {
    fontSize:   10,
    fontWeight: '600',
  },
  taskTokens: {
    color:      COLORS.gold,
    fontSize:   FONT.sm,
    fontWeight: '700',
  },
  taskTokensDone: {
    color: COLORS.textMuted,
  },
  undoHint: {
    color:      COLORS.accent,
    fontSize:   FONT.sm,
    fontWeight: '600',
  },
  bundleActions: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.sm,
  },
  editBtn: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },
  deleteBtn: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },
  deleteBtnConfirm: {
    color:      COLORS.danger,
    fontWeight: '700',
  },
  emptyBundles: {
    alignItems:  'center',
    padding:     SPACING.xl,
    gap:         SPACING.sm,
  },
  emptyIcon: {
    fontSize:     40,
    marginBottom: SPACING.xs,
  },
  emptyTitle: {
    color:      COLORS.text,
    fontSize:   FONT.md,
    fontWeight: '700',
  },
  emptySubtitle: {
    color:      COLORS.textMuted,
    fontSize:   FONT.sm,
    textAlign:  'center',
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor:   COLORS.accent,
    borderRadius:      RADIUS.md,
    paddingVertical:   SPACING.sm + 2,
    paddingHorizontal: SPACING.xl,
    marginTop:         SPACING.xs,
  },
  emptyBtnText: {
    color:      COLORS.bg,
    fontSize:   FONT.base,
    fontWeight: '700',
  },
  bottomPad: {
    height: SPACING.xxl,
  },
});
