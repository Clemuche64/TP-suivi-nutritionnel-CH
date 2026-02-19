import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../src/components/AppButton";
import { AppCard } from "../../src/components/AppCard";
import { AppInput } from "../../src/components/AppInput";
import { theme } from "../../src/theme/theme";

function getClerkErrorMessage(error: unknown): string {
  const firstError = (error as { errors?: { longMessage?: string; message?: string }[] })?.errors?.[0];
  return firstError?.longMessage || firstError?.message || "Inscription impossible.";
}

export default function SignupScreen() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!isLoaded) {
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Email et mot de passe requis.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace("/(main)/(home)");
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setNeedsVerification(true);
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!isLoaded) {
      return;
    }

    if (!code.trim()) {
      setError("Code de verification requis.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status !== "complete" || !result.createdSessionId) {
        setError("Verification incomplete.");
        return;
      }

      await setActive({ session: result.createdSessionId });
      router.replace("/(main)/(home)");
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
            <Text style={styles.title}>Inscription</Text>
            <Text style={styles.subtitle}>Cree ton compte pour commencer.</Text>

            {!needsVerification ? (
              <>
                <AppInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  placeholder="email@exemple.com"
                />

                <AppInput
                  label="Mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Choisis un mot de passe"
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <AppButton title="Creer un compte" onPress={handleSignup} loading={isLoading} fullWidth />
              </>
            ) : (
              <>
                <AppInput
                  label="Code email"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  placeholder="Code de verification"
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <AppButton title="Valider le code" onPress={handleVerifyCode} loading={isLoading} fullWidth />
              </>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Tu as deja un compte ?</Text>
              <Link href="/(auth)/login" style={styles.link}>
                Se connecter
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
