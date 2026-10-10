import { NextRequest, NextResponse } from "next/server";
import { isKnownGermanRecipeIngredient, localizeRecipeAmount, localizeRecipeIngredient, localizeRecipeIngredientMentions } from "@/lib/recipe-localization";

import {containsSeafood, hasEnglishRecipeWords, RECIPE_POLICY_VERSION} from "@/lib/recipe-policy";
import {germanRecipeSuggestions,germanRecipeDetail} from "@/lib/german-recipes";
import {getRecipeTranslationIssue,translateRecipeText} from "@/lib/recipe-translation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Meal = Record<string, string | null> & { idMeal?: string; strMeal?: string; strMealThumb?: string; strCategory?: string; strArea?: string; strInstructions?: string; strSource?: string; strYoutube?: string };
type RecipeIngredient = { name: string; amount: string; hint?: string };
type Recipe = { id: string; name: string; image: string; category: string; area: string; description?:string; instructions: string[]; source: string; ingredients: RecipeIngredient[]; portions?: number; ingredientCount?:number; detailsLoaded?:boolean; provider?:"cooklang"|"mealdb"|"web"; locale?:string; policyVersion?:number };
type CacheEntry = { expires: number; recipes: Recipe[] };
type CooklangSearchItem = { id:number;title:string;summary?:string|null;tags?:string[];locale?:string;image_url?:string|null;source_url?:string|null;feed?:{title?:string} };
type CooklangDetail = CooklangSearchItem & { content?:string; ingredients?:{name:string;quantity?:number|null;unit?:string|null}[]; servings?:number|null; total_time_minutes?:number|null };
const cache = new Map<string, CacheEntry>();
const ttl = 60 * 60_000;
const germanQueryAliases:Record<string,string[]>={"nudeln":["pasta"],"nudelauflauf":["pasta bake","pasta"],"kartoffeln":["potato"],"kartoffelauflauf":["potato casserole","potato"],"huhn":["chicken"],"hahnchen":["chicken"],"huhnchen":["chicken"],"rindfleisch":["beef"],"schweinefleisch":["pork"],"fisch":["fish"],"kuchen":["cake"],"pfannkuchen":["pancake"],"palatschinken":["pancake"],"suppe":["soup"],"salat":["salad"],"gemuse":["vegetable"],"reis":["rice"],"tomaten":["tomato"],"tomatensuppe":["tomato soup"],"pizza":["pizza"],"brot":["bread"],"fruhstuck":["breakfast"],"dessert":["dessert"],"gulasch":["goulash","hungarian goulash","beef stew"],"rindsgulasch":["goulash","hungarian goulash","beef stew"],"ungarisches gulasch":["hungarian goulash","goulash","beef stew"],"gulaschsuppe":["goulash soup","soup"],"kaiserschmarrn":["kaiserschmarrn","pancake"],"schnitzel":["schnitzel","breaded cutlet"],"spatzle":["spaetzle","pasta"],"bratkartoffeln":["fried potatoes","potato"],"erdapfel":["potato"],"faschierte laibchen":["meatballs","beef"],"fleischlaibchen":["meatballs","beef"],"schweinsbraten":["pork roast","pork"]};

function normalizeQuery(value:string){return value.toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ß/g,"ss").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()}
async function translateText(text:string,direction:"de|en"|"en|de"="en|de"){
  // Query expansion can fall back to the German search; recipe content cannot.
  try{return await translateRecipeText(text,direction)}catch(error){if(direction==="de|en")return text;throw error}
}
async function searchTerms(query:string){const key=normalizeQuery(query);const aliases=germanQueryAliases[key]??germanQueryAliases[key.replace(/\s+/g,"")];const translated=aliases?.[0]??await translateText(query,"de|en");return [...new Set([translated,...(aliases??[]),query].map(value=>value.trim()).filter(Boolean))].slice(0,4)}

async function cooklangSearch(term:string,page=1,locale?:string){const url=new URL("https://recipes.cooklang.org/api/search");url.searchParams.set("q",term);url.searchParams.set("limit","100");url.searchParams.set("page",`${page}`);if(locale)url.searchParams.set("locale",locale);const response=await fetch(url,{next:{revalidate:1800},signal:AbortSignal.timeout(9000),headers:{accept:"application/json"}});if(!response.ok)throw new Error(`Cooklang antwortet mit ${response.status}.`);return response.json() as Promise<{results?:CooklangSearchItem[]}>}

function mapCooklangCard(item:CooklangSearchItem):Recipe{return{id:`cooklang-${item.id}`,name:item.title,image:item.image_url??"",category:(item.tags??[]).slice(0,2).join(" · "),area:item.feed?.title??"",description:item.summary?.trim()||undefined,instructions:[],source:item.source_url??`https://recipes.cooklang.org/api/recipes/${item.id}`,ingredients:[],detailsLoaded:false,provider:"cooklang",locale:item.locale}}

