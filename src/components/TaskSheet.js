import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import BottomSheet from './BottomSheet';
import { AREAS } from '../constants/areas';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

const DEFAULT_TOKENS = 10;

export default function TaskSheet({ visible, task, onClose, onSave }) {
  const [name,          setName]          = useState('');
  const [selectedArea,  setSelectedArea]  = useState(AREAS[0].id);
  const [tokens,        setTokens]        = useState(String(DEFAULT_TOKENS));

  // Pre-fill when editing
  useEffect(() => {
    if (visible) {
      setName(task?.name ?? '');
      setSelectedArea(task?.area ?? AREAS[0].id);
      setTokens(String(task?.tokens ?? DEFAULT_TOKENS));
    }
  }, [visible, task]);

  const isEditing  = !!task;
  const tokenNum   = parseInt(tokens, 10);
  const canSave    = name.trim().length > 0 && !isNaN(tokenNum) && tokenNum > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ name: name.trim(), area: selectedArea, tokens: tokenNum });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'New Task'}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Name */}
        <Text style={styles.label}>Task name *</Text>
        <TextInput
          style={styles.input}
          placeholder="What do you want to do?"
          placeholderTextColor={COLORS.textMuted}
          value={name}
          onChangeText={setName}
          maxLength={140}
          returnKeyType="done"
          autoFocus={!isEditing}
        />

        {/* Area picker */}
        <Text style={styles.label}>Life area</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.areaScroll}
        >
          {AREAS.map(a => {
            const active = selectedArea === a.id;
            return (
              <TouchableOpacity
                key={a.id}
                style={[
                  styles.areaChip,
                  active && { backgroundColor: a.color + '33', borderColor: a.color },
                ]}
                onPress={() => setSelectedArea(a.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.areaChipIcon}>{a.icon}</Text>
                <Text style={[styles.areaChipName, active && { color: a.color }]}>
                  {a.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Token value */}
        <Text style={styles.label}>Token reward</Text>
        <View style={styles.tokenRow}>
          <TouchableOpacity
            style={styles.tokenAdj}
            onPress={() => setTokens(t => String(Math.max(1, (parseInt(t, 10) || 0) - 5)))}
          >
            <Text style={styles.tokenAdjText}>−</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.tokenInput}
            value={tokens}
            onChangeText={t => setTokens(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={4}
            selectTextOnFocus
          />

          <TouchableOpacity
            style={styles.tokenAdj}
            onPress={() => setTokens(t => String((parseInt(t, 10) || 0) + 5))}
          >
            <Text style={styles.tokenAdjText}>+</Text>
          </TouchableOpacity>

          <Text style={styles.tokenSuffix}>tokens</Text>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Create Task'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  label: {
    color:        COLORS.textMuted,
    fontSize:     FONT.sm,
    fontWeight:   '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom:  SPACING.xs,
    marginTop:     SPACING.sm,
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
  areaScroll: {
    gap:            SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingRight:   SPACING.sm,
  },
  areaChip: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.full,
    borderWidth:     1,
    borderColor:     COLORS.border,
    paddingVertical:   6,
    paddingHorizontal: SPACING.sm,
  },
  areaChipIcon: { fontSize: 14 },
  areaChipName: {
    color:      COLORS.textMuted,
    fontSize:   FONT.sm,
    fontWeight: '500',
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.sm,
    marginBottom:  SPACING.sm,
  },
  tokenAdj: {
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.sm,
    borderWidth:     1,
    borderColor:     COLORS.border,
    width:           40,
    height:          40,
    alignItems:      'center',
    justifyContent:  'center',
  },
  tokenAdjText: {
    color:      COLORS.text,
    fontSize:   FONT.lg,
    fontWeight: '300',
    lineHeight: 24,
  },
  tokenInput: {
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.sm,
    borderWidth:     1,
    borderColor:     COLORS.border,
    width:           64,
    height:          40,
    color:           COLORS.gold,
    fontSize:        FONT.md,
    fontWeight:      '700',
    textAlign:       'center',
  },
  tokenSuffix: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
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
