import { NextRequest, NextResponse } from "next/server";
import { localizeRecipeAmount, localizeRecipeIngredient } from "@/lib/recipe-localization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Meal = Record<string, string | null> & { idMeal?: string; strMeal?: string; strMealThumb?: string; strCategory?: string; strArea?: string; strInstructions?: string; strSource?: string; strYoutube?: string };
type RecipeIngredient = { name: string; amount: string; hint?: string };
type Recipe = { id: string; name: string; image: string; category: string; area: string; instructions: string[]; source: string; ingredients: RecipeIngredient[]; portions?: number; ingredientCount?:number; detailsLoaded?:boolean; provider?:"cooklang"|"mealdb"; locale?:string };
type CacheEntry = { expires: number; recipes: Recipe[] };
type CooklangSearchItem = { id:number;title:string;summary?:string|null;tags?:string[];locale?:string;image_url?:string|null;source_url?:string|null;feed?:{title?:string} };
type CooklangDetail = CooklangSearchItem & { content?:string; ingredients?:{name:string;quantity?:number|null;unit?:string|null}[]; servings?:number|null; total_time_minutes?:number|null };
const cache = new Map<string, CacheEntry>();
const ttl = 60 * 60_000;
const germanQueryAliases:Record<string,string[]>={"nudeln":["pasta"],"nudelauflauf":["pasta bake","pasta"],"kartoffeln":["potato"],"kartoffelauflauf":["potato casserole","potato"],"huhn":["chicken"],"hahnchen":["chicken"],"huhnchen":["chicken"],"rindfleisch":["beef"],"schweinefleisch":["pork"],"fisch":["fish"],"kuchen":["cake"],"pfannkuchen":["pancake"],"palatschinken":["pancake"],"suppe":["soup"],"salat":["salad"],"gemuse":["vegetable"],"reis":["rice"],"tomaten":["tomato"],"tomatensuppe":["tomato soup"],"pizza":["pizza"],"brot":["bread"],"fruhstuck":["breakfast"],"dessert":["dessert"],"gulasch":["goulash","hungarian goulash","beef stew"],"rindsgulasch":["goulash","hungarian goulash","beef stew"],"ungarisches gulasch":["hungarian goulash","goulash","beef stew"],"gulaschsuppe":["goulash soup","soup"],"kaiserschmarrn":["kaiserschmarrn","pancake"],"schnitzel":["schnitzel","breaded cutlet"],"spatzle":["spaetzle","pasta"],"bratkartoffeln":["fried potatoes","potato"],"erdapfel":["potato"],"faschierte laibchen":["meatballs","beef"],"fleischlaibchen":["meatballs","beef"],"schweinsbraten":["pork roast","pork"]};

function normalizeQuery(value:string){return value.toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ß/g,"ss").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()}
async function translateText(text:string, direction:"de|en"|"en|de"="en|de"){const value=text.trim();if(!value||value.length>480)return text;try{const url=new URL("https://api.mymemory.translated.net/get");url.searchParams.set("q",value);url.searchParams.set("langpair",direction);const response=await fetch(url,{next:{revalidate:86400},signal:AbortSignal.timeout(3500)});if(!response.ok)return text;const result=await response.json() as {responseData?:{translatedText?:string};responseStatus?:number};const translated=result.responseData?.translatedText?.trim();return result.responseStatus===200&&translated&&translated.length<Math.max(140,value.length*3)?translated:text}catch{return text}}
async function translateLongText(text:string){
  if(text.trim().length<=450)return translateText(text);
  const sentences=text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)?.map(part=>part.trim()).filter(Boolean)??[text];
  const chunks:string[]=[];let current="";
  for(const sentence of sentences){if(current&&`${current} ${sentence}`.length>430){chunks.push(current);current=sentence}else current=current?`${current} ${sentence}`:sentence}
  if(current)chunks.push(current);
  return (await Promise.all(chunks.map(chunk=>translateText(chunk)))).join(" ");
}
async function searchTerms(query:string){const key=normalizeQuery(query);const aliases=germanQueryAliases[key]??germanQueryAliases[key.replace(/\s+/g,"")];const translated=aliases?.[0]??await translateText(query,"de|en");return [...new Set([translated,...(aliases??[]),query].map(value=>value.trim()).filter(Boolean))].slice(0,4)}

