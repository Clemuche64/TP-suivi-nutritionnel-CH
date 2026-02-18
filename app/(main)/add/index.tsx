import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function AddScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajouter</Text>
      <Link href="/add/camera" style={styles.link}>
        Ouvrir la camera
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
