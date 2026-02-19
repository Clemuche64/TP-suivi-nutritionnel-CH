export type MealType = "Petit-dejeuner" | "Dejeuner" | "Diner" | "Snack";

export interface Food {
  id: string;
  name: string;
  brand: string;
  image_url: string;
  nutriscore: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

export interface Meal {
  id: string;
  name: string;
  date: string;
  foods: Food[];
}
