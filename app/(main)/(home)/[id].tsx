import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../../src/components/AppButton";
import { AppCard } from "../../../src/components/AppCard";
import { deleteMeal, loadMeals } from "../../../src/storage/mealsStorage";
import { theme } from "../../../src/theme/theme";
import { Food, Meal } from "../../../src/types/models";

type Totals = {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
};

function getTotals(foods: Food[]): Totals {
  return foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      proteins: acc.proteins + food.proteins,
      carbs: acc.carbs + food.carbs,
      fats: acc.fats + food.fats,
    }),
    { calories: 0, proteins: 0, carbs: 0, fats: 0 }
  );
}

export default function DetailScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const mealId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [meal, setMeal] = useState<Meal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMeal = useCallback(async () => {
    if (!userId) {
      setMeal(null);
      setError("Session utilisateur indisponible.");
      return;
    }

    if (!mealId) {
      setMeal(null);
      setError("Identifiant repas manquant.");
      return;
    }

    try {
      const meals = await loadMeals(userId);
      const targetMeal = meals.find((entry) => entry.id === mealId) ?? null;
      setMeal(targetMeal);
      setError(targetMeal ? null : "Repas introuvable.");
    } catch {
      setMeal(null);
      setError("Impossible de charger ce repas.");
    }
  }, [mealId, userId]);

  useFocusEffect(
    useCallback(() => {
      void fetchMeal();
    }, [fetchMeal])
  );

  const totals = useMemo(() => getTotals(meal?.foods ?? []), [meal]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(main)/(home)");
  };

  const handleDelete = () => {
    if (!meal || isDeleting) {
      return;
    }

    Alert.alert("Supprimer le repas", "Cette action est definitive.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            if (!userId) {
              setError("Session utilisateur indisponible.");
              return;
            }

            await deleteMeal(userId, meal.id);
            router.replace("/(main)/(home)");
          } catch {
            setError("Suppression impossible.");
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  if (!meal) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fallback}>
          <Text style={styles.error}>{error ?? "Repas introuvable."}</Text>
          <AppButton title="Retour accueil" onPress={() => router.replace("/(main)/(home)")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={meal.foods}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.backRow}>
              <Pressable onPress={handleBack} style={styles.backButton} accessibilityRole="button">
                <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
                <Text style={styles.backText}>Retour</Text>
              </Pressable>
            </View>

            <Text style={styles.title}>{meal.name}</Text>
            <Text style={styles.meta}>{new Date(meal.date).toLocaleString("fr-FR")}</Text>

            <AppCard style={styles.totalsCard}>
              <Text style={styles.sectionTitle}>Totaux nutritionnels</Text>
              <Text style={styles.meta}>Calories: {totals.calories.toFixed(0)} kcal</Text>
              <Text style={styles.meta}>Proteines: {totals.proteins.toFixed(1)} g</Text>
              <Text style={styles.meta}>Glucides: {totals.carbs.toFixed(1)} g</Text>
              <Text style={styles.meta}>Lipides: {totals.fats.toFixed(1)} g</Text>
            </AppCard>

            <Text style={styles.sectionTitle}>Aliments</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <AppCard style={styles.foodCard}>
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.meta}>{item.brand}</Text>
            <Text style={styles.meta}>
              {item.calories.toFixed(0)} kcal | P {item.proteins.toFixed(1)} g | G {item.carbs.toFixed(1)} g | L{" "}
              {item.fats.toFixed(1)} g
            </Text>
          </AppCard>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <AppButton
              title="Supprimer le repas"
              variant="danger"
              onPress={handleDelete}
              loading={isDeleting}
              fullWidth
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  list: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  header: {
    gap: theme.spacing.md,
  },
  backRow: {
    marginBottom: theme.spacing.xs,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backText: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  totalsCard: {
    gap: theme.spacing.xs,
  },
  foodCard: {
    gap: theme.spacing.xs,
  },
  foodName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    color: theme.colors.textMuted,
  },
  footer: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  error: {
    color: theme.colors.orange,
    fontWeight: "600",
    textAlign: "center",
  },
});
