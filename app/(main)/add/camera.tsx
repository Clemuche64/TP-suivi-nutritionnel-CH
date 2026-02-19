import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../../src/components/AppButton";
import { AppCard } from "../../../src/components/AppCard";
import { getFoodByBarcode } from "../../../src/services/openFoodFacts";
import { theme } from "../../../src/theme/theme";
import { Food } from "../../../src/types/models";

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [food, setFood] = useState<Food | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!permission) {
      return;
    }

    if (!permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleScanned = async (result: BarcodeScanningResult) => {
    if (hasScanned || isLoading) {
      return;
    }

    setHasScanned(true);
    setIsLoading(true);
    setFood(null);
    setError(null);

    try {
      const scannedFood = await getFoodByBarcode(result.data);
      if (!scannedFood) {
        setError("Produit introuvable pour ce code-barres.");
        return;
      }

      setFood(scannedFood);
    } catch (scanError: unknown) {
      const message = scanError instanceof Error ? scanError.message : "Erreur pendant le scan.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetScan = () => {
    setHasScanned(false);
    setFood(null);
    setError(null);
    setIsLoading(false);
  };

  const useScannedFood = () => {
    if (!food) {
      return;
    }

    router.replace({
      pathname: "/(main)/add",
      params: {
        scanned: JSON.stringify(food),
        scannedAt: String(Date.now()),
      },
    });
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.blue} />
          <Text style={styles.meta}>Verification de la permission camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <AppCard style={styles.card}>
            <Text style={styles.title}>Permission camera requise</Text>
            <Text style={styles.meta}>Active la camera pour scanner des codes-barres.</Text>
            <AppButton title="Autoriser la camera" onPress={() => void requestPermission()} fullWidth />
            <AppButton title="Retour" variant="secondary" onPress={() => router.back()} fullWidth />
          </AppCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Scanner un code-barres</Text>

        <AppCard style={styles.cameraCard}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={hasScanned ? undefined : handleScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
            }}
          />
        </AppCard>

        {isLoading ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator color={theme.colors.blue} />
            <Text style={styles.meta}>Analyse du code-barres...</Text>
          </View>
        ) : null}

        {error ? (
          <AppCard style={styles.resultCard}>
            <Text style={styles.error}>{error}</Text>
          </AppCard>
        ) : null}

        {food ? (
          <AppCard style={styles.resultCard}>
            <Text style={styles.foodName}>{food.name}</Text>
            <Text style={styles.meta}>{food.brand}</Text>
            <Text style={styles.meta}>
              {food.calories.toFixed(0)} kcal | P {food.proteins.toFixed(1)} g | G {food.carbs.toFixed(1)} g | L{" "}
              {food.fats.toFixed(1)} g
            </Text>
            <AppButton title="Ajouter ce produit" onPress={useScannedFood} fullWidth />
          </AppCard>
        ) : null}

        <View style={styles.actions}>
          <AppButton title="Re-scanner" variant="secondary" onPress={resetScan} style={styles.actionButton} />
          <AppButton title="Retour" variant="secondary" onPress={() => router.back()} style={styles.actionButton} />
        </View>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  cameraCard: {
    padding: 0,
    overflow: "hidden",
  },
  camera: {
    width: "100%",
    height: 300,
  },
  loaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  resultCard: {
    gap: theme.spacing.xs,
  },
  foodName: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  meta: {
    color: theme.colors.textMuted,
  },
  error: {
    color: theme.colors.orange,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  card: {
    gap: theme.spacing.sm,
  },
});
