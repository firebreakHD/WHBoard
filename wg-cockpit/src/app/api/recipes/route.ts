import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Meal = Record<string, string | null> & { idMeal?: string; strMeal?: string; strMealThumb?: string; strCategory?: string; strArea?: string; strInstructions?: string; strSource?: string; strYoutube?: string };
type RecipeIngredient = { name: string; amount: string };
type Recipe = { id: string; name: string; image: string; category: string; area: string; instructions: string[]; source: string; ingredients: RecipeIngredient[] };
type CacheEntry = { expires: number; recipes: Recipe[] };
const cache = new Map<string, CacheEntry>();
const ttl = 60 * 60_000;

function mapMeal(meal: Meal | null | undefined): Recipe | null {
  if (!meal?.idMeal || !meal.strMeal) return null;
  const ingredients: RecipeIngredient[] = [];
  for (let index = 1; index <= 20; index++) {
    const name = meal[`strIngredient${index}`]?.trim();
    if (!name) continue;
    ingredients.push({ name, amount: meal[`strMeasure${index}`]?.trim() ?? "" });
  }
  return {
    id: `mealdb-${meal.idMeal}`,
    name: meal.strMeal,
    image: meal.strMealThumb ?? "",
    category: meal.strCategory ?? "",
    area: meal.strArea ?? "",
    instructions: (meal.strInstructions ?? "").split(/\r?\n+/).map((line) => line.trim()).filter(Boolean),
    source: meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`,
    ingredients,
  };
}

async function mealDb(url: URL, fresh = false) {
  const response = await fetch(url, { ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 3600 } }), signal: AbortSignal.timeout(7000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Rezeptquelle antwortet mit ${response.status}.`);
  return response.json() as Promise<{ meals?: Meal[] | null }>;
}

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().replace(/\s+/g, " ");
  if (query.length > 80) return NextResponse.json({ error: "Bitte kürzer suchen." }, { status: 400 });
  const key = query ? `search:${query.toLocaleLowerCase("de")}` : "discover";
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return NextResponse.json({ recipes: cached.recipes, source: "TheMealDB" }, { headers: { "Cache-Control": "public, max-age=900, stale-while-revalidate=1800" } });

  try {
    let meals: Meal[] = [];
    if (query) {
      const url = new URL("https://www.themealdb.com/api/json/v1/1/search.php");
      url.searchParams.set("s", query);
      meals = (await mealDb(url)).meals ?? [];
    } else {
      const picks = await Promise.allSettled(Array.from({ length: 6 }, () => mealDb(new URL("https://www.themealdb.com/api/json/v1/1/random.php"), true)));
      meals = picks.flatMap((pick) => pick.status === "fulfilled" ? pick.value.meals ?? [] : []);
    }
    const recipes = [...new Map(meals.map(mapMeal).filter((recipe): recipe is Recipe => Boolean(recipe)).map((recipe) => [recipe.id, recipe])).values()].slice(0, 18);
    cache.set(key, { recipes, expires: Date.now() + ttl });
    return NextResponse.json({ recipes, source: "TheMealDB" }, { headers: { "Cache-Control": "public, max-age=900, stale-while-revalidate=1800" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rezepte konnten nicht geladen werden.";
    return NextResponse.json({ error: message, recipes: [] }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
