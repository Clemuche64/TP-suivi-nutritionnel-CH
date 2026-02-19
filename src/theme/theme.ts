import { Platform } from "react-native";

export const theme = {
  colors: {
    navy: "#07090D",
    bg: "#0B0E13",
    surface: "#141923",
    greenSoft: "#16241C",
    green: "#3F9B63",
    blue: "#2F8555",
    orange: "#D9A45B",
    text: "#F2F5F7",
    textMuted: "#A5B0C0",
    border: "#2A3342",
    grey: "#7C889A",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    card: 16,
    control: 12,
    pill: 999,
  },
  shadow: {
    card:
      Platform.OS === "ios"
        ? {
            shadowColor: "#000000",
            shadowOpacity: 0.28,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
          }
        : Platform.OS === "android"
          ? {
              elevation: 6,
            }
          : {},
  },
} as const;
