import { useSignIn, useSignUp } from "@clerk/clerk-expo";
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
  return firstError?.longMessage || firstError?.message || "Inscription impossible.";
}

export default function SignupScreen() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeWithPasswordSignIn = async (normalizedEmail: string, rawPassword: string) => {
    if (!isSignInLoaded || !setActive) {
      return false;
    }

    const signInResult = await signIn.create({
      identifier: normalizedEmail,
      password: rawPassword,
    });

    if (signInResult.status !== "complete" || !signInResult.createdSessionId) {
      return false;
    }

    await setActive({ session: signInResult.createdSessionId });
    router.replace("/(main)/(home)");
    return true;
  };

  const handleSignup = async () => {
    if (!isLoaded || !setActive) {
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedUsername || !normalizedFirstName || !normalizedLastName || !normalizedEmail || !password.trim()) {
      setError("Username, prenom, nom, email et mot de passe sont requis.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await signUp.create({
        username: normalizedUsername,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        emailAddress: normalizedEmail,
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace("/(main)/(home)");
        return;
      }

      if (result.status === "missing_requirements" && result.missingFields.length > 0) {
        setError(`Inscription incomplete. Champs requis: ${result.missingFields.join(", ")}`);
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
    if (!isLoaded || !setActive) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError("Code de verification requis.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: trimmedCode,
      });

      if (result.status !== "complete") {
        if (result.missingFields.length > 0) {
          setError(`Verification incomplete. Champs requis: ${result.missingFields.join(", ")}`);
          return;
        }

        setError("Verification incomplete.");
        return;
      }

      const createdSessionId = result.createdSessionId ?? signUp.createdSessionId;

      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace("/(main)/(home)");
        return;
      }

      const signedIn = await completeWithPasswordSignIn(normalizedEmail, password);
      if (signedIn) {
        return;
      }

      setError("Compte verifie, mais session introuvable. Essaie de te connecter depuis l'ecran Connexion.");
    } catch (err) {
      const message = getClerkErrorMessage(err);
      if (message.toLowerCase().includes("already verified") && normalizedEmail && password) {
        try {
          const signedIn = await completeWithPasswordSignIn(normalizedEmail, password);
          if (signedIn) {
            return;
          }
        } catch {
          // Keep initial Clerk error below.
        }
      }

      setError(message);
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
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="ex: clement123"
                />

                <AppInput
                  label="Prenom"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  placeholder="Clement"
                />

                <AppInput
                  label="Nom"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  placeholder="Dupont"
                />

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
