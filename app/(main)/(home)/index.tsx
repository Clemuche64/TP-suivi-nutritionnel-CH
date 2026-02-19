import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../../src/components/AppButton";
import { AppCard } from "../../../src/components/AppCard";
import { AppInput } from "../../../src/components/AppInput";
import { loadCalorieGoal, loadMeals, saveCalorieGoal } from "../../../src/storage/mealsStorage";
import { theme } from "../../../src/theme/theme";
import { Meal } from "../../../src/types/models";

function getMealCalories(meal: Meal): number {
  return meal.foods.reduce((total, food) => total + food.calories, 0);
}

function formatDate(date: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString("fr-FR");
}

export default function HomeScreen() {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [goal, setGoal] = useState(2000);
  const [goalInput, setGoalInput] = useState("2000");
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [loadedMeals, loadedGoal] = await Promise.all([loadMeals(), loadCalorieGoal(2000)]);
      setMeals(loadedMeals);
      setGoal(loadedGoal);
      setGoalInput(String(loadedGoal));
      setError(null);
    } catch {
      setError("Impossible de charger les donnees locales.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const todayKey = new Date().toISOString().slice(0, 10);

  const todayCalories = useMemo(
    () =>
      meals
        .filter((meal) => meal.date.slice(0, 10) === todayKey)
        .reduce((total, meal) => total + getMealCalories(meal), 0),
    [meals, todayKey]
  );

  const allCalories = useMemo(() => meals.reduce((total, meal) => total + getMealCalories(meal), 0), [meals]);
  const ratio = goal > 0 ? todayCalories / goal : 0;
  const progressPercent = Math.min(ratio, 1) * 100;
  const progressColor = ratio <= 1 ? theme.colors.green : theme.colors.orange;

  const saveGoal = async () => {
    const parsed = Number(goalInput.trim().replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Objectif calorique invalide.");
      return;
    }

    setIsSavingGoal(true);
    setError(null);

    try {
      const saved = await saveCalorieGoal(parsed);
      setGoal(saved);
      setGoalInput(String(saved));
    } catch {
      setError("Impossible d'enregistrer l'objectif calorique.");
    } finally {
      setIsSavingGoal(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>TP Suivi Nutritionnel</Text>

            <AppCard style={styles.goalCard}>
              <Text style={styles.sectionTitle}>Objectif calories / jour</Text>
              <Text style={styles.meta}>
                Aujourd'hui: {todayCalories.toFixed(0)} kcal / {goal.toFixed(0)} kcal
              </Text>
              <Text style={styles.meta}>Total enregistre: {allCalories.toFixed(0)} kcal</Text>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: progressColor }]} />
              </View>

              <AppInput
                label="Objectif kcal"
                keyboardType="numeric"
                value={goalInput}
                onChangeText={setGoalInput}
                placeholder="2000"
              />

              <AppButton
                title="Enregistrer l'objectif"
                variant="secondary"
                onPress={saveGoal}
                loading={isSavingGoal}
                fullWidth
              />
            </AppCard>

            <AppButton title="Ajouter un repas" onPress={() => router.push("/(main)/add")} fullWidth />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.sectionTitle}>Repas enregistres</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Aucun repas enregistre pour le moment.</Text>}
        renderItem={({ item }) => {
          const calories = getMealCalories(item);

          return (
            <AppCard style={styles.mealCard}>
              <Text style={styles.mealName}>{item.name}</Text>
              <Text style={styles.meta}>{formatDate(item.date)}</Text>
              <Text style={styles.meta}>
                {item.foods.length} aliment(s) | {calories.toFixed(0)} kcal
              </Text>
              <AppButton
                title="Voir le detail"
                variant="secondary"
                onPress={() => router.push({ pathname: "/(main)/(home)/[id]", params: { id: item.id } })}
              />
            </AppCard>
          );
        }}
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
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  goalCard: {
    gap: theme.spacing.sm,
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  progressTrack: {
    height: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.greenSoft,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: theme.radius.pill,
  },
  mealCard: {
    gap: theme.spacing.sm,
  },
  mealName: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  error: {
    color: theme.colors.orange,
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    color: theme.colors.grey,
    paddingVertical: theme.spacing.xl,
  },
});
