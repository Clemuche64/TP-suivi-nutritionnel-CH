import { useClerk, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../src/components/AppButton";
import { AppCard } from "../../src/components/AppCard";
import { theme } from "../../src/theme/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email =
    user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "Email indisponible";

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch {
      setError("Deconnexion impossible.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Profil</Text>

        <AppCard style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton title="Se deconnecter" variant="danger" onPress={handleLogout} loading={isLoading} fullWidth />
        </AppCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.navy,
    fontSize: 28,
    fontWeight: "800",
  },
  card: {
    gap: theme.spacing.md,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  error: {
    color: theme.colors.orange,
    fontWeight: "600",
  },
});
