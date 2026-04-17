import { Platform } from 'react-native';

export const tokens = {
  colors: {
    background: '#f6f8fc',
    card: '#ffffff',
    border: '#dbe3ee',
    text: '#111827',
    muted: '#5b6474',
    primary: '#1d4ed8',
    primarySoft: '#dbeafe',
    danger: '#b91c1c',
    dangerSoft: '#fee2e2',
    success: '#166534',
    successSoft: '#dcfce7',
    neutralSoft: '#eef2ff',
    inputBackground: '#ffffff',
    overlay: 'rgba(15, 23, 42, 0.06)',
    codeBackground: '#0f172a',
    codeText: '#e2e8f0'
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 18
  }
};

export const cardShadow = Platform.select({
  ios: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 }
  },
  android: {
    elevation: 2
  },
  default: {}
});
