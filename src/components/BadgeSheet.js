import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import BottomSheet from './BottomSheet';
import { AREAS, AREA_MAP } from '../constants/areas';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

const METRIC_OPTIONS = [
  { id: 'total_tokens', label: 'Total Tokens', hint: 'e.g. 200' },
  { id: 'total_deeds',  label: 'Total Deeds',  hint: 'e.g. 50'  },
  { id: 'streak',       label: 'Streak (days)',hint: 'e.g. 7'   },
  { id: 'days_logged',  label: 'Days Logged',  hint: 'e.g. 30'  },
  { id: 'area_deeds',   label: 'Area Deeds',   hint: 'e.g. 10'  },
];

function autoDesc(metric, threshold, areaId) {
  const n = threshold || '?';
  switch (metric) {
    case 'total_tokens': return `Earn ${n} total tokens`;
    case 'total_deeds':  return `Log ${n} total deeds`;
    case 'streak':       return `Maintain a ${n}-day streak`;
    case 'days_logged':  return `Log on ${n} different days`;
    case 'area_deeds': {
      const areaName = AREA_MAP[areaId]?.name || 'an area';
      return `Log ${n} deeds in ${areaName}`;
    }
    default: return '';
  }
}

const DEFAULT_FORM = {
  icon:      '⭐',
  name:      '',
  desc:      '',
  metric:    'total_deeds',
  area:      AREAS[0].id,
  threshold: '10',
};

export default function BadgeSheet({ visible, badge, onClose, onSave }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const isEditing = !!badge;

  useEffect(() => {
    if (visible) {
      setForm(badge ? {
        icon:      badge.icon,
        name:      badge.name,
        desc:      badge.desc,
        metric:    badge.metric,
        area:      badge.area || AREAS[0].id,
        threshold: String(badge.threshold),
      } : DEFAULT_FORM);
    }
  }, [visible, badge]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const thresholdNum = parseInt(form.threshold, 10);
  const canSave = form.name.trim() && !isNaN(thresholdNum) && thresholdNum > 0;

  const effectiveDesc = form.desc.trim()
    || autoDesc(form.metric, thresholdNum, form.area);

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      icon:      form.icon.trim() || '⭐',
      name:      form.name.trim(),
      desc:      effectiveDesc,
      metric:    form.metric,
      area:      form.metric === 'area_deeds' ? form.area : undefined,
      threshold: thresholdNum,
    });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Edit Badge' : 'New Badge'}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Icon + Name row */}
        <View style={styles.iconNameRow}>
          <TextInput
            style={styles.iconInput}
            value={form.icon}
            onChangeText={v => set('icon', v)}
            maxLength={4}
            textAlign="center"
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Badge name *"
            placeholderTextColor={COLORS.textMuted}
            value={form.name}
            onChangeText={v => set('name', v)}
            maxLength={40}
          />
        </View>

        {/* Description (optional) */}
        <Text style={styles.label}>Description <Text style={styles.optional}>(auto-filled if blank)</Text></Text>
        <TextInput
          style={styles.input}
          placeholder={autoDesc(form.metric, thresholdNum || form.threshold, form.area)}
          placeholderTextColor={COLORS.textMuted}
          value={form.desc}
          onChangeText={v => set('desc', v)}
          maxLength={140}
        />

        {/* Metric selector */}
        <Text style={styles.label}>Metric</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {METRIC_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.chip, form.metric === opt.id && styles.chipActive]}
              onPress={() => set('metric', opt.id)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, form.metric === opt.id && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Area picker — only when metric is area_deeds */}
        {form.metric === 'area_deeds' && (
          <>
            <Text style={styles.label}>Area</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {AREAS.map(a => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.chip, form.area === a.id && { backgroundColor: a.color + '33', borderColor: a.color }]}
                  onPress={() => set('area', a.id)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.areaChipText}>{a.icon} {a.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Threshold */}
        <Text style={styles.label}>
          Target — <Text style={styles.hintText}>
            {METRIC_OPTIONS.find(m => m.id === form.metric)?.hint}
          </Text>
        </Text>
        <View style={styles.threshRow}>
          <TouchableOpacity
            style={styles.adj}
            onPress={() => set('threshold', String(Math.max(1, (thresholdNum || 0) - 1)))}
          >
            <Text style={styles.adjText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.threshInput}
            value={form.threshold}
            onChangeText={v => set('threshold', v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            selectTextOnFocus
          />
          <TouchableOpacity
            style={styles.adj}
            onPress={() => set('threshold', String((thresholdNum || 0) + 1))}
          >
            <Text style={styles.adjText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        {effectiveDesc ? (
          <View style={styles.preview}>
            <Text style={styles.previewIcon}>{form.icon || '⭐'}</Text>
            <Text style={styles.previewText}>{effectiveDesc}</Text>
          </View>
        ) : null}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Create Badge'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  iconNameRow: {
    flexDirection: 'row',
    gap:           SPACING.sm,
    marginBottom:  SPACING.sm,
    alignItems:    'center',
  },
  iconInput: {
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    width:           52,
    height:          48,
    fontSize:        24,
    color:           COLORS.text,
    textAlign:       'center',
  },
  input: {
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.md,
    padding:         SPACING.sm + 2,
    color:           COLORS.text,
    fontSize:        FONT.base,
    borderWidth:     1,
    borderColor:     COLORS.border,
    marginBottom:    SPACING.sm,
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
  hintText: {
    fontWeight:    '400',
    textTransform: 'none',
    letterSpacing: 0,
    color:         COLORS.textMuted,
    opacity:       0.7,
  },
  chips: {
    gap:             SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingRight:    SPACING.sm,
    marginBottom:    SPACING.sm,
  },
  chip: {
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.full,
    borderWidth:     1,
    borderColor:     COLORS.border,
    paddingVertical:   6,
    paddingHorizontal: SPACING.sm + 2,
  },
  chipActive: {
    backgroundColor: COLORS.accent + '22',
    borderColor:     COLORS.accent,
  },
  chipText: {
    color:      COLORS.textMuted,
    fontSize:   FONT.sm,
    fontWeight: '500',
  },
  chipTextActive: {
    color:      COLORS.accent,
    fontWeight: '700',
  },
  areaChipText: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },
  threshRow: {
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
    width:           44,
    height:          44,
    alignItems:      'center',
    justifyContent:  'center',
  },
  adjText: {
    color:      COLORS.text,
    fontSize:   FONT.xl,
    fontWeight: '300',
    lineHeight: 28,
  },
  threshInput: {
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.sm,
    borderWidth:     1,
    borderColor:     COLORS.border,
    width:           80,
    height:          44,
    color:           COLORS.gold,
    fontSize:        FONT.lg,
    fontWeight:      '700',
    textAlign:       'center',
  },
  preview: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.sm,
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.md,
    padding:         SPACING.sm + 2,
    marginBottom:    SPACING.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    borderStyle:     'dashed',
  },
  previewIcon: { fontSize: 22 },
  previewText: {
    color:    COLORS.textLight,
    fontSize: FONT.sm,
    flex:     1,
    fontStyle: 'italic',
  },
  saveBtn: {
    backgroundColor: COLORS.accent2,
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
