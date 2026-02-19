import { Food } from "../types/models";

const OPEN_FOOD_FACTS_USER_AGENT = "TPNutrition/1.0 (expo)";
const OPEN_FOOD_FACTS_FIELDS =
  "code,product_name,product_name_fr,product_name_en,brands,nutriments,image_url,nutriscore_grade";

type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  product_name_en?: string;
  brands?: string;
  image_url?: string;
  nutriscore_grade?: string;
  nutriments?: {
    "energy-kcal_100g"?: number | string;
    proteins_100g?: number | string;
    carbohydrates_100g?: number | string;
    fat_100g?: number | string;
  };
};

const requestHeaders: HeadersInit = {
  "User-Agent": OPEN_FOOD_FACTS_USER_AGENT,
  "X-User-Agent": OPEN_FOOD_FACTS_USER_AGENT,
  Accept: "application/json",
};

function toNumber(value: number | string | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function resolveName(product: OpenFoodFactsProduct): string {
  return (
    product.product_name?.trim() ||
    product.product_name_fr?.trim() ||
    product.product_name_en?.trim() ||
    "Sans nom"
  );
}

function mapProductToFood(product: OpenFoodFactsProduct): Food {
  const fallbackId = `off-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: product.code?.trim() || fallbackId,
    name: resolveName(product),
    brand: product.brands?.trim() || "Marque inconnue",
    image_url: product.image_url?.trim() || "",
    nutriscore: product.nutriscore_grade?.trim().toUpperCase() || "-",
    calories: toNumber(product.nutriments?.["energy-kcal_100g"]),
    proteins: toNumber(product.nutriments?.proteins_100g),
    carbs: toNumber(product.nutriments?.carbohydrates_100g),
    fats: toNumber(product.nutriments?.fat_100g),
  };
}

export async function searchFoods(query: string): Promise<Food[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const url =
    "https://fr.openfoodfacts.org/cgi/search.pl?" +
    `search_terms=${encodeURIComponent(trimmedQuery)}` +
    "&search_simple=1&action=process&json=1" +
    `&fields=${OPEN_FOOD_FACTS_FIELDS}` +
    "&page_size=10&page=1";

  let response: Response;
  try {
    response = await fetch(url, { headers: requestHeaders });
  } catch {
    throw new Error("Reseau indisponible pendant la recherche d'aliments.");
  }

  if (!response.ok) {
    throw new Error(`Recherche Open Food Facts impossible (${response.status}).`);
  }

  try {
    const json = (await response.json()) as { products?: OpenFoodFactsProduct[] };
    const products = Array.isArray(json.products) ? json.products : [];
    return products.map(mapProductToFood);
  } catch {
    throw new Error("Reponse Open Food Facts invalide.");
  }
}

export async function getFoodByBarcode(barcode: string): Promise<Food | null> {
  const trimmedBarcode = barcode.trim();
  if (!trimmedBarcode) {
    return null;
  }

  const url =
    "https://fr.openfoodfacts.org/api/v2/product/" +
    `${encodeURIComponent(trimmedBarcode)}.json` +
    `?fields=${OPEN_FOOD_FACTS_FIELDS}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: requestHeaders });
  } catch {
    throw new Error("Reseau indisponible pendant le scan.");
  }

  if (!response.ok) {
    throw new Error(`Scan Open Food Facts impossible (${response.status}).`);
  }

  try {
    const json = (await response.json()) as {
      status?: number;
      product?: OpenFoodFactsProduct;
    };

    if (json.status !== 1 || !json.product) {
      return null;
    }

    return mapProductToFood(json.product);
  } catch {
    throw new Error("Reponse Open Food Facts invalide pour ce code-barres.");
  }
}
