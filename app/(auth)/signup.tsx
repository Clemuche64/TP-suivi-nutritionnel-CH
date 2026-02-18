import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function SignupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signup</Text>
      <Text style={styles.text}>Ecran d'inscription Clerk a implementer.</Text>
      <Link href="/login" style={styles.link}>
        Deja un compte ? Se connecter
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
  },
  text: {
    color: "#4b5563",
  },
  link: {
    color: "#2563eb",
    fontWeight: "600",
  },
});