function cooklangSteps(content:string){return content.split(/\r?\n\s*\r?\n/).map(step=>step.trim()).filter(step=>step&&!/^>>/m.test(step)).map(step=>step.replace(/^#+\s*/,"").replace(/@([^{}]+)\{[^}]*\}/g,"$1").replace(/#([^{}]+)\{[^}]*\}/g,"$1").replace(/~\{([^%}]+)%([^}]+)\}/g,(_,amount:string,unit:string)=>`${amount} ${localizeRecipeAmount(unit)}`).replace(/\s+/g," ").trim()).filter(Boolean)}

function mapCooklangDetail(detail:CooklangDetail):Recipe{
  const ingredients=(detail.ingredients??[]).map(item=>{const localized=localizeRecipeIngredient(item.name);const quantity=item.quantity==null?"":Number.isInteger(item.quantity)?`${item.quantity}`:item.quantity.toLocaleString("de-AT",{maximumFractionDigits:2});return{name:localized.name,amount:[quantity,localizeRecipeAmount(item.unit??"")].filter(Boolean).join(" "),hint:localized.hint}});
  return{id:`cooklang-${detail.id}`,name:detail.title,image:detail.image_url??"",category:(detail.tags??[]).slice(0,2).join(" · "),area:detail.feed?.title??"",description:detail.summary?.trim()||undefined,instructions:cooklangSteps(detail.content??""),source:detail.source_url??`https://recipes.cooklang.org/api/recipes/${detail.id}`,ingredients,portions:detail.servings??4,ingredientCount:ingredients.length,detailsLoaded:true,provider:"cooklang",locale:detail.locale};
}

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

async function germanize(recipe:Recipe,complete=true):Promise<Recipe>{
  if(containsSeafood(recipe))throw new Error("Rezepte mit Fisch oder Meeresfrüchten sind ausgeschlossen.");
  const locale=recipe.locale?.toLowerCase().split(/[-_]/)[0]??"en";
  const germanSource=locale==="de";
  const text=async(value:string,alreadyLocalized=false)=>{
    if(!value)return "";
    if((germanSource||alreadyLocalized)&&!hasEnglishRecipeWords(value))return value;
    return translateRecipeText(value,"en|de",germanSource?"en":locale);
  };
  const [name,category,area,description]=await Promise.all([recipe.name,recipe.category,recipe.area,recipe.description??""].map(value=>text(value)));
  const instructions=complete?await Promise.all(recipe.instructions.map(async value=>localizeRecipeIngredientMentions(await text(value)))):[];
  const ingredients=await Promise.all(recipe.ingredients.map(async ingredient=>{
    const localized=localizeRecipeIngredient(ingredient.name);
    const name=localizeRecipeIngredient(await text(localized.name,localized.name!==ingredient.name||isKnownGermanRecipeIngredient(localized.name))).name;
    const amount=localizeRecipeAmount(ingredient.amount);
    const hint=localizeRecipeIngredientMentions(ingredient.hint||localized.hint||"");
    return{name,amount:await text(amount,/^[\d\s.,/½¼¾–-]*(?:g|kg|ml|l|EL|TL|Stück|Tasse|Zehen|Prise|Handvoll|Bund|Scheiben|Päckchen|Dosen)?$/i.test(amount)),hint:await text(hint,true)};
  }));
  const result={...recipe,name,category,area,description:description||undefined,ingredients,instructions,detailsLoaded:complete,policyVersion:RECIPE_POLICY_VERSION};
  if(containsSeafood(result))throw new Error("Rezepte mit Fisch oder Meeresfrüchten sind ausgeschlossen.");
  return result;
}

async function cooklangDetail(id:number){
  const response=await fetch(`https://recipes.cooklang.org/api/recipes/${id}`,{next:{revalidate:86400},signal:AbortSignal.timeout(4000),headers:{accept:"application/json"}});
  if(!response.ok)throw new Error("Rezeptdetails konnten nicht geladen werden.");
  return mapCooklangDetail(await response.json() as CooklangDetail);
}

async function safeCards(candidates:Recipe[],limit=180){
  // Inspect complete ingredients, but only translate enough valid suggestions.
  const eligible=candidates.filter(recipe=>recipe.image&&!containsSeafood(recipe)).slice(0,180);
  const recipes:Recipe[]=[];
  for(let offset=0;offset<eligible.length&&recipes.length<limit;){
    const batch=eligible.slice(offset,offset+Math.min(9,limit-recipes.length));offset+=batch.length;
    const results=await Promise.allSettled(batch.map(async recipe=>{
      const checked=recipe.provider==="cooklang"?await cooklangDetail(Number(recipe.id.slice(9))):recipe;
      if(!checked.ingredients.length||containsSeafood(checked))return null;
      return germanize(checked,false);
    }));
    recipes.push(...results.flatMap(result=>result.status==="fulfilled"&&result.value?[result.value]:[]));
  }
  return recipes.slice(0,limit);
}

function shuffled<T>(values:T[]){const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}

async function mealDb(url: URL, fresh = false) {
  const response = await fetch(url, { ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 3600 } }), signal: AbortSignal.timeout(7000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Rezeptquelle antwortet mit ${response.status}.`);
  return response.json() as Promise<{ meals?: Meal[] | null }>;
}

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().replace(/\s+/g, " ");
  const requestedLimit=Number(request.nextUrl.searchParams.get("limit")??180);
  const limit=Number.isInteger(requestedLimit)&&requestedLimit>0?Math.min(180,requestedLimit):9;
  const shuffle=request.nextUrl.searchParams.get("shuffle")==="1";
  const fresh=request.nextUrl.searchParams.get("fresh")==="1";
  const detailId=request.nextUrl.searchParams.get("id")??"";
  if(detailId.startsWith("web-")){
    try{const recipe=await germanRecipeDetail(detailId);if(!recipe)throw new Error("Dieses Rezept entspricht nicht euren Rezeptregeln.");return NextResponse.json({recipe},{headers:{"Cache-Control":"no-store"}})}catch{return NextResponse.json({error:"Das deutsche Rezept konnte nicht geladen werden."},{status:502,headers:{"Cache-Control":"no-store"}})}
  }
  if(detailId.startsWith("mealdb-")){const id=detailId.slice("mealdb-".length);if(!/^\d+$/.test(id))return NextResponse.json({error:"Rezept nicht gefunden."},{status:400});try{const url=new URL("https://www.themealdb.com/api/json/v1/1/lookup.php");url.searchParams.set("i",id);const data=await mealDb(url);const recipe=mapMeal(data.meals?.[0]);if(!recipe)throw new Error("Rezeptdetails konnten nicht geladen werden.");return NextResponse.json({recipe:await germanize(recipe)},{headers:{"Cache-Control":"no-store"}})}catch(error){const message=error instanceof Error?error.message:"Rezept konnte nicht geladen werden.";return NextResponse.json({error:message},{status:502,headers:{"Cache-Control":"no-store"}})}}
  if(detailId.startsWith("cooklang-")){const id=Number(detailId.slice("cooklang-".length));if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:"Rezept nicht gefunden."},{status:400});try{return NextResponse.json({recipe:await germanize(await cooklangDetail(id))},{headers:{"Cache-Control":"no-store"}})}catch(error){const message=error instanceof Error?error.message:"Rezept konnte nicht geladen werden.";return NextResponse.json({error:message},{status:502,headers:{"Cache-Control":"no-store"}})}}
  if (query.length > 80) return NextResponse.json({ error: "Bitte kürzer suchen." }, { status: 400 });
  const key = `${query?`search:${query.toLocaleLowerCase("de")}`:"discover"}:${limit}:${shuffle}`;
  const cached = cache.get(key);
  if (!fresh&&cached && cached.expires > Date.now()) return NextResponse.json({ recipes: cached.recipes, source: "GuteKueche Österreich + GuteKueche Deutschland + LECKER + TheMealDB + Cooklang" }, { headers: { "Cache-Control": "no-store" } });

  try {
    const native=await germanRecipeSuggestions(query,fresh,Math.min(9,limit));
    const sources="GuteKueche Österreich + GuteKueche Deutschland + LECKER + TheMealDB + Cooklang";
    if(native.length>=Math.min(9,limit)&&limit<=9){if(!fresh)cache.set(key,{recipes:native,expires:Date.now()+ttl});return NextResponse.json({recipes:native,source:sources},{headers:{"Cache-Control":"no-store"}})}
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
      const recipes=[...native,...await safeCards(shuffle?shuffled(relevant):relevant,Math.max(1,limit-native.length))].slice(0,limit);
      if(!fresh)cache.set(key,{recipes,expires:Date.now()+ttl});
      return NextResponse.json({recipes,source:sources,warning:recipes.length<Math.min(9,limit)?getRecipeTranslationIssue():undefined},{headers:{"Cache-Control":fresh?"no-store":"no-store"}});
    } else {
      const recipes:Recipe[]=[...native];const seen=new Set<string>();const target=Math.min(9,limit);
      // Seafood, duplicates or unavailable translations must not count toward nine.
      for(let round=0;round<4&&recipes.length<target;round++){
        const picks=await Promise.allSettled(Array.from({length:15},()=>mealDb(new URL("https://www.themealdb.com/api/json/v1/1/random.php"),true)));
        meals=picks.flatMap(pick=>pick.status==="fulfilled"?pick.value.meals??[]:[]);
        const candidates=meals.map(mapMeal).filter((recipe):recipe is Recipe=>Boolean(recipe)).filter(recipe=>{if(seen.has(recipe.id))return false;seen.add(recipe.id);return true});
        recipes.push(...await safeCards(candidates,target-recipes.length));
        if(getRecipeTranslationIssue())break;
      }
      if(!fresh)cache.set(key,{recipes,expires:Date.now()+ttl});
      return NextResponse.json({recipes:recipes.slice(0,target),source:sources,warning:recipes.length<target?getRecipeTranslationIssue():undefined},{headers:{"Cache-Control":"no-store"}});
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rezepte konnten nicht geladen werden.";
    return NextResponse.json({ error: message, recipes: [] }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
