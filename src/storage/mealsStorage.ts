import AsyncStorage from "@react-native-async-storage/async-storage";
import { Food, Meal } from "../types/models";

const LEGACY_MEALS_KEY = "@meals";
const LEGACY_CALORIE_GOAL_KEY = "@calorie_goal";

function mealsKey(userId: string): string {
  return `@meals:${userId}`;
}

function calorieGoalKey(userId: string): string {
  return `@calorie_goal:${userId}`;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeFood(value: unknown): Food | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<Food>;
  if (typeof candidate.id !== "string" || typeof candidate.name !== "string") {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    brand: typeof candidate.brand === "string" ? candidate.brand : "Marque inconnue",
    image_url: typeof candidate.image_url === "string" ? candidate.image_url : "",
    nutriscore: typeof candidate.nutriscore === "string" ? candidate.nutriscore : "-",
    calories: toNumber(candidate.calories),
    proteins: toNumber(candidate.proteins),
    carbs: toNumber(candidate.carbs),
    fats: toNumber(candidate.fats),
  };
}

function sanitizeMeal(value: unknown): Meal | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<Meal>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.date !== "string" ||
    !Array.isArray(candidate.foods)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    date: candidate.date,
    foods: candidate.foods.map(sanitizeFood).filter((food): food is Food => Boolean(food)),
  };
}

function sanitizeMeals(value: unknown): Meal[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(sanitizeMeal)
    .filter((meal): meal is Meal => Boolean(meal))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function assertUserId(userId: string): void {
  if (!userId || !userId.trim()) {
    throw new Error("Identifiant utilisateur manquant.");
  }
}

async function migrateLegacyMealsIfNeeded(userId: string): Promise<void> {
  const scopedKey = mealsKey(userId);
  const [scopedValue, legacyValue] = await Promise.all([
    AsyncStorage.getItem(scopedKey),
    AsyncStorage.getItem(LEGACY_MEALS_KEY),
  ]);

  if (scopedValue !== null || legacyValue === null) {
    return;
  }

  await AsyncStorage.setItem(scopedKey, legacyValue);
  await AsyncStorage.removeItem(LEGACY_MEALS_KEY);
}

async function migrateLegacyCalorieGoalIfNeeded(userId: string): Promise<void> {
  const scopedKey = calorieGoalKey(userId);
  const [scopedValue, legacyValue] = await Promise.all([
    AsyncStorage.getItem(scopedKey),
    AsyncStorage.getItem(LEGACY_CALORIE_GOAL_KEY),
  ]);

  if (scopedValue !== null || legacyValue === null) {
    return;
  }

  await AsyncStorage.setItem(scopedKey, legacyValue);
  await AsyncStorage.removeItem(LEGACY_CALORIE_GOAL_KEY);
}

export async function loadMeals(userId: string): Promise<Meal[]> {
  assertUserId(userId);

  try {
    await migrateLegacyMealsIfNeeded(userId);
    const raw = await AsyncStorage.getItem(mealsKey(userId));
    if (!raw) {
      return [];
    }

    return sanitizeMeals(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function saveMeals(userId: string, meals: Meal[]): Promise<void> {
  assertUserId(userId);

  try {
    await AsyncStorage.setItem(mealsKey(userId), JSON.stringify(sanitizeMeals(meals)));
  } catch {
    throw new Error("Impossible d'enregistrer les repas.");
  }
}

export async function addMeal(userId: string, meal: Meal): Promise<Meal[]> {
  const currentMeals = await loadMeals(userId);
  const nextMeals = [meal, ...currentMeals];
  await saveMeals(userId, nextMeals);
  return nextMeals;
}

export async function deleteMeal(userId: string, mealId: string): Promise<Meal[]> {
  const currentMeals = await loadMeals(userId);
  const nextMeals = currentMeals.filter((meal) => meal.id !== mealId);
  await saveMeals(userId, nextMeals);
  return nextMeals;
}

export async function updateMeal(userId: string, updatedMeal: Meal): Promise<Meal[]> {
  const currentMeals = await loadMeals(userId);
  const nextMeals = currentMeals.map((meal) => (meal.id === updatedMeal.id ? updatedMeal : meal));
  await saveMeals(userId, nextMeals);
  return nextMeals;
}

export async function loadCalorieGoal(userId: string, defaultValue = 2000): Promise<number> {
  assertUserId(userId);

  try {
    await migrateLegacyCalorieGoalIfNeeded(userId);
    const raw = await AsyncStorage.getItem(calorieGoalKey(userId));
    if (!raw) {
      return defaultValue;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function saveCalorieGoal(userId: string, goal: number): Promise<number> {
  assertUserId(userId);

  const normalizedGoal = Number.isFinite(goal) && goal > 0 ? Math.round(goal) : 2000;

  try {
    await AsyncStorage.setItem(calorieGoalKey(userId), String(normalizedGoal));
    return normalizedGoal;
  } catch {
    throw new Error("Impossible d'enregistrer l'objectif calorique.");
  }
}
