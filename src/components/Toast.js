import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Animated, Text, StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

// Usage: toastRef.current.show('Message', 'success' | 'info' | 'badge')
const Toast = forwardRef((_, ref) => {
  const [message, setMessage]   = useState('');
  const [variant, setVariant]   = useState('info');
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const timer      = useRef(null);

  useImperativeHandle(ref, () => ({
    show(msg, type = 'info') {
      if (timer.current) clearTimeout(timer.current);
      setMessage(msg);
      setVariant(type);

      Animated.sequence([
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 12,
            stiffness: 180,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      timer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -80, duration: 220, useNativeDriver: true }),
          Animated.timing(opacity,    { toValue: 0,   duration: 200, useNativeDriver: true }),
        ]).start();
      }, 2800);
    },
  }));

  const bg = variant === 'badge'   ? COLORS.accent2
           : variant === 'success' ? COLORS.success
           : COLORS.surface3;

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: bg, transform: [{ translateY }], opacity }]}
      pointerEvents="none"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
});

Toast.displayName = 'Toast';
export default Toast;

const styles = StyleSheet.create({
  container: {
    position:     'absolute',
    top:          Platform.OS === 'ios' ? 56 : 40,
    left:         SPACING.md,
    right:        SPACING.md,
    borderRadius: RADIUS.md,
    paddingVertical:   SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    zIndex:       999,
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation:    10,
  },
  text: {
    color:      COLORS.text,
    fontSize:   FONT.base,
    fontWeight: '500',
    textAlign:  'center',
  },
});
