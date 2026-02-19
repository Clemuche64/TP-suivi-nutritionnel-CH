import { TextInput, TextInputProps, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function AppInput({ label, error, style, ...props }: AppInputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.grey}
        selectionColor={theme.colors.blue}
        style={[styles.input, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    minHeight: 44,
    borderRadius: theme.radius.control,
    borderColor: theme.colors.border,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.bg,
    color: theme.colors.text,
    fontSize: 15,
  },
  error: {
    color: theme.colors.orange,
    fontSize: 12,
    fontWeight: "600",
  },
});
