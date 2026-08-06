import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import TaskRow   from '../components/TaskRow';
import TaskSheet from '../components/TaskSheet';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

export default function TasksScreen({ showToast }) {
  const { state, addTask, editTask, deleteTask, completeTask } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const openAdd = () => {
    setEditingTask(null);
    setSheetOpen(true);
  };

  const openEdit = useCallback((task) => {
    setEditingTask(task);
    setSheetOpen(true);
  }, []);

  const handleSave = useCallback((fields) => {
    if (editingTask) {
      editTask({ ...editingTask, ...fields });
      showToast?.('Task updated', 'info');
    } else {
      addTask(fields);
      showToast?.('Task created', 'info');
    }
    setSheetOpen(false);
    setEditingTask(null);
  }, [editingTask, addTask, editTask, showToast]);

  const handleComplete = useCallback((task) => {
    completeTask(task);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast?.(`+${task.tokens} tokens · "${task.name}" done!`, 'success');
  }, [completeTask, showToast]);

  const handleDelete = useCallback((id) => {
    deleteTask(id);
    showToast?.('Task deleted', 'info');
  }, [deleteTask, showToast]);

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Tasks</Text>
        <TouchableOpacity style={styles.newBtn} onPress={openAdd} activeOpacity={0.8}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Task list */}
      {state.tasks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No tasks yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your own tasks with custom token values.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={openAdd} activeOpacity={0.8}>
            <Text style={styles.emptyBtnText}>Create first task</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {state.tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </ScrollView>
      )}

      <TaskSheet
        visible={sheetOpen}
        task={editingTask}
        onClose={() => { setSheetOpen(false); setEditingTask(null); }}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.bg,
  },
  headerRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  screenTitle: {
    color:      COLORS.text,
    fontSize:   FONT.lg,
    fontWeight: '700',
  },
  newBtn: {
    backgroundColor: COLORS.accent,
    borderRadius:    RADIUS.full,
    paddingVertical:   6,
    paddingHorizontal: SPACING.md,
  },
  newBtnText: {
    color:      COLORS.bg,
    fontSize:   FONT.sm,
    fontWeight: '700',
  },
  list: {
    paddingTop:    SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  empty: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        SPACING.xl,
    gap:            SPACING.sm,
  },
  emptyIcon: {
    fontSize:     48,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    color:      COLORS.text,
    fontSize:   FONT.lg,
    fontWeight: '700',
  },
  emptySubtitle: {
    color:     COLORS.textMuted,
    fontSize:  FONT.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    backgroundColor: COLORS.accent,
    borderRadius:    RADIUS.md,
    paddingVertical:   SPACING.sm + 2,
    paddingHorizontal: SPACING.xl,
    marginTop:       SPACING.sm,
  },
  emptyBtnText: {
    color:      COLORS.bg,
    fontSize:   FONT.base,
    fontWeight: '700',
  },
});
