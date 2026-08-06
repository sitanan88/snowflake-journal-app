import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT } from '../theme';

const TABS = [
  { id: 'today',     label: 'Today',    icon: 'sunny-outline',             iconActive: 'sunny' },
  { id: 'tasks',     label: 'Tasks',    icon: 'checkmark-circle-outline',  iconActive: 'checkmark-circle' },
  { id: 'snowflake', label: 'Crystal',  icon: 'snow-outline',              iconActive: 'snow' },
  { id: 'badges',    label: 'Badges',   icon: 'ribbon-outline',            iconActive: 'ribbon' },
  { id: 'history',   label: 'History',  icon: 'time-outline',              iconActive: 'time' },
];

export default function BottomNav({ activeTab, onTabPress }) {
  return (
    <View style={styles.container}>
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={active ? tab.iconActive : tab.icon}
              size={24}
              color={active ? COLORS.accent : COLORS.textMuted}
            />
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:    'row',
    backgroundColor:  COLORS.surface,
    borderTopWidth:   1,
    borderTopColor:   COLORS.border,
    paddingBottom:    Platform.OS === 'ios' ? 20 : SPACING.sm,
    paddingTop:       SPACING.sm,
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            2,
    paddingVertical: 2,
  },
  label: {
    fontSize:  10,
    color:     COLORS.textMuted,
    fontWeight: '500',
  },
  labelActive: {
    color: COLORS.accent,
  },
});
