import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import BottomSheet from './BottomSheet';
import { AREAS } from '../constants/areas';
import { formatDateLabel, formatTime } from '../utils/date';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

export default function EntryEditSheet({ visible, entry, onClose, onSave }) {
  const [selectedArea, setSelectedArea] = useState(AREAS[0].id);
  const [note,         setNote]         = useState('');
  const [tokens,       setTokens]       = useState('10');

  useEffect(() => {
    if (visible && entry) {
      setSelectedArea(entry.area);
      setNote(entry.note || '');
      setTokens(String(entry.tokens));
    }
  }, [visible, entry]);

  if (!entry) return null;

  const tokenNum = parseInt(tokens, 10);
  const canSave  = !isNaN(tokenNum) && tokenNum > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ ...entry, area: selectedArea, note: note.trim(), tokens: tokenNum });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Edit Entry">
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Timestamp (read-only) */}
        <View style={styles.timestampRow}>
          <Text style={styles.timestampLabel}>
            {formatDateLabel(entry.date)} · {formatTime(entry.timestamp)}
          </Text>
          {entry.taskId && <Text style={styles.taskBadge}>From task</Text>}
        </View>

        {/* Area selector */}
        <Text style={styles.label}>Area</Text>
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
                <Text style={styles.areaIcon}>{a.icon}</Text>
                <Text style={[styles.areaName, active && { color: a.color }]}>
                  {a.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Note */}
        <Text style={styles.label}>Note <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Add or edit a note…"
          placeholderTextColor={COLORS.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={300}
        />

        {/* Tokens */}
        <Text style={styles.label}>Token value</Text>
        <View style={styles.tokenRow}>
          <TouchableOpacity
            style={styles.adj}
            onPress={() => setTokens(t => String(Math.max(1, (parseInt(t, 10) || 0) - 1)))}
          >
            <Text style={styles.adjText}>−</Text>
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
            style={styles.adj}
            onPress={() => setTokens(t => String((parseInt(t, 10) || 0) + 1))}
          >
            <Text style={styles.adjText}>+</Text>
          </TouchableOpacity>
          <Text style={styles.tokenSuffix}>tokens</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  timestampRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            SPACING.sm,
    marginBottom:   SPACING.md,
  },
  timestampLabel: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },
  taskBadge: {
    backgroundColor: COLORS.accent + '22',
    borderRadius:    RADIUS.full,
    paddingVertical:   2,
    paddingHorizontal: SPACING.sm,
    color:           COLORS.accent,
    fontSize:        10,
    fontWeight:      '600',
  },
  label: {
    color:         COLORS.textMuted,
    fontSize:      FONT.sm,
    fontWeight:    '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom:  SPACING.xs,
    marginTop:     SPACING.xs,
  },
  optional: {
    fontWeight:    '400',
    textTransform: 'none',
    fontStyle:     'italic',
    letterSpacing: 0,
  },
  areaScroll: {
    gap:             SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingRight:    SPACING.sm,
    marginBottom:    SPACING.sm,
  },
  areaChip: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.full,
    borderWidth:     1,
    borderColor:     COLORS.border,
    paddingVertical:   5,
    paddingHorizontal: SPACING.sm,
  },
  areaIcon: { fontSize: 13 },
  areaName: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },
  noteInput: {
    backgroundColor:   COLORS.surface2,
    borderRadius:      RADIUS.md,
    padding:           SPACING.sm + 4,
    color:             COLORS.text,
    fontSize:          FONT.base,
    minHeight:         72,
    textAlignVertical: 'top',
    borderWidth:       1,
    borderColor:       COLORS.border,
    marginBottom:      SPACING.sm,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.sm,
    marginBottom:  SPACING.md,
  },
  adj: {
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.sm,
    borderWidth:     1,
    borderColor:     COLORS.border,
    width:           40,
    height:          40,
    alignItems:      'center',
    justifyContent:  'center',
  },
  adjText: {
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
    marginBottom:    SPACING.xs,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    color:      COLORS.bg,
    fontSize:   FONT.base,
    fontWeight: '700',
  },
});
