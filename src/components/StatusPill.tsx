import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme/tokens';

type StatusPillTone = 'neutral' | 'primary' | 'success' | 'danger';

type StatusPillProps = {
  label: string;
  tone?: StatusPillTone;
};

export function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  return (
    <View style={[styles.base, toneStyles[tone]]}>
      <Text style={[styles.label, labelStyles[tone]]}>{label}</Text>
    </View>
  );
}

export function toneForRunStatus(status?: string | null): StatusPillTone {
  const value = String(status ?? '').trim().toLowerCase();
  if (['completed', 'success'].includes(value)) {
    return 'success';
  }
  if (['failed', 'cancelled', 'dead_letter'].includes(value)) {
    return 'danger';
  }
  if (['running', 'queued', 'scheduled', 'retrying'].includes(value)) {
    return 'primary';
  }
  return 'neutral';
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1
  },
  label: {
    fontSize: 12,
    fontWeight: '600'
  }
});

const toneStyles: Record<StatusPillTone, object> = {
  neutral: {
    backgroundColor: tokens.colors.neutralSoft,
    borderColor: tokens.colors.border
  },
  primary: {
    backgroundColor: tokens.colors.primarySoft,
    borderColor: '#bfdbfe'
  },
  success: {
    backgroundColor: tokens.colors.successSoft,
    borderColor: '#bbf7d0'
  },
  danger: {
    backgroundColor: tokens.colors.dangerSoft,
    borderColor: '#fecaca'
  }
};

const labelStyles: Record<StatusPillTone, object> = {
  neutral: {
    color: tokens.colors.text
  },
  primary: {
    color: tokens.colors.primary
  },
  success: {
    color: tokens.colors.success
  },
  danger: {
    color: tokens.colors.danger
  }
};
