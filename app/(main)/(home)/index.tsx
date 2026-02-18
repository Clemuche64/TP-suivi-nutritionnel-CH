import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accueil</Text>
      <Link href="/1" style={styles.link}>
        Ouvrir un detail (id: 1)
      </Link>
      <Link href="/add" style={styles.link}>
        Aller vers Ajouter
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
  link: {
    color: "#2563eb",
    fontWeight: "600",
  },
});
