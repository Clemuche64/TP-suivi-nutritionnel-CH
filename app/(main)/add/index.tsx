import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../../src/components/AppButton";
import { AppCard } from "../../../src/components/AppCard";
import { AppInput } from "../../../src/components/AppInput";
import { searchFoods } from "../../../src/services/openFoodFacts";
import { addMeal } from "../../../src/storage/mealsStorage";
import { theme } from "../../../src/theme/theme";
import { Food, Meal, MealType } from "../../../src/types/models";

const MEAL_TYPES: MealType[] = ["Petit-dejeuner", "Dejeuner", "Diner", "Snack"];
const SEARCH_DEBOUNCE_MS = 450;
let lastHandledScanToken: string | null = null;

function isFood(value: unknown): value is Food {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Food>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.brand === "string" &&
    typeof candidate.image_url === "string" &&
    typeof candidate.nutriscore === "string" &&
    typeof candidate.calories === "number" &&
    typeof candidate.proteins === "number" &&
    typeof candidate.carbs === "number" &&
    typeof candidate.fats === "number"
  );
}

function getFoodKey(food: Food): string {
  return `${food.id}-${food.name}`.toLowerCase();
}

export default function AddMealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ scanned?: string | string[]; scannedAt?: string | string[] }>();
  const [selectedType, setSelectedType] = useState<MealType>("Petit-dejeuner");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSavingMeal, setIsSavingMeal] = useState(false);
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);
  const [error, setError] = useState<string | null>(null);
  const handledScanTokenRef = useRef<string | null>(null);

  const selectedCalories = useMemo(
    () => selectedFoods.reduce((total, food) => total + food.calories, 0),
    [selectedFoods]
  );

  const pushFood = useCallback((food: Food) => {
    setSelectedFoods((current) => {
      const hasFood = current.some((entry) => getFoodKey(entry) === getFoodKey(food));
      if (hasFood) {
        return current;
      }

      return [food, ...current];
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([]);
      return;
    }

    let active = true;
    setIsSearching(true);
    setError(null);

    searchFoods(debouncedSearch)
      .then((foods) => {
        if (!active) {
          return;
        }
        setSearchResults(foods);
      })
      .catch((searchError: unknown) => {
        if (!active) {
          return;
        }
        setSearchResults([]);
        const message = searchError instanceof Error ? searchError.message : "Recherche impossible.";
        setError(message);
      })
      .finally(() => {
        if (active) {
          setIsSearching(false);
        }
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch]);

  useEffect(() => {
    const scannedRaw = Array.isArray(params.scanned) ? params.scanned[0] : params.scanned;
    const scannedToken = Array.isArray(params.scannedAt) ? params.scannedAt[0] : params.scannedAt;

    if (!scannedRaw || !scannedToken) {
      return;
    }

    if (handledScanTokenRef.current === scannedToken || lastHandledScanToken === scannedToken) {
      return;
    }

    handledScanTokenRef.current = scannedToken;
    lastHandledScanToken = scannedToken;

    try {
      const parsed = JSON.parse(scannedRaw) as unknown;
      if (!isFood(parsed)) {
        setError("Produit scanne invalide.");
        return;
      }

      pushFood(parsed);
      setError(null);
    } catch {
      setError("Impossible d'ajouter le produit scanne.");
    }
  }, [params.scanned, params.scannedAt, pushFood]);

  const removeFood = (food: Food) => {
    setSelectedFoods((current) => current.filter((entry) => getFoodKey(entry) !== getFoodKey(food)));
  };

  const saveMeal = async () => {
    if (!selectedType) {
      setError("Type de repas requis.");
      return;
    }

    if (selectedFoods.length === 0) {
      setError("Ajoute au moins un aliment.");
      return;
    }

    setIsSavingMeal(true);
    setError(null);

    const meal: Meal = {
      id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: selectedType,
      date: new Date().toISOString(),
      foods: selectedFoods,
    };

    try {
      await addMeal(meal);
      router.replace("/(main)/(home)");
    } catch {
      setError("Impossible d'enregistrer ce repas.");
    } finally {
      setIsSavingMeal(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Nouveau repas</Text>

        <AppCard style={styles.card}>
          <Text style={styles.sectionTitle}>Type de repas</Text>
          <View style={styles.typesRow}>
            {MEAL_TYPES.map((type) => (
              <AppButton
                key={type}
                title={type}
                variant={selectedType === type ? "primary" : "secondary"}
                onPress={() => setSelectedType(type)}
                style={styles.typeButton}
              />
            ))}
          </View>
        </AppCard>

        <AppCard style={styles.card}>
          <Text style={styles.sectionTitle}>Recherche Open Food Facts</Text>
          <AppInput
            label="Rechercher un aliment"
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Ex: yaourt, avoine, chocolat"
            autoCorrect={false}
          />

          <AppButton title="Scanner un code-barres" variant="secondary" onPress={() => router.push("/(main)/add/camera")} />

          {isSearching ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator color={theme.colors.blue} />
              <Text style={styles.meta}>Recherche en cours...</Text>
            </View>
          ) : null}

          {searchTerm.trim().length > 0 && !isSearching && searchResults.length === 0 ? (
            <Text style={styles.meta}>Aucun resultat.</Text>
          ) : null}

          <View style={styles.resultsList}>
            {searchResults.map((food) => (
              <AppCard key={getFoodKey(food)} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  {food.image_url ? <Image source={{ uri: food.image_url }} style={styles.foodImage} resizeMode="cover" /> : null}
                  <View style={styles.resultMeta}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.meta}>{food.brand}</Text>
                    <Text style={styles.meta}>
                      {food.calories.toFixed(0)} kcal | P {food.proteins.toFixed(1)} g | G {food.carbs.toFixed(1)} g | L{" "}
                      {food.fats.toFixed(1)} g
                    </Text>
                  </View>
                </View>
                <AppButton title="Ajouter" onPress={() => pushFood(food)} />
              </AppCard>
            ))}
          </View>
        </AppCard>

        <AppCard style={styles.card}>
          <Text style={styles.sectionTitle}>Aliments ajoutes</Text>
          <Text style={styles.meta}>Total: {selectedCalories.toFixed(0)} kcal</Text>

          {selectedFoods.length === 0 ? <Text style={styles.meta}>Aucun aliment selectionne.</Text> : null}

          <View style={styles.resultsList}>
            {selectedFoods.map((food) => (
              <AppCard key={getFoodKey(food)} style={styles.resultCard}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.meta}>
                  {food.calories.toFixed(0)} kcal | P {food.proteins.toFixed(1)} g | G {food.carbs.toFixed(1)} g | L{" "}
                  {food.fats.toFixed(1)} g
                </Text>
                <AppButton title="Retirer" variant="danger" onPress={() => removeFood(food)} />
              </AppCard>
            ))}
          </View>
        </AppCard>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton title="Valider le repas" onPress={saveMeal} loading={isSavingMeal} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  card: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  typesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  typeButton: {
    width: "48%",
  },
  loaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  resultsList: {
    gap: theme.spacing.sm,
  },
  resultCard: {
    gap: theme.spacing.sm,
  },
  resultHeader: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  resultMeta: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  foodImage: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.control,
    backgroundColor: theme.colors.greenSoft,
  },
  foodName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    color: theme.colors.textMuted,
  },
  error: {
    color: theme.colors.orange,
    fontWeight: "600",
  },
});