async function cooklangSearch(term:string,page=1,locale?:string){const url=new URL("https://recipes.cooklang.org/api/search");url.searchParams.set("q",term);url.searchParams.set("limit","100");url.searchParams.set("page",`${page}`);if(locale)url.searchParams.set("locale",locale);const response=await fetch(url,{next:{revalidate:1800},signal:AbortSignal.timeout(9000),headers:{accept:"application/json"}});if(!response.ok)throw new Error(`Cooklang antwortet mit ${response.status}.`);return response.json() as Promise<{results?:CooklangSearchItem[]}>}

function mapCooklangCard(item:CooklangSearchItem):Recipe{return{id:`cooklang-${item.id}`,name:item.title,image:item.image_url??"",category:(item.tags??[]).slice(0,2).join(" · "),area:item.feed?.title??"",instructions:[],source:item.source_url??`https://recipes.cooklang.org/api/recipes/${item.id}`,ingredients:[],detailsLoaded:false,provider:"cooklang",locale:item.locale}}

function cooklangSteps(content:string){return content.split(/\r?\n\s*\r?\n/).map(step=>step.trim()).filter(step=>step&&!/^>>/m.test(step)).map(step=>step.replace(/^#+\s*/,"").replace(/@([^{}]+)\{[^}]*\}/g,"$1").replace(/#([^{}]+)\{[^}]*\}/g,"$1").replace(/~\{([^%}]+)%([^}]+)\}/g,(_,amount:string,unit:string)=>`${amount} ${localizeRecipeAmount(unit)}`).replace(/\s+/g," ").trim()).filter(Boolean)}

function mapCooklangDetail(detail:CooklangDetail):Recipe{
  const ingredients=(detail.ingredients??[]).map(item=>{const localized=localizeRecipeIngredient(item.name);const quantity=item.quantity==null?"":Number.isInteger(item.quantity)?`${item.quantity}`:item.quantity.toLocaleString("de-AT",{maximumFractionDigits:2});return{name:localized.name,amount:[quantity,localizeRecipeAmount(item.unit??"")].filter(Boolean).join(" "),hint:localized.hint}});
  return{id:`cooklang-${detail.id}`,name:detail.title,image:detail.image_url??"",category:(detail.tags??[]).slice(0,2).join(" · "),area:detail.feed?.title??"",instructions:cooklangSteps(detail.content??""),source:detail.source_url??`https://recipes.cooklang.org/api/recipes/${detail.id}`,ingredients,portions:detail.servings??4,ingredientCount:ingredients.length,detailsLoaded:true,provider:"cooklang",locale:detail.locale};
}

async function translateNames(recipes:Recipe[]){const translated=[...recipes];const batches:Array<{start:number;pending:Recipe[]}>=[];for(let start=0;start<recipes.length;start+=8){const pending=recipes.slice(start,start+8).filter(recipe=>!recipe.locale?.toLowerCase().startsWith("de"));if(pending.length)batches.push({start,pending})}const results=await Promise.all(batches.map(batch=>translateText(batch.pending.map(recipe=>recipe.name).join(" ||| "),"en|de")));for(let batchIndex=0;batchIndex<batches.length;batchIndex++){const {start,pending}=batches[batchIndex];const names=results[batchIndex].split(/\s*\|\|\|\s*/);if(names.length===pending.length)for(let index=0;index<pending.length;index++){const at=start+recipes.slice(start,start+8).findIndex(recipe=>recipe.id===pending[index].id);translated[at]={...translated[at],name:names[index]||pending[index].name}}}return translated}

function mapMeal(meal: Meal | null | undefined): Recipe | null {
  if (!meal?.idMeal || !meal.strMeal) return null;
  const ingredients: RecipeIngredient[] = [];
  for (let index = 1; index <= 20; index++) {
    const name = meal[`strIngredient${index}`]?.trim();
    if (!name) continue;
    const localized=localizeRecipeIngredient(name);
    const rawAmount=meal[`strMeasure${index}`]?.trim() ?? "";
    const modifier=rawAmount.match(/\b(fin(?:ely)? chopped|chopped finely|roughly chopped|chopped|diced|sliced|grated|crushed|peeled|minced)\s*$/i);
    const amount=localizeRecipeAmount(modifier?rawAmount.slice(0,modifier.index).trim():rawAmount);
    const hint=[localized.hint,modifier?localizeRecipeIngredient(`${name} ${modifier[1]}`).hint:""].filter(Boolean).join(", ");
    ingredients.push({ name: localized.name, amount, hint });
  }
  return {
    id: `mealdb-${meal.idMeal}`,
    name: meal.strMeal,
    image: meal.strMealThumb ?? "",
    category: meal.strCategory ?? "",
    area: meal.strArea ?? "",
    instructions: (meal.strInstructions ?? "").split(/\r?\n+/).flatMap(line=>line.trim().split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ])/)).map(line=>line.trim()).filter((line) => Boolean(line) && !/^step\s*\d+\s*:?[.]?$/i.test(line)),
    source: meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`,
    ingredients,
    provider: "mealdb",
  };
}

async function germanize(recipe:Recipe):Promise<Recipe>{
  if(recipe.locale?.toLowerCase().startsWith("de"))return recipe;
  const [name,category,area,...instructions]=await Promise.all([recipe.name,recipe.category,recipe.area].map(text=>translateText(text,"en|de")).concat(recipe.instructions.map(text=>translateLongText(text))));
  return{...recipe,name,category,area,instructions};
}

async function mealDb(url: URL, fresh = false) {
  const response = await fetch(url, { ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 3600 } }), signal: AbortSignal.timeout(7000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Rezeptquelle antwortet mit ${response.status}.`);
  return response.json() as Promise<{ meals?: Meal[] | null }>;
}

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().replace(/\s+/g, " ");
  const fresh=request.nextUrl.searchParams.get("fresh")==="1";
  const detailId=request.nextUrl.searchParams.get("id")??"";
  if(detailId.startsWith("cooklang-")){const id=Number(detailId.slice("cooklang-".length));if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:"Rezept nicht gefunden."},{status:400});try{const response=await fetch(`https://recipes.cooklang.org/api/recipes/${id}`,{next:{revalidate:86400},signal:AbortSignal.timeout(9000),headers:{accept:"application/json"}});if(!response.ok)throw new Error(`Cooklang antwortet mit ${response.status}.`);const detail=await response.json() as CooklangDetail;return NextResponse.json({recipe:await germanize(mapCooklangDetail(detail))},{headers:{"Cache-Control":"public, max-age=3600, stale-while-revalidate=7200"}})}catch(error){const message=error instanceof Error?error.message:"Rezept konnte nicht geladen werden.";return NextResponse.json({error:message},{status:502,headers:{"Cache-Control":"no-store"}})}}
  if (query.length > 80) return NextResponse.json({ error: "Bitte kürzer suchen." }, { status: 400 });
  const key = query ? `search:${query.toLocaleLowerCase("de")}` : "discover";
  const cached = cache.get(key);
  if (!fresh&&cached && cached.expires > Date.now()) return NextResponse.json({ recipes: cached.recipes, source: "TheMealDB + Cooklang Federation" }, { headers: { "Cache-Control": "public, max-age=900, stale-while-revalidate=1800" } });

  try {
    let meals: Meal[] = [];
    if (query) {
      const terms=await searchTerms(query);
      const searches=terms.map(async term=>{const url=new URL("https://www.themealdb.com/api/json/v1/1/search.php");url.searchParams.set("s",term);return mealDb(url,fresh)});
      // Cooklang returns 100 results per page. Search several translated and
      // original terms, and read enough pages to avoid silently stopping at 3 hits.
      const cookSearches=terms.flatMap(term=>[1,2,3,4].map(page=>cooklangSearch(term,page)));
      const germanCookSearches=[1,2].map(page=>cooklangSearch(query,page,"de"));
      const [mealResults,cookResults,germanCookResults]=await Promise.all([Promise.allSettled(searches),Promise.allSettled(cookSearches),Promise.allSettled(germanCookSearches)]);
      meals=mealResults.flatMap(result=>result.status==="fulfilled"?result.value.meals??[]:[]);
      const cookItems=[...cookResults.flatMap(result=>result.status==="fulfilled"?result.value.results??[]:[]),...germanCookResults.flatMap(result=>result.status==="fulfilled"?result.value.results??[]:[])];
      const cookCards=[...new Map(cookItems.filter(item=>Number.isSafeInteger(item.id)&&item.title).map(item=>[item.id,item] as const)).values()].map(mapCooklangCard);
      const normalizedQuery=normalizeQuery(query);
      const merged=[...new Map([...meals.map(mapMeal).filter((recipe):recipe is Recipe=>Boolean(recipe)).map(recipe=>[recipe.id,recipe] as const),...cookCards.map(recipe=>[recipe.id,recipe] as const)]).values()];
      const aliases=germanQueryAliases[normalizedQuery]??germanQueryAliases[normalizedQuery.replace(/\s+/g,"")]??[];
      const searchWords=[...normalizedQuery.split(" "),...aliases.flatMap(term=>normalizeQuery(term).split(" "))].filter(word=>word.length>2);
      const relevant=merged.filter(recipe=>{
        if(!normalizedQuery)return true;
        const searchable=normalizeQuery(`${recipe.name} ${recipe.category} ${recipe.area} ${recipe.ingredients.map(item=>item.name).join(" ")}`);
        return searchWords.length===0||searchWords.some(word=>searchable.includes(word));
      }).sort((a,b)=>{
        const score=(recipe:Recipe)=>{const title=normalizeQuery(recipe.name);if(title===normalizedQuery)return 0;if(title.startsWith(`${normalizedQuery} `)||title.includes(` ${normalizedQuery} `))return 1;const matched=searchWords.filter(word=>title.includes(word)).length;return 10-matched};
        return score(a)-score(b)||a.name.localeCompare(b.name,"de");
      }).slice(0,180);
      const [complete,cookCardsToTranslate]=[relevant.filter(recipe=>recipe.provider!=="cooklang"),relevant.filter(recipe=>recipe.provider==="cooklang")];
      const recipes=[...await Promise.all(complete.map(germanize)),...await translateNames(cookCardsToTranslate)];
      if(!fresh)cache.set(key,{recipes,expires:Date.now()+ttl});
      return NextResponse.json({recipes,source:"TheMealDB + Cooklang Federation"},{headers:{"Cache-Control":fresh?"no-store":"public, max-age=900, stale-while-revalidate=1800"}});
    } else {
      const picks = await Promise.allSettled(Array.from({ length: 15 }, () => mealDb(new URL("https://www.themealdb.com/api/json/v1/1/random.php"), true)));
      meals = picks.flatMap((pick) => pick.status === "fulfilled" ? pick.value.meals ?? [] : []);
    }
    const recipes = await Promise.all([...new Map(meals.map(mapMeal).filter((recipe): recipe is Recipe => Boolean(recipe)).map((recipe) => [recipe.id, recipe])).values()].slice(0, query?180:9).map(germanize));
    if(!fresh)cache.set(key, { recipes, expires: Date.now() + ttl });
    return NextResponse.json({ recipes, source: "TheMealDB + Cooklang Federation" }, { headers: { "Cache-Control": fresh?"no-store":"public, max-age=900, stale-while-revalidate=1800" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rezepte konnten nicht geladen werden.";
    return NextResponse.json({ error: message, recipes: [] }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
