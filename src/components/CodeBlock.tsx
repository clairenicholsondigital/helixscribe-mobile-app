import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme/tokens';

type CodeBlockProps = {
  value: string;
};

export function CodeBlock({ value }: CodeBlockProps) {
  return (
    <View style={styles.block}>
      <Text selectable style={styles.text}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: tokens.colors.codeBackground,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md
  },
  text: {
    color: tokens.colors.codeText,
    fontFamily: 'Courier',
    fontSize: 13,
    lineHeight: 19
  }
});
