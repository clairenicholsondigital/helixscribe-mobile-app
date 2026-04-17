import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { tokens } from '@/theme/tokens';

type ScreenProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  scroll?: boolean;
  children: ReactNode;
};

export function Screen({
  title,
  subtitle,
  actions,
  scroll = true,
  children
}: ScreenProps) {
  const content = (
    <View style={styles.inner}>
      {title || subtitle || actions ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
      ) : null}
      <View style={styles.body}>{children}</View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.wrapper}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: tokens.colors.background
  },
  scrollContent: {
    padding: tokens.spacing.md
  },
  inner: {
    flex: 1,
    gap: tokens.spacing.md
  },
  header: {
    gap: tokens.spacing.sm
  },
  headerText: {
    gap: tokens.spacing.xs
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: tokens.colors.text
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: tokens.colors.muted
  },
  actions: {
    gap: tokens.spacing.sm
  },
  body: {
    gap: tokens.spacing.md
  }
});
