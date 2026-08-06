import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import BottomSheet from './BottomSheet';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

export default function LogDeedSheet({ visible, area, onClose, onLog }) {
  const [note, setNote] = useState('');

  // Reset note each time sheet opens for a new area
  useEffect(() => {
    if (visible) setNote('');
  }, [visible, area?.id]);

  if (!area) return null;

  const handleConfirm = () => {
    onLog(area, note.trim());
    setNote('');
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Log a Deed">
      {/* Area identity */}
      <View style={[styles.areaRow, { borderColor: area.color + '55' }]}>
        <View style={[styles.areaIcon, { backgroundColor: area.color + '22' }]}>
          <Text style={styles.areaEmoji}>{area.icon}</Text>
        </View>
        <View style={styles.areaInfo}>
          <Text style={styles.areaName}>{area.name}</Text>
          <View style={styles.tokenRow}>
            <Text style={styles.tokenLabel}>✦ </Text>
            <Text style={[styles.tokenValue, { color: area.color }]}>+{area.tokens} tokens</Text>
          </View>
        </View>
      </View>

      {/* Optional note */}
      <Text style={styles.noteLabel}>Note <Text style={styles.optional}>(optional)</Text></Text>
      <TextInput
        style={styles.noteInput}
        placeholder="What did you do? …"
        placeholderTextColor={COLORS.textMuted}
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={300}
        returnKeyType="done"
        blurOnSubmit
      />

      {/* Confirm */}
      <TouchableOpacity
        style={[styles.confirmBtn, { backgroundColor: area.color }]}
        onPress={handleConfirm}
        activeOpacity={0.85}
      >
        <Text style={styles.confirmText}>Log Deed</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  areaRow: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              SPACING.md,
    backgroundColor:  COLORS.surface2,
    borderRadius:     RADIUS.md,
    borderWidth:      1,
    padding:          SPACING.md,
    marginBottom:     SPACING.md,
  },
  areaIcon: {
    width:          56,
    height:         56,
    borderRadius:   RADIUS.md,
    alignItems:     'center',
    justifyContent: 'center',
  },
  areaEmoji: {
    fontSize: 28,
  },
  areaInfo: {
    flex: 1,
  },
  areaName: {
    color:      COLORS.text,
    fontSize:   FONT.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  tokenLabel: {
    color:    COLORS.gold,
    fontSize: FONT.sm,
  },
  tokenValue: {
    fontSize:   FONT.sm,
    fontWeight: '700',
  },
  noteLabel: {
    color:        COLORS.textLight,
    fontSize:     FONT.sm,
    fontWeight:   '600',
    marginBottom: SPACING.xs,
  },
  optional: {
    color:      COLORS.textMuted,
    fontWeight: '400',
    fontStyle:  'italic',
  },
  noteInput: {
    backgroundColor:   COLORS.surface2,
    borderRadius:      RADIUS.md,
    padding:           SPACING.sm + 4,
    color:             COLORS.text,
    fontSize:          FONT.base,
    minHeight:         80,
    textAlignVertical: 'top',
    borderWidth:       1,
    borderColor:       COLORS.border,
    marginBottom:      SPACING.md,
  },
  confirmBtn: {
    borderRadius:    RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems:      'center',
    marginBottom:    SPACING.xs,
  },
  confirmText: {
    color:      COLORS.white,
    fontSize:   FONT.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
