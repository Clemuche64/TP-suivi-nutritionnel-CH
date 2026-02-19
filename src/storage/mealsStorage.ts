import AsyncStorage from "@react-native-async-storage/async-storage";
import { Food, Meal } from "../types/models";

const MEALS_KEY = "@meals";
const CALORIE_GOAL_KEY = "@calorie_goal";

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

export async function loadMeals(): Promise<Meal[]> {
  try {
    const raw = await AsyncStorage.getItem(MEALS_KEY);
    if (!raw) {
      return [];
    }

    return sanitizeMeals(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function saveMeals(meals: Meal[]): Promise<void> {
  try {
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(sanitizeMeals(meals)));
  } catch {
    throw new Error("Impossible d'enregistrer les repas.");
  }
}

export async function addMeal(meal: Meal): Promise<Meal[]> {
  const currentMeals = await loadMeals();
  const nextMeals = [meal, ...currentMeals];
  await saveMeals(nextMeals);
  return nextMeals;
}

export async function deleteMeal(mealId: string): Promise<Meal[]> {
  const currentMeals = await loadMeals();
  const nextMeals = currentMeals.filter((meal) => meal.id !== mealId);
  await saveMeals(nextMeals);
  return nextMeals;
}

export async function updateMeal(updatedMeal: Meal): Promise<Meal[]> {
  const currentMeals = await loadMeals();
  const nextMeals = currentMeals.map((meal) => (meal.id === updatedMeal.id ? updatedMeal : meal));
  await saveMeals(nextMeals);
  return nextMeals;
}

export async function loadCalorieGoal(defaultValue = 2000): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(CALORIE_GOAL_KEY);
    if (!raw) {
      return defaultValue;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function saveCalorieGoal(goal: number): Promise<number> {
  const normalizedGoal = Number.isFinite(goal) && goal > 0 ? Math.round(goal) : 2000;

  try {
    await AsyncStorage.setItem(CALORIE_GOAL_KEY, String(normalizedGoal));
    return normalizedGoal;
  } catch {
    throw new Error("Impossible d'enregistrer l'objectif calorique.");
  }
}
