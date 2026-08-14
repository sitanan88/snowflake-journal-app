import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import BottomSheet from './BottomSheet';
import { AREAS } from '../constants/areas';
import { genId } from '../utils/date';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

const DEFAULT_BONUS = 15;

function emptyTask() {
  return { id: genId(), name: '', area: AREAS[0].id, tokens: 10 };
}

export default function BundleSheet({ visible, bundle, onClose, onSave }) {
  const [name,        setName]        = useState('');
  const [bonusTokens, setBonusTokens] = useState(String(DEFAULT_BONUS));
  const [tasks,       setTasks]       = useState([emptyTask()]);

  useEffect(() => {
    if (!visible) return;
    if (bundle) {
      setName(bundle.name);
      setBonusTokens(String(bundle.bonusTokens ?? DEFAULT_BONUS));
      setTasks(bundle.tasks.length > 0 ? bundle.tasks.map(t => ({ ...t })) : [emptyTask()]);
    } else {
      setName('');
      setBonusTokens(String(DEFAULT_BONUS));
      setTasks([emptyTask()]);
    }
  }, [visible, bundle]);

  const bonusNum  = parseInt(bonusTokens, 10);
  const canSave   = name.trim().length > 0
    && !isNaN(bonusNum) && bonusNum >= 0
    && tasks.length > 0
    && tasks.every(t => t.name.trim().length > 0 && t.tokens > 0);

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      name:        name.trim(),
      bonusTokens: bonusNum,
      tasks:       tasks.map(t => ({ ...t, name: t.name.trim() })),
    });
  };

  const updateTask = (idx, field, value) => {
    setTasks(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const addTask = () => setTasks(prev => [...prev, emptyTask()]);

  const removeTask = (idx) => {
    if (tasks.length === 1) return;
    setTasks(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={bundle ? 'Edit Bundle' : 'New Bundle'}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Bundle name */}
        <Text style={styles.label}>Bundle name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Morning Routine"
          placeholderTextColor={COLORS.textMuted}
          value={name}
          onChangeText={setName}
          maxLength={80}
          autoFocus={!bundle}
        />

        {/* Tasks */}
        <Text style={styles.label}>Tasks *</Text>
        {tasks.map((task, idx) => (
          <View key={task.id} style={styles.taskCard}>
            {/* Task name */}
            <TextInput
              style={styles.taskNameInput}
              placeholder={`Task ${idx + 1} name`}
              placeholderTextColor={COLORS.textMuted}
              value={task.name}
              onChangeText={v => updateTask(idx, 'name', v)}
              maxLength={100}
            />

            <View style={styles.taskMeta}>
              {/* Area picker */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.areaScroll}
              >
                {AREAS.map(a => {
                  const active = task.area === a.id;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.areaChip, active && { backgroundColor: a.color + '33', borderColor: a.color }]}
                      onPress={() => updateTask(idx, 'area', a.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.areaChipIcon}>{a.icon}</Text>
                      <Text style={[styles.areaChipName, active && { color: a.color }]}>{a.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Token + remove row */}
              <View style={styles.taskFooter}>
                <View style={styles.tokenRow}>
                  <TouchableOpacity
                    style={styles.tokenAdj}
                    onPress={() => updateTask(idx, 'tokens', Math.max(1, (task.tokens || 0) - 5))}
                  >
                    <Text style={styles.tokenAdjText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.tokenInput}
                    value={String(task.tokens)}
                    onChangeText={v => updateTask(idx, 'tokens', parseInt(v.replace(/[^0-9]/g, ''), 10) || 1)}
                    keyboardType="number-pad"
                    maxLength={4}
                    selectTextOnFocus
                  />
                  <TouchableOpacity
                    style={styles.tokenAdj}
                    onPress={() => updateTask(idx, 'tokens', (task.tokens || 0) + 5)}
                  >
                    <Text style={styles.tokenAdjText}>+</Text>
                  </TouchableOpacity>
                  <Text style={styles.tokenSuffix}>tokens</Text>
                </View>

                {tasks.length > 1 && (
                  <TouchableOpacity onPress={() => removeTask(idx)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addTaskBtn} onPress={addTask}>
          <Text style={styles.addTaskBtnText}>+ Add task</Text>
        </TouchableOpacity>

        {/* Bonus tokens */}
        <Text style={styles.label}>Completion bonus tokens</Text>
        <Text style={styles.hint}>Awarded when all tasks are done in one day</Text>
        <View style={styles.tokenRow}>
          <TouchableOpacity
            style={styles.tokenAdj}
            onPress={() => setBonusTokens(t => String(Math.max(0, (parseInt(t, 10) || 0) - 5)))}
          >
            <Text style={styles.tokenAdjText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.tokenInput}
            value={bonusTokens}
            onChangeText={t => setBonusTokens(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={4}
            selectTextOnFocus
          />
          <TouchableOpacity
            style={styles.tokenAdj}
            onPress={() => setBonusTokens(t => String((parseInt(t, 10) || 0) + 5))}
          >
            <Text style={styles.tokenAdjText}>+</Text>
          </TouchableOpacity>
          <Text style={styles.tokenSuffix}>bonus tokens</Text>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveBtnText}>{bundle ? 'Save Changes' : 'Create Bundle'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  label: {
    color:         COLORS.textMuted,
    fontSize:      FONT.sm,
    fontWeight:    '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom:  SPACING.xs,
    marginTop:     SPACING.sm,
  },
  hint: {
    color:        COLORS.textMuted,
    fontSize:     FONT.sm,
    marginBottom: SPACING.xs,
    marginTop:    -SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.md,
    padding:         SPACING.sm + 4,
    color:           COLORS.text,
    fontSize:        FONT.base,
    borderWidth:     1,
    borderColor:     COLORS.border,
    marginBottom:    SPACING.xs,
  },
  taskCard: {
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    padding:         SPACING.sm,
    marginBottom:    SPACING.sm,
    gap:             SPACING.xs,
  },
  taskNameInput: {
    color:       COLORS.text,
    fontSize:    FONT.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.xs,
  },
  taskMeta: {
    gap: SPACING.xs,
  },
  areaScroll: {
    gap:             SPACING.xs,
    paddingVertical: 2,
  },
  areaChip: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.full,
    borderWidth:     1,
    borderColor:     COLORS.border,
    paddingVertical:   4,
    paddingHorizontal: SPACING.sm,
  },
  areaChipIcon: { fontSize: 12 },
  areaChipName: {
    color:    COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  taskFooter: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.sm,
  },
  tokenAdj: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.sm,
    borderWidth:     1,
    borderColor:     COLORS.border,
    width:           34,
    height:          34,
    alignItems:      'center',
    justifyContent:  'center',
  },
  tokenAdjText: {
    color:      COLORS.text,
    fontSize:   FONT.md,
    fontWeight: '300',
    lineHeight: 22,
  },
  tokenInput: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.sm,
    borderWidth:     1,
    borderColor:     COLORS.border,
    width:           52,
    height:          34,
    color:           COLORS.gold,
    fontSize:        FONT.base,
    fontWeight:      '700',
    textAlign:       'center',
  },
  tokenSuffix: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },
  removeBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical:   4,
  },
  removeBtnText: {
    color:    COLORS.danger,
    fontSize: FONT.sm,
  },
  addTaskBtn: {
    borderWidth:   1,
    borderColor:   COLORS.border,
    borderStyle:   'dashed',
    borderRadius:  RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems:    'center',
    marginBottom:  SPACING.sm,
  },
  addTaskBtnText: {
    color:    COLORS.accent,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius:    RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems:      'center',
    marginTop:       SPACING.sm,
    marginBottom:    SPACING.xs,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    color:      COLORS.bg,
    fontSize:   FONT.base,
    fontWeight: '700',
  },
});
