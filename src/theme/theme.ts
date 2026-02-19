import { Platform } from "react-native";

export const theme = {
  colors: {
    navy: "#171B2B",
    bg: "#F0F4F7",
    surface: "#FEFEFE",
    greenSoft: "#D1E6D6",
    green: "#80C587",
    blue: "#5474E3",
    orange: "#DCAE70",
    text: "#171B2B",
    textMuted: "#353947",
    border: "#9CB4A3",
    grey: "#5F6367",
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
            shadowColor: "#171B2B",
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
          }
        : Platform.OS === "android"
          ? {
              elevation: 2,
            }
          : {},
  },
} as const;
