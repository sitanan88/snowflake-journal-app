import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT, SPACING, RADIUS } from '../theme';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();

  const [mode,        setMode]        = useState('signin'); // 'signin' | 'signup'
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [checkEmail,  setCheckEmail]  = useState(false);

  const isSignUp = mode === 'signup';

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const data = await signUp(email.trim(), password);
        // Supabase can require email confirmation — check if session exists
        if (!data.session) {
          setCheckEmail(true);
        }
        // If session exists, onAuthStateChange in AuthContext will update the user
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(m => (m === 'signin' ? 'signup' : 'signin'));
    setError('');
    setCheckEmail(false);
  };

  if (checkEmail) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.icon}>📧</Text>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a confirmation link to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
            {'\n\n'}Click the link to activate your account, then come back and sign in.
          </Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={toggleMode}>
            <Text style={styles.secondaryBtnText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.flake}>❄️</Text>
          <Text style={styles.appName}>Snowflake Journal</Text>
          <Text style={styles.tagline}>Track your growth, one deed at a time.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isSignUp ? 'Create account' : 'Welcome back'}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.bg} />
              : <Text style={styles.primaryBtnText}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
            }
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity onPress={toggleMode}>
            <Text style={styles.toggleText}>
              {isSignUp
                ? 'Already have an account? '
                : "Don't have an account? "}
              <Text style={styles.toggleLink}>{isSignUp ? 'Sign in' : 'Sign up'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flexGrow:        1,
    justifyContent:  'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.xxl,
  },
  header: {
    alignItems:    'center',
    marginBottom:  SPACING.xl,
    gap:           SPACING.sm,
  },
  flake: {
    fontSize: 56,
  },
  appName: {
    fontSize:   FONT.xl,
    fontWeight: '700',
    color:      COLORS.text,
  },
  tagline: {
    fontSize: FONT.sm,
    color:    COLORS.textMuted,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.lg,
    gap:             SPACING.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  cardTitle: {
    fontSize:   FONT.md,
    fontWeight: '600',
    color:      COLORS.text,
    marginBottom: SPACING.xs,
  },
  field: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT.sm,
    color:    COLORS.textMuted,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.surface2,
    borderRadius:    RADIUS.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.sm + 2,
    fontSize:        FONT.base,
    color:           COLORS.text,
  },
  error: {
    fontSize:  FONT.sm,
    color:     COLORS.danger,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius:    RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    alignItems:      'center',
    marginTop:       SPACING.xs,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize:   FONT.base,
    fontWeight: '600',
    color:      COLORS.bg,
  },
  divider: {
    height:          1,
    backgroundColor: COLORS.border,
    marginVertical:  SPACING.xs,
  },
  toggleText: {
    textAlign: 'center',
    fontSize:  FONT.sm,
    color:     COLORS.textMuted,
  },
  toggleLink: {
    color:      COLORS.accent,
    fontWeight: '600',
  },
  // Check-email state
  icon: {
    fontSize:  48,
    textAlign: 'center',
  },
  title: {
    fontSize:   FONT.lg,
    fontWeight: '700',
    color:      COLORS.text,
    textAlign:  'center',
  },
  subtitle: {
    fontSize:   FONT.base,
    color:      COLORS.textMuted,
    textAlign:  'center',
    lineHeight: 22,
  },
  emailHighlight: {
    color:      COLORS.accent,
    fontWeight: '600',
  },
  secondaryBtn: {
    borderRadius:    RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     COLORS.border,
    marginTop:       SPACING.xs,
  },
  secondaryBtnText: {
    fontSize:   FONT.base,
    color:      COLORS.textLight,
  },
});
