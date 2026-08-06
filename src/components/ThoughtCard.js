import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  TextInput, StyleSheet, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import BottomSheet from './BottomSheet';
import { BUILTIN_QUOTES } from '../constants/quotes';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

function pickRandom(arr, excludeIdx) {
  if (arr.length === 0) return { text: '', idx: -1 };
  if (arr.length === 1) return { text: arr[0], idx: 0 };
  let idx;
  do { idx = Math.floor(Math.random() * arr.length); } while (idx === excludeIdx);
  return { text: arr[idx], idx };
}

export default function ThoughtCard() {
  const { state, addUserQuote, deleteUserQuote } = useApp();
  const allQuotes = [...BUILTIN_QUOTES, ...state.userQuotes];

  const initial = pickRandom(allQuotes, -1);
  const [quoteText, setQuoteText]   = useState(initial.text);
  const [quoteIdx,  setQuoteIdx]    = useState(initial.idx);
  const [manageOpen, setManageOpen] = useState(false);
  const [newQuote, setNewQuote]     = useState('');

  const slideAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const shuffle = useCallback(() => {
    const updated = [...BUILTIN_QUOTES, ...state.userQuotes];
    if (updated.length <= 1) return;

    Haptics.selectionAsync().catch(() => {});

    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: -24, duration: 160, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0,   duration: 160, useNativeDriver: true }),
    ]).start(() => {
      const next = pickRandom(updated, quoteIdx);
      setQuoteText(next.text);
      setQuoteIdx(next.idx);
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(slideAnim,   { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  }, [quoteIdx, state.userQuotes]);

  const handleAddQuote = () => {
    const text = newQuote.trim();
    if (!text) return;
    addUserQuote(text);
    setNewQuote('');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={shuffle}
        activeOpacity={0.85}
      >
        <View style={styles.row}>
          <Text style={styles.cardLabel}>THOUGHT</Text>
          <TouchableOpacity
            onPress={() => setManageOpen(true)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Text style={styles.manageLink}>Manage</Text>
          </TouchableOpacity>
        </View>
        <Animated.Text
          style={[styles.quoteText, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}
          numberOfLines={3}
        >
          {quoteText || 'Tap to see a thought.'}
        </Animated.Text>
        <Text style={styles.tapHint}>tap for another</Text>
      </TouchableOpacity>

      {/* Manage Quotes Sheet */}
      <BottomSheet
        visible={manageOpen}
        onClose={() => setManageOpen(false)}
        title="Manage Quotes"
      >
        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
          {/* User-added quotes */}
          {state.userQuotes.length === 0 ? (
            <Text style={styles.emptyNote}>No custom quotes yet. Add one below.</Text>
          ) : (
            state.userQuotes.map((q, i) => (
              <View key={i} style={styles.quoteRow}>
                <Text style={styles.quoteRowText} numberOfLines={2}>{q}</Text>
                <TouchableOpacity
                  onPress={() => deleteUserQuote(i)}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={styles.divider} />

          {/* Add new quote */}
          <Text style={styles.sectionLabel}>Add a quote</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your reflection…"
            placeholderTextColor={COLORS.textMuted}
            value={newQuote}
            onChangeText={setNewQuote}
            multiline
            maxLength={280}
          />
          <TouchableOpacity
            style={[styles.addBtn, !newQuote.trim() && styles.addBtnDisabled]}
            onPress={handleAddQuote}
            disabled={!newQuote.trim()}
          >
            <Text style={styles.addBtnText}>Add Quote</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Built-in quotes ({BUILTIN_QUOTES.length})</Text>
          {BUILTIN_QUOTES.map((q, i) => (
            <Text key={i} style={styles.builtinQuote} numberOfLines={2}>{q}</Text>
          ))}
        </ScrollView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginBottom:     SPACING.xs,
    backgroundColor:  COLORS.surface,
    borderRadius:     RADIUS.lg,
    padding:          SPACING.md,
    borderWidth:      1,
    borderColor:      COLORS.border,
  },
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginBottom:    SPACING.xs,
  },
  cardLabel: {
    fontSize:    10,
    fontWeight:  '700',
    letterSpacing: 1.2,
    color:       COLORS.accent,
  },
  manageLink: {
    fontSize: FONT.sm,
    color:    COLORS.textMuted,
  },
  quoteText: {
    color:      COLORS.text,
    fontSize:   FONT.base,
    lineHeight: 22,
    fontStyle:  'italic',
    minHeight:  44,
  },
  tapHint: {
    marginTop: SPACING.xs,
    fontSize:  10,
    color:     COLORS.textMuted,
    opacity:   0.6,
    textAlign: 'right',
  },

  // Sheet styles
  sheetScroll: {
    maxHeight: 440,
  },
  emptyNote: {
    color:        COLORS.textMuted,
    fontSize:     FONT.sm,
    textAlign:    'center',
    marginBottom: SPACING.md,
    fontStyle:    'italic',
  },
  quoteRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  quoteRowText: {
    flex:      1,
    color:     COLORS.text,
    fontSize:  FONT.sm,
    lineHeight: 18,
  },
  deleteBtn: {
    color:    COLORS.danger,
    fontSize: FONT.base,
    paddingTop: 1,
  },
  divider: {
    height:           1,
    backgroundColor:  COLORS.border,
    marginVertical:   SPACING.md,
  },
  sectionLabel: {
    color:        COLORS.textMuted,
    fontSize:     FONT.sm,
    fontWeight:   '600',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.md,
    padding:         SPACING.sm + 4,
    color:           COLORS.text,
    fontSize:        FONT.base,
    minHeight:       72,
    textAlignVertical: 'top',
    borderWidth:     1,
    borderColor:     COLORS.border,
    marginBottom:    SPACING.sm,
  },
  addBtn: {
    backgroundColor: COLORS.accent,
    borderRadius:    RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems:      'center',
    marginBottom:    SPACING.sm,
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    color:      COLORS.bg,
    fontSize:   FONT.base,
    fontWeight: '700',
  },
  builtinQuote: {
    color:          COLORS.textMuted,
    fontSize:       FONT.sm,
    lineHeight:     18,
    fontStyle:      'italic',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface2,
  },
});
