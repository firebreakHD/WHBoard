import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Meal = Record<string, string | null> & { idMeal?: string; strMeal?: string; strMealThumb?: string; strCategory?: string; strArea?: string; strInstructions?: string; strSource?: string; strYoutube?: string };
type RecipeIngredient = { name: string; amount: string };
type Recipe = { id: string; name: string; image: string; category: string; area: string; instructions: string[]; source: string; ingredients: RecipeIngredient[] };
type CacheEntry = { expires: number; recipes: Recipe[] };
const cache = new Map<string, CacheEntry>();
const ttl = 60 * 60_000;
const germanQueryAliases:Record<string,string>={"nudeln":"pasta","nudelauflauf":"pasta","kartoffeln":"potato","kartoffelauflauf":"potato","huhn":"chicken","hähnchen":"chicken","hühnchen":"chicken","rindfleisch":"beef","schweinefleisch":"pork","fisch":"fish","kuchen":"cake","pfannkuchen":"pancake","palatschinken":"pancake","suppe":"soup","salat":"salad","gemüse":"vegetable","gemuese":"vegetable","reis":"rice","tomaten":"tomato","tomatensuppe":"tomato soup","pizza":"pizza","brot":"bread","frühstück":"breakfast","fruehstueck":"breakfast","dessert":"dessert"};

async function searchTermInEnglish(query:string){const alias=germanQueryAliases[query.toLocaleLowerCase("de")];if(alias)return alias;if(!/[äöüß]/i.test(query)&&!/nudel|kartoffel|huhn|hähn|gemüse|gemuese|fleisch|kuchen|suppe|pfann|palatsch|frühstück|fruehstueck/i.test(query))return query;try{const url=new URL("https://api.mymemory.translated.net/get");url.searchParams.set("q",query);url.searchParams.set("langpair","de|en");const response=await fetch(url,{next:{revalidate:86400},signal:AbortSignal.timeout(2500)});if(!response.ok)return query;const result=await response.json() as {responseData?:{translatedText?:string}};const translated=result.responseData?.translatedText?.trim();return translated&&translated.length<120?translated:query}catch{return query}}

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
      url.searchParams.set("s", await searchTermInEnglish(query));
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
