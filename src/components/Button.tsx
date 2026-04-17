import { Pressable, StyleSheet, Text } from 'react-native';

import { tokens } from '@/theme/tokens';

type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
};

export function AppButton({
  label,
  onPress,
  tone = 'primary',
  disabled = false
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        toneStyles[tone],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed
      ]}>
      <Text style={[styles.label, labelStyles[tone], disabled && styles.disabledLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    fontSize: 15,
    fontWeight: '600'
  },
  disabled: {
    opacity: 0.5
  },
  pressed: {
    transform: [{ scale: 0.99 }]
  },
  disabledLabel: {
    opacity: 0.85
  }
});

const toneStyles: Record<ButtonTone, object> = {
  primary: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary
  },
  secondary: {
    backgroundColor: '#334155',
    borderColor: '#334155'
  },
  ghost: {
    backgroundColor: tokens.colors.primarySoft,
    borderColor: tokens.colors.border
  },
  danger: {
    backgroundColor: tokens.colors.danger,
    borderColor: tokens.colors.danger
  }
};

const labelStyles: Record<ButtonTone, object> = {
  primary: {
    color: '#ffffff'
  },
  secondary: {
    color: '#ffffff'
  },
  ghost: {
    color: tokens.colors.text
  },
  danger: {
    color: '#ffffff'
  }
};
