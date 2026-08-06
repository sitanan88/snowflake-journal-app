import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback,
  Animated, StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

export default function BottomSheet({ visible, onClose, title, children, snapHeight = '60%' }) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 20,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header row */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor:     COLORS.surface,
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal:    SPACING.md,
    paddingBottom:        Platform.OS === 'ios' ? 36 : SPACING.lg,
    maxHeight:            '85%',
  },
  handle: {
    width:         40,
    height:        4,
    borderRadius:  2,
    backgroundColor: COLORS.border,
    alignSelf:     'center',
    marginTop:     SPACING.sm,
    marginBottom:  SPACING.sm,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    marginBottom:   SPACING.sm,
  },
  title: {
    color:      COLORS.text,
    fontSize:   FONT.md,
    fontWeight: '700',
  },
  closeBtn: {
    color:    COLORS.textMuted,
    fontSize: FONT.md,
  },
});
