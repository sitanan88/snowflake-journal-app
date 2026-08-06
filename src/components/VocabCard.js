import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  TextInput, StyleSheet, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import BottomSheet from './BottomSheet';
import { genId } from '../utils/date';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

function pickRandom(arr, excludeId) {
  if (arr.length === 0) return null;
  if (arr.length === 1) return arr[0];
  let item;
  do { item = arr[Math.floor(Math.random() * arr.length)]; } while (item.id === excludeId);
  return item;
}

const EMPTY_FORM = { term: '', definition: '', example: '' };

export default function VocabCard() {
  const { state, addUserVocab, editUserVocab, deleteUserVocab } = useApp();

  const [currentVocab, setCurrentVocab] = useState(() => pickRandom(state.userVocab, null));
  const [manageOpen, setManageOpen]      = useState(false);
  const [editingId, setEditingId]        = useState(null); // null = adding new
  const [form, setForm]                  = useState(EMPTY_FORM);

  const slideAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Keep currentVocab in sync when vocab list changes
  const prevVocabLen = useRef(state.userVocab.length);
  if (state.userVocab.length !== prevVocabLen.current) {
    prevVocabLen.current = state.userVocab.length;
    if (!currentVocab && state.userVocab.length > 0) {
      setCurrentVocab(state.userVocab[0]);
    } else if (currentVocab && !state.userVocab.find(v => v.id === currentVocab.id)) {
      setCurrentVocab(state.userVocab[0] || null);
    }
  }

  const shuffle = useCallback(() => {
    if (state.userVocab.length <= 1) return;
    Haptics.selectionAsync().catch(() => {});

    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: -20, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0,   duration: 150, useNativeDriver: true }),
    ]).start(() => {
      const next = pickRandom(state.userVocab, currentVocab?.id);
      setCurrentVocab(next);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(slideAnim,   { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
    });
  }, [currentVocab, state.userVocab]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setManageOpen(true);
  };

  const openEdit = (vocab) => {
    setEditingId(vocab.id);
    setForm({ term: vocab.term, definition: vocab.definition, example: vocab.example || '' });
  };

  const handleSave = () => {
    const { term, definition, example } = form;
    if (!term.trim() || !definition.trim()) return;
    if (editingId) {
      editUserVocab({ id: editingId, term: term.trim(), definition: definition.trim(), example: example.trim() });
      setEditingId(null);
      setForm(EMPTY_FORM);
    } else {
      addUserVocab({ term: term.trim(), definition: definition.trim(), example: example.trim() });
      setForm(EMPTY_FORM);
    }
  };

  const hasVocab = state.userVocab.length > 0;

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={hasVocab ? shuffle : openAdd}
        activeOpacity={0.85}
      >
        <View style={styles.row}>
          <Text style={styles.cardLabel}>VOCAB</Text>
          <TouchableOpacity
            onPress={() => setManageOpen(true)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Text style={styles.manageLink}>Manage</Text>
          </TouchableOpacity>
        </View>

        {!hasVocab ? (
          <Text style={styles.emptyText}>No vocab yet — tap to add one</Text>
        ) : (
          <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: opacityAnim }}>
            <Text style={styles.term}>{currentVocab?.term}</Text>
            <Text style={styles.definition} numberOfLines={2}>{currentVocab?.definition}</Text>
            {!!currentVocab?.example && (
              <Text style={styles.example} numberOfLines={1}>e.g. {currentVocab.example}</Text>
            )}
          </Animated.View>
        )}
        {hasVocab && state.userVocab.length > 1 && (
          <Text style={styles.tapHint}>tap for another</Text>
        )}
      </TouchableOpacity>

      {/* Manage Vocab Sheet */}
      <BottomSheet
        visible={manageOpen}
        onClose={() => { setManageOpen(false); setEditingId(null); setForm(EMPTY_FORM); }}
        title="Manage Vocab"
      >
        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
          {/* Add / Edit form */}
          <Text style={styles.sectionLabel}>
            {editingId ? 'Edit entry' : 'Add a word'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Term *"
            placeholderTextColor={COLORS.textMuted}
            value={form.term}
            onChangeText={t => setForm(f => ({ ...f, term: t }))}
          />
          <TextInput
            style={[styles.input, styles.inputMulti]}
            placeholder="Definition *"
            placeholderTextColor={COLORS.textMuted}
            value={form.definition}
            onChangeText={t => setForm(f => ({ ...f, definition: t }))}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Example sentence (optional)"
            placeholderTextColor={COLORS.textMuted}
            value={form.example}
            onChangeText={t => setForm(f => ({ ...f, example: t }))}
          />
          <TouchableOpacity
            style={[styles.addBtn, (!form.term.trim() || !form.definition.trim()) && styles.addBtnDisabled]}
            onPress={handleSave}
            disabled={!form.term.trim() || !form.definition.trim()}
          >
            <Text style={styles.addBtnText}>{editingId ? 'Save Changes' : 'Add Word'}</Text>
          </TouchableOpacity>

          {editingId && (
            <TouchableOpacity onPress={() => { setEditingId(null); setForm(EMPTY_FORM); }}>
              <Text style={styles.cancelEdit}>Cancel edit</Text>
            </TouchableOpacity>
          )}

          {state.userVocab.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Your words ({state.userVocab.length})</Text>
              {state.userVocab.map(v => (
                <View key={v.id} style={styles.vocabRow}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => openEdit(v)}>
                    <Text style={styles.vocabTerm}>{v.term}</Text>
                    <Text style={styles.vocabDef} numberOfLines={1}>{v.definition}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteUserVocab(v.id)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <Text style={styles.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginBottom:     SPACING.sm,
    backgroundColor:  COLORS.surface,
    borderRadius:     RADIUS.md,
    padding:          SPACING.sm + 4,
    borderWidth:      1,
    borderColor:      COLORS.border,
    opacity:          0.85,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   4,
  },
  cardLabel: {
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 1.2,
    color:         COLORS.textMuted,
  },
  manageLink: {
    fontSize: FONT.sm,
    color:    COLORS.textMuted,
  },
  emptyText: {
    color:     COLORS.textMuted,
    fontSize:  FONT.sm,
    fontStyle: 'italic',
  },
  term: {
    color:      COLORS.textLight,
    fontSize:   FONT.sm,
    fontWeight: '600',
  },
  definition: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
    lineHeight: 18,
  },
  example: {
    color:     COLORS.textMuted,
    fontSize:  11,
    fontStyle: 'italic',
    marginTop: 2,
    opacity:   0.8,
  },
  tapHint: {
    marginTop: 4,
    fontSize:  9,
    color:     COLORS.textMuted,
    opacity:   0.5,
    textAlign: 'right',
  },

  // Sheet
  sheetScroll: { maxHeight: 480 },
  sectionLabel: {
    color:         COLORS.textMuted,
    fontSize:      FONT.sm,
    fontWeight:    '600',
    marginBottom:  SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.sm,
    padding:         SPACING.sm + 2,
    color:           COLORS.text,
    fontSize:        FONT.base,
    borderWidth:     1,
    borderColor:     COLORS.border,
    marginBottom:    SPACING.sm,
  },
  inputMulti: {
    minHeight:         60,
    textAlignVertical: 'top',
  },
  addBtn: {
    backgroundColor: COLORS.accent2,
    borderRadius:    RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems:      'center',
    marginBottom:    SPACING.sm,
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: {
    color:      COLORS.bg,
    fontSize:   FONT.base,
    fontWeight: '700',
  },
  cancelEdit: {
    color:     COLORS.textMuted,
    fontSize:  FONT.sm,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  divider: {
    height:          1,
    backgroundColor: COLORS.border,
    marginVertical:  SPACING.md,
  },
  vocabRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  vocabTerm: {
    color:      COLORS.text,
    fontSize:   FONT.sm,
    fontWeight: '600',
  },
  vocabDef: {
    color:    COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  deleteBtn: {
    color:    COLORS.danger,
    fontSize: FONT.base,
  },
});
