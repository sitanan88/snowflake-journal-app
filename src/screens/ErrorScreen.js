import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT, SPACING, RADIUS } from '../theme';

export default function ErrorScreen({ message, onRetry }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Could not load your journal</Text>
      <Text style={styles.message}>
        {message || 'There was a problem reading your saved data. Your journal has NOT been modified.'}
      </Text>
      <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
      <Text style={styles.note}>
        The app will not render or save anything until your data loads successfully.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems:      'center',
    justifyContent:  'center',
    padding:         SPACING.xl,
  },
  icon: {
    fontSize:     52,
    marginBottom: SPACING.md,
  },
  title: {
    color:        COLORS.text,
    fontSize:     FONT.lg,
    fontWeight:   '700',
    textAlign:    'center',
    marginBottom: SPACING.sm,
  },
  message: {
    color:        COLORS.textMuted,
    fontSize:     FONT.base,
    textAlign:    'center',
    lineHeight:   22,
    marginBottom: SPACING.xl,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius:    RADIUS.md,
    paddingVertical:   SPACING.sm + 4,
    paddingHorizontal: SPACING.xl,
    marginBottom:    SPACING.lg,
  },
  buttonText: {
    color:      COLORS.bg,
    fontSize:   FONT.base,
    fontWeight: '700',
  },
  note: {
    color:     COLORS.textMuted,
    fontSize:  FONT.sm,
    textAlign: 'center',
    opacity:   0.6,
    lineHeight: 18,
  },
});
