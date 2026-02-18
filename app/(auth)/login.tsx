import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.text}>Ecran de connexion Clerk a implementer.</Text>
      <Link href="/signup" style={styles.link}>
        Creer un compte
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
