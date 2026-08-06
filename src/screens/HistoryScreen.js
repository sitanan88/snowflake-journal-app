import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  Share, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { AREA_MAP } from '../constants/areas';
import { formatDateLabel, formatTime } from '../utils/date';
import EntryEditSheet from '../components/EntryEditSheet';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

// ─── Entry row ───────────────────────────────────────────────────────────────

function EntryRow({ entry, onEdit, onDelete }) {
  const area = AREA_MAP[entry.area] ?? AREA_MAP['goals'];
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timer = useRef(null);

  const handleDelete = () => {
    if (confirmDelete) {
      clearTimeout(timer.current);
      setConfirmDelete(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onDelete(entry.id);
    } else {
      setConfirmDelete(true);
      timer.current = setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <View style={styles.entryRow}>
      {/* Area indicator */}
      <View style={[styles.areaBar, { backgroundColor: area.color }]} />

      <View style={[styles.areaIconWrap, { backgroundColor: area.color + '22' }]}>
        <Text style={styles.areaEmoji}>{area.icon}</Text>
      </View>

      {/* Content */}
      <View style={styles.entryContent}>
        <View style={styles.entryTopRow}>
          <Text style={styles.areaLabel}>{area.name}</Text>
          <Text style={styles.entryTime}>{formatTime(entry.timestamp)}</Text>
        </View>
        {entry.note ? (
          <Text style={styles.entryNote} numberOfLines={2}>{entry.note}</Text>
        ) : (
          <Text style={styles.entryNoNote}>no note</Text>
        )}
        {entry.taskId && (
          <Text style={styles.entryTaskTag}>from task</Text>
        )}
      </View>

      {/* Tokens */}
      <Text style={styles.entryTokens}>+{entry.tokens}</Text>

      {/* Actions */}
      <View style={styles.entryActions}>
        <TouchableOpacity
          onPress={() => onEdit(entry)}
          hitSlop={{ top: 8, right: 4, bottom: 8, left: 4 }}
        >
          <Text style={styles.editBtn}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 4 }}
        >
          <Text style={[styles.deleteBtn, confirmDelete && styles.deleteBtnConfirm]}>
            {confirmDelete ? 'sure?' : '✕'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Import modal ─────────────────────────────────────────────────────────────

function ImportModal({ visible, onClose, onImport }) {
  const [json, setJson] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    setError('');
    try {
      const parsed = JSON.parse(json.trim());
      if (!Array.isArray(parsed.entries)) throw new Error('Invalid format: missing entries array');
      onImport(parsed);
      setJson('');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.importOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.importBox}>
          <Text style={styles.importTitle}>Import Backup</Text>
          <Text style={styles.importHint}>
            Paste your exported JSON below. This will replace all current data.
          </Text>
          <TextInput
            style={styles.importInput}
            value={json}
            onChangeText={v => { setJson(v); setError(''); }}
            placeholder="Paste JSON here…"
            placeholderTextColor={COLORS.textMuted}
            multiline
            autoCorrect={false}
            autoCapitalize="none"
          />
          {!!error && <Text style={styles.importError}>{error}</Text>}
          <View style={styles.importBtns}>
            <TouchableOpacity style={styles.importCancel} onPress={onClose}>
              <Text style={styles.importCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.importConfirm, !json.trim() && styles.importConfirmDisabled]}
              onPress={handleImport}
              disabled={!json.trim()}
            >
              <Text style={styles.importConfirmText}>Import</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HistoryScreen({ showToast }) {
  const { state, stats, editEntry, deleteEntry, importState } = useApp();
  const [editingEntry,  setEditingEntry]  = useState(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [importVisible, setImportVisible] = useState(false);

  // Group entries into sections by date, most-recent first
  const sections = useMemo(() => {
    const grouped = {};
    [...state.entries]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .forEach(e => {
        if (!grouped[e.date]) grouped[e.date] = [];
        grouped[e.date].push(e);
      });

    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({
        date,
        data,
        totalTokens: data.reduce((s, e) => s + e.tokens, 0),
      }));
  }, [state.entries]);

  const openEdit = useCallback((entry) => {
    setEditingEntry(entry);
    setEditSheetOpen(true);
  }, []);

  const handleSaveEdit = useCallback((updated) => {
    editEntry(updated);
    setEditSheetOpen(false);
    setEditingEntry(null);
    showToast?.('Entry updated', 'info');
  }, [editEntry, showToast]);

  const handleDelete = useCallback((id) => {
    deleteEntry(id);
    showToast?.('Entry deleted', 'info');
  }, [deleteEntry, showToast]);

  // Export: clipboard on web, native Share sheet on device
  const handleExport = useCallback(async () => {
    const json = JSON.stringify(state, null, 2);
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(json);
        showToast?.('Backup copied to clipboard', 'success');
      } catch {
        showToast?.('Could not copy — try a different browser', 'info');
      }
      return;
    }
    Share.share({ message: json, title: 'Snowflake Journal Backup' }).catch(() => {});
  }, [state, showToast]);

  // Import: validate and replace state
  const handleImport = useCallback((parsed) => {
    importState(parsed);
    setImportVisible(false);
    showToast?.('Journal restored from backup', 'success');
  }, [importState, showToast]);

  const totalDeeds  = stats.totalDeeds;
  const totalTokens = stats.totalTokens;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>History</Text>
          <Text style={styles.headerStats}>
            {totalDeeds} deeds · {totalTokens} tokens
          </Text>
        </View>
      </View>

      {/* Entry list */}
      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptySubtitle}>
            Log a deed on the Today tab and it will appear here.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionDate}>
                {formatDateLabel(section.date)}
              </Text>
              <Text style={styles.sectionMeta}>
                {section.data.length} {section.data.length === 1 ? 'deed' : 'deeds'} · +{section.totalTokens} tokens
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <EntryRow
              entry={item}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
          ListFooterComponent={
            <View style={styles.backupSection}>
              <Text style={styles.backupLabel}>Backup</Text>
              <View style={styles.backupBtns}>
                <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.8}>
                  <Text style={styles.exportBtnText}>⬆ Export JSON</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.importBtn}
                  onPress={() => setImportVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.importBtnText}>⬇ Import JSON</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      )}

      {/* Backup buttons also shown when empty */}
      {sections.length === 0 && (
        <View style={styles.backupSection}>
          <Text style={styles.backupLabel}>Backup</Text>
          <View style={styles.backupBtns}>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.8}>
              <Text style={styles.exportBtnText}>⬆ Export JSON</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.importBtn}
              onPress={() => setImportVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.importBtnText}>⬇ Import JSON</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <EntryEditSheet
        visible={editSheetOpen}
        entry={editingEntry}
        onClose={() => { setEditSheetOpen(false); setEditingEntry(null); }}
        onSave={handleSaveEdit}
      />

      <ImportModal
        visible={importVisible}
        onClose={() => setImportVisible(false)}
        onImport={handleImport}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.bg,
  },
  headerRow: {
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
  headerStats: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },

  // Section header
  sectionHeader: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop:       SPACING.md,
    paddingBottom:    SPACING.sm,
  },
  sectionDate: {
    color:      COLORS.text,
    fontSize:   FONT.base,
    fontWeight: '700',
  },
  sectionMeta: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },

  // Entry row
  entryRow: {
    flexDirection:    'row',
    alignItems:       'center',
    marginHorizontal: SPACING.md,
    marginBottom:     SPACING.xs + 2,
    backgroundColor:  COLORS.surface,
    borderRadius:     RADIUS.md,
    overflow:         'hidden',
    gap:              SPACING.sm,
    paddingVertical:  SPACING.sm + 2,
    paddingRight:     SPACING.sm,
  },
  areaBar: {
    width:  3,
    alignSelf: 'stretch',
  },
  areaIconWrap: {
    width:          34,
    height:         34,
    borderRadius:   RADIUS.sm,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  areaEmoji: {
    fontSize: 16,
  },
  entryContent: {
    flex: 1,
    gap:  2,
  },
  entryTopRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.sm,
  },
  areaLabel: {
    color:      COLORS.text,
    fontSize:   FONT.sm,
    fontWeight: '600',
  },
  entryTime: {
    color:    COLORS.textMuted,
    fontSize: 10,
    marginLeft: 'auto',
  },
  entryNote: {
    color:    COLORS.textLight,
    fontSize: 11,
    lineHeight: 15,
  },
  entryNoNote: {
    color:     COLORS.textMuted,
    fontSize:  10,
    fontStyle: 'italic',
    opacity:   0.5,
  },
  entryTaskTag: {
    color:      COLORS.accent,
    fontSize:   10,
    fontWeight: '600',
    marginTop:  1,
  },
  entryTokens: {
    color:      COLORS.gold,
    fontSize:   FONT.sm,
    fontWeight: '700',
    flexShrink: 0,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.sm,
    flexShrink:    0,
  },
  editBtn: {
    color:    COLORS.textMuted,
    fontSize: FONT.md,
  },
  deleteBtn: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
  },
  deleteBtnConfirm: {
    color:      COLORS.danger,
    fontWeight: '700',
  },

  // Empty state
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

  // Backup
  backupSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.xl,
    gap:               SPACING.sm,
  },
  backupLabel: {
    color:         COLORS.textMuted,
    fontSize:      FONT.sm,
    fontWeight:    '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom:  SPACING.xs,
  },
  backupBtns: {
    flexDirection: 'row',
    gap:           SPACING.sm,
  },
  exportBtn: {
    flex:            1,
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    paddingVertical: SPACING.sm + 2,
    alignItems:      'center',
  },
  exportBtnText: {
    color:      COLORS.textLight,
    fontSize:   FONT.sm,
    fontWeight: '600',
  },
  importBtn: {
    flex:            1,
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    paddingVertical: SPACING.sm + 2,
    alignItems:      'center',
  },
  importBtnText: {
    color:      COLORS.textLight,
    fontSize:   FONT.sm,
    fontWeight: '600',
  },

  // Import modal
  importOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent:  'center',
    padding:         SPACING.md,
  },
  importBox: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.xl,
    padding:         SPACING.lg,
    gap:             SPACING.sm,
  },
  importTitle: {
    color:      COLORS.text,
    fontSize:   FONT.md,
    fontWeight: '700',
  },
  importHint: {
    color:    COLORS.textMuted,
    fontSize: FONT.sm,
    lineHeight: 18,
  },
  importInput: {
    backgroundColor:   COLORS.surface2,
    borderRadius:      RADIUS.md,
    padding:           SPACING.sm + 4,
    color:             COLORS.text,
    fontSize:          FONT.sm,
    minHeight:         120,
    textAlignVertical: 'top',
    borderWidth:       1,
    borderColor:       COLORS.border,
    fontFamily:        Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  importError: {
    color:    COLORS.danger,
    fontSize: FONT.sm,
  },
  importBtns: {
    flexDirection: 'row',
    gap:           SPACING.sm,
    marginTop:     SPACING.xs,
  },
  importCancel: {
    flex:            1,
    borderRadius:    RADIUS.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    paddingVertical: SPACING.sm + 2,
    alignItems:      'center',
  },
  importCancelText: {
    color:    COLORS.textMuted,
    fontSize: FONT.base,
  },
  importConfirm: {
    flex:            1,
    backgroundColor: COLORS.accent,
    borderRadius:    RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems:      'center',
  },
  importConfirmDisabled: { opacity: 0.4 },
  importConfirmText: {
    color:      COLORS.bg,
    fontSize:   FONT.base,
    fontWeight: '700',
  },
});
