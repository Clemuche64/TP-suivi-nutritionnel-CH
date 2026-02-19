import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../src/components/AppButton";
import { AppCard } from "../../src/components/AppCard";
import { AppInput } from "../../src/components/AppInput";
import { theme } from "../../src/theme/theme";

function getClerkErrorMessage(error: unknown): string {
  const firstError = (error as { errors?: { longMessage?: string; message?: string }[] })?.errors?.[0];
  return firstError?.longMessage || firstError?.message || "Connexion impossible.";
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!isLoaded || !setActive) {
      return;
    }

    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier || !password.trim()) {
      setError("Identifiant et mot de passe requis.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const normalizedIdentifier = trimmedIdentifier.includes("@")
        ? trimmedIdentifier.toLowerCase()
        : trimmedIdentifier;

      let result = await signIn.create({
        identifier: normalizedIdentifier,
      });

      if (result.status === "needs_first_factor") {
        result = await signIn.attemptFirstFactor({
          strategy: "password",
          password,
        });
      }

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace("/(main)/(home)");
        return;
      }

      if (result.status === "needs_first_factor") {
        setError("Identifiant ou mot de passe invalide.");
        return;
      }

      setError("Connexion impossible avec cette configuration de compte.");
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <AppCard style={styles.card}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>Accede a ton suivi nutritionnel.</Text>

            <AppInput
              label="Email ou username"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="email@exemple.com ou username"
            />

            <AppInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="********"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AppButton title="Se connecter" onPress={handleLogin} loading={isLoading} fullWidth />

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Pas encore de compte ?</Text>
              <Link href="/(auth)/signup" style={styles.link}>
                S'inscrire
              </Link>
            </View>
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  card: {
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textMuted,
  },
  error: {
    color: theme.colors.orange,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  switchText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  link: {
    color: theme.colors.blue,
    fontSize: 14,
    fontWeight: "700",
  },
});
