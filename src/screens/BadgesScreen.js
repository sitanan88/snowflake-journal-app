import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { BUILTIN_BADGES } from '../constants/badges';
import BadgeCard  from '../components/BadgeCard';
import BadgeSheet from '../components/BadgeSheet';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

export default function BadgesScreen({ showToast, sessionUnlockedIds = [] }) {
  const { state, addCustomBadge, editCustomBadge, deleteCustomBadge } = useApp();
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);

  const openAdd = () => {
    setEditingBadge(null);
    setSheetOpen(true);
  };

  const openEdit = useCallback((badge) => {
    setEditingBadge(badge);
    setSheetOpen(true);
  }, []);

  const handleSave = useCallback((fields) => {
    if (editingBadge) {
      editCustomBadge({ ...editingBadge, ...fields });
      showToast?.('Badge updated', 'info');
    } else {
      addCustomBadge(fields);
      // Toast for immediate unlock is handled by App.js onBadgeUnlocked
    }
    setSheetOpen(false);
    setEditingBadge(null);
  }, [editingBadge, addCustomBadge, editCustomBadge, showToast]);

  const handleDelete = useCallback((id) => {
    deleteCustomBadge(id);
    showToast?.('Badge deleted', 'info');
  }, [deleteCustomBadge, showToast]);

  const unlockedCount =
    state.unlockedBuiltinIds.length +
    state.customBadges.filter(b => b.unlocked).length;

  const totalCount = BUILTIN_BADGES.length + state.customBadges.length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Badges</Text>
          <Text style={styles.subtitle}>{unlockedCount} / {totalCount} unlocked</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={openAdd} activeOpacity={0.8}>
          <Text style={styles.newBtnText}>+ Custom</Text>
        </TouchableOpacity>
      </View>

      {/* Built-in badges */}
      <Text style={styles.sectionLabel}>Built-in ({BUILTIN_BADGES.length})</Text>
      <View style={styles.grid}>
        {BUILTIN_BADGES.map(badge => {
          const unlocked      = state.unlockedBuiltinIds.includes(badge.id);
          const justUnlocked  = sessionUnlockedIds.includes(badge.id);
          return (
            <View key={badge.id} style={styles.gridItem}>
              <BadgeCard
                badge={badge}
                unlocked={unlocked}
                justUnlocked={justUnlocked}
              />
            </View>
          );
        })}
      </View>

      {/* Custom badges */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>Custom ({state.customBadges.length})</Text>
      </View>

      {state.customBadges.length === 0 ? (
        <View style={styles.emptyCustom}>
          <Text style={styles.emptyIcon}>🎖️</Text>
          <Text style={styles.emptyText}>
            Create your own badges with custom rules.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={openAdd} activeOpacity={0.8}>
            <Text style={styles.emptyBtnText}>Create first badge</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.grid}>
          {state.customBadges.map(badge => {
            const justUnlocked = sessionUnlockedIds.includes(badge.id);
            return (
              <View key={badge.id} style={styles.gridItem}>
                <BadgeCard
                  badge={badge}
                  unlocked={badge.unlocked}
                  justUnlocked={justUnlocked}
                />
                {/* Edit / delete actions */}
                <View style={styles.customActions}>
                  <TouchableOpacity
                    onPress={() => openEdit(badge)}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionEdit}>✎ Edit</Text>
                  </TouchableOpacity>
                  <DeleteButton onDelete={() => handleDelete(badge.id)} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      <BadgeSheet
        visible={sheetOpen}
        badge={editingBadge}
        onClose={() => { setSheetOpen(false); setEditingBadge(null); }}
        onSave={handleSave}
      />
    </ScrollView>
  );
}

// Two-tap delete inline
function DeleteButton({ onDelete }) {
  const [confirm, setConfirm] = useState(false);
  const timer = React.useRef(null);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const handle = () => {
    if (confirm) {
      clearTimeout(timer.current);
      setConfirm(false);
      onDelete();
    } else {
      setConfirm(true);
      timer.current = setTimeout(() => setConfirm(false), 3000);
    }
  };

  return (
    <TouchableOpacity onPress={handle} style={styles.actionBtn}>
      <Text style={[styles.actionDelete, confirm && styles.actionDeleteConfirm]}>
        {confirm ? 'Sure?' : '✕'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingBottom: SPACING.xxl,
  },
  headerRow: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
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
  subtitle: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
    marginTop: 2,
  },
  newBtn: {
    backgroundColor: COLORS.accent2,
    borderRadius:    RADIUS.full,
    paddingVertical:   6,
    paddingHorizontal: SPACING.md,
  },
  newBtnText: {
    color:      COLORS.bg,
    fontSize:   FONT.sm,
    fontWeight: '700',
  },
  sectionLabel: {
    color:             COLORS.textMuted,
    fontSize:          FONT.sm,
    fontWeight:        '600',
    textTransform:     'uppercase',
    letterSpacing:     0.8,
    paddingHorizontal: SPACING.md,
    paddingTop:        SPACING.md,
    paddingBottom:     SPACING.sm,
  },
  sectionRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection:    'row',
    flexWrap:         'wrap',
    paddingHorizontal: SPACING.sm,
  },
  gridItem: {
    width:   '50%',
    padding: SPACING.xs,
  },
  customActions: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
    paddingTop: 4,
    paddingBottom: SPACING.xs,
  },
  actionBtn: {
    padding: 4,
  },
  actionEdit: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },
  actionDelete: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },
  actionDeleteConfirm: {
    color:      COLORS.danger,
    fontWeight: '700',
  },
  emptyCustom: {
    alignItems:        'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical:   SPACING.xl,
    gap:               SPACING.sm,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    color:     COLORS.textMuted,
    fontSize:  FONT.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    backgroundColor: COLORS.accent2,
    borderRadius:    RADIUS.md,
    paddingVertical:   SPACING.sm + 2,
    paddingHorizontal: SPACING.xl,
    marginTop:       SPACING.xs,
  },
  emptyBtnText: {
    color:      COLORS.bg,
    fontSize:   FONT.base,
    fontWeight: '700',
  },
});
