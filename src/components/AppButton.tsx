import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { theme } from "../theme/theme";

type ButtonVariant = "primary" | "secondary" | "danger";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
};

type VariantStyle = {
  container: ViewStyle;
  textColor: string;
};

function getVariantStyle(variant: ButtonVariant): VariantStyle {
  if (variant === "secondary") {
    return {
      container: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      },
      textColor: theme.colors.text,
    };
  }

  if (variant === "danger") {
    return {
      container: {
        backgroundColor: theme.colors.orange,
        borderColor: theme.colors.orange,
      },
      textColor: theme.colors.text,
    };
  }

  return {
    container: {
      backgroundColor: theme.colors.blue,
      borderColor: theme.colors.blue,
    },
    textColor: theme.colors.text,
  };
}

export function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
}: AppButtonProps) {
  const variantStyle = getVariantStyle(variant);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        fullWidth && styles.fullWidth,
        variantStyle.container,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.textColor} />
      ) : (
        <Text style={[styles.text, { color: variantStyle.textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: theme.radius.control,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
  },
});
