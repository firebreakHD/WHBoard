import {containsSeafood,hasEnglishRecipeWords,RECIPE_POLICY_VERSION} from "./recipe-policy.ts";
import {recipeCourse} from "./recipe-course.ts";
import {chooseRecipeSuggestions,recipeSelectionKey} from "./recipe-selection.ts";
import {translateRecipeText} from "./recipe-translation.ts";
import {localizeRecipeAmount,localizeRecipeIngredientMentions} from "./recipe-localization.ts";

const sources=[
 {host:"www.gutekueche.at",label:"GuteKueche Österreich",home:"/hauptspeisen-rezepte"},
 {host:"www.gutekueche.de",label:"GuteKueche Deutschland",home:"/schnelle-rezepte"},
 {host:"www.lecker.de",label:"LECKER",home:"/rezepte"},
 {host:"emmikochteinfach.de",label:"Emmi kocht einfach",home:"/rezepte-a-z/"},
 {host:"www.einfachkochen.de",label:"Einfach Kochen",home:"/rezepte"},
] as const;
export type GermanRecipe={id:string;name:string;image:string;category:string;area:string;description?:string;instructions:string[];source:string;ingredients:{name:string;amount:string;hint?:string}[];portions:number;ingredientCount:number;detailsLoaded:boolean;provider:"web";locale:"de";policyVersion:number;course:"main"|"dessert"};
const pages=new Map<string,Promise<GermanRecipe|null>>();
function clean(value:string){return value.replace(/\{\{\s*link\([^,]+,[^,]+,\s*"([^"]+)"\)\s*\}\}/g,"$1").replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&auml;/g,"ä").replace(/&ouml;/g,"ö").replace(/&uuml;/g,"ü").replace(/&szlig;/g,"ß").replace(/\s+/g," ").trim()}
function germanText(value:string){return localizeRecipeIngredientMentions(clean(value)).replace(/\bhigh[ -]protein\b/gi,"eiweißreich").replace(/\b(?:airfryer|air fryer)\b/gi,"Heißluftfritteuse").replace(/\bcheesecake\b/gi,"Käsekuchen").replace(/\bporridge\b/gi,"Haferbrei").replace(/\bbowls?\b/gi,"Schüsselgericht").replace(/\bdips?\b/gi,"Sauce").replace(/\bsnacks?\b/gi,"Imbiss").replace(/\bsmoothies?\b/gi,"Fruchtmix").replace(/\bone[ -]pot\b/gi,"aus einem Topf").replace(/\bwraps?\b/gi,"gefüllte Fladen").replace(/\bpancakes?\b/gi,"Pfannkuchen").replace(/\bpumpkin spice latte\b/gi,"Kürbis-Gewürz-Milchkaffee").replace(/\bpumpkin\b/gi,"Kürbis").replace(/\bfrosting\b/gi,"Glasur").replace(/\bcrumble\b/gi,"Streuseldessert").replace(/\bcookies?\b/gi,"Kekse").replace(/\bdutch baby\b/gi,"Ofenpfannkuchen")}
function objects(value:unknown):Record<string,unknown>[] {
 if(Array.isArray(value))return value.flatMap(objects);
 if(!value||typeof value!=="object")return [];
 const item=value as Record<string,unknown>;return [item,...objects(item["@graph"])];
}
function steps(value:unknown):string[]{
 if(typeof value==="string")return [germanText(value)];
 if(Array.isArray(value))return value.flatMap(steps);
 if(!value||typeof value!=="object")return [];
 const item=value as Record<string,unknown>;
 return item.itemListElement?steps(item.itemListElement):Array.isArray(item.text)?[item.text.filter((value):value is string=>typeof value==="string").map(germanText).join(" ")]:typeof item.text==="string"?[germanText(item.text)]:[];
}
function photo(value:unknown):string{
 if(typeof value==="string")return value;
 if(Array.isArray(value))return value.map(photo).find(Boolean)??"";
 if(value&&typeof value==="object"){const item=value as Record<string,unknown>;return photo(item.url??item.contentUrl)}return "";
}
function ingredient(value:string){
 const text=germanText(value).replace(/\bStk\.?\b/gi,"Stück");
 const match=text.match(/^([\d.,/½¼¾–-]+(?:\s*(?:bis|-)\s*[\d.,/]+)?\s*(?:EL|TL|g|kg|ml|l|Stück|Prise[n]?|Bund|Dose[n]?|Päckchen|Zehe[n]?|Tasse[n]?)?)\s+(.+)$/i);
 return match?{amount:localizeRecipeAmount(match[1]),name:match[2]}:{amount:"",name:text};
}

export function parseGermanRecipe(html:string,url:string,allowTranslation=false):GermanRecipe|null {
 const address=new URL(url);const source=sources.find(item=>item.host===address.hostname);if(!source)return null;
 for(const script of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  let items:Record<string,unknown>[];try{items=objects(JSON.parse(script[1]))}catch{continue}
  for(const item of items){
   if(!(Array.isArray(item["@type"])?item["@type"]:[item["@type"]]).includes("Recipe")||typeof item.name!=="string")continue;
   const instructions=steps(item.recipeInstructions).filter(Boolean);
   const ingredients=Array.isArray(item.recipeIngredient)?item.recipeIngredient.filter((value):value is string=>typeof value==="string").map(ingredient):[];
   const image=photo(item.image);if(!ingredients.length||!instructions.length||!/^https:\/\//i.test(image))continue;
   const recipe:GermanRecipe={id:`web-${Buffer.from(url).toString("base64url")}`,name:germanText(item.name),image,category:"Rezept",course:recipeCourse({name:germanText(item.name),category:Array.isArray(item.recipeCategory)?item.recipeCategory.join(" "):String(item.recipeCategory??"")}),area:source.label,description:typeof item.description==="string"?germanText(item.description):undefined,instructions,source:url,ingredients,portions:Number(String(item.recipeYield??4).match(/\d+/)?.[0])||4,ingredientCount:ingredients.length,detailsLoaded:true,provider:"web",locale:"de",policyVersion:RECIPE_POLICY_VERSION};
   if(containsSeafood(recipe)||!allowTranslation&&[recipe.name,recipe.description??"",...instructions,...ingredients.map(value=>value.name)].some(hasEnglishRecipeWords))continue;
   return recipe;
  }
 }
 return null;
}

async function readGermanRecipe(html:string,url:string){
 const recipe=parseGermanRecipe(html,url,true);if(!recipe)return null;
 const text=async(value:string)=>hasEnglishRecipeWords(value)?translateRecipeText(value):value;
 const [name,description,instructions,ingredients]=await Promise.all([text(recipe.name),text(recipe.description??""),Promise.all(recipe.instructions.map(text)),Promise.all(recipe.ingredients.map(async ingredient=>({...ingredient,name:await text(ingredient.name),amount:await text(ingredient.amount)})))]);
 const result={...recipe,name,description,instructions,ingredients};return containsSeafood(result)?null:result;
}

async function htmlPage(url:string,fresh=false){
 const address=new URL(url);if(address.protocol!=="https:"||address.username||address.password||address.port||!sources.some(source=>source.host===address.hostname))throw new Error("Ungültige Rezeptquelle.");
 const response=await fetch(address,{...(fresh?{cache:"no-store" as const}:{next:{revalidate:3600}}),headers:{accept:"text/html"},signal:AbortSignal.timeout(7000),redirect:"error"});
 if(!response.ok)throw new Error("Deutsche Rezeptquelle ist gerade nicht erreichbar.");
 const html=await response.text();if(html.length>3_000_000)throw new Error("Rezeptquelle ist zu groß.");return html;
}
export async function germanRecipeDetail(id:string){
 const url=Buffer.from(id.slice(4),"base64url").toString("utf8");return readGermanRecipe(await htmlPage(url),url);
}
function slug(value:string){return value.toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function shuffle<T>(items:T[]){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}

export async function germanRecipeSuggestions(query="",fresh=false,limit=9,excluded:ReadonlySet<string>=new Set(),course:"all"|"main"|"dessert"="all"):Promise<GermanRecipe[]>{
 const results=await Promise.allSettled(sources.map(async source=>{
  const key=slug(query);let path:string=source.home;
  const mealTheme=/^(?:abendessen|mittagessen|schnelle-kueche|leichte-snacks|kleine-mahlzeit)$/.test(key);
  const searchKey=key==="pancakes"?"pfannkuchen":key==="porridge"?"haferbrei":key;
  if(course==="dessert"&&!query){
    if(source.host==="www.gutekueche.at"||source.host==="www.gutekueche.de")path="/dessert-rezepte";
    else if(source.host==="www.lecker.de")path="/dessert";
    else if(source.host==="emmikochteinfach.de")path="/rezepte/desserts/";
    else path="/rezepte";
  }
  if(query&&!mealTheme){if(source.host==="www.gutekueche.at")path=`/${searchKey}-rezepte`;else if(source.host==="www.gutekueche.de")path=`/suche?s=${encodeURIComponent(query)}`;else if(source.host==="emmikochteinfach.de")path=`/?s=${encodeURIComponent(query)}`;else if(source.host==="www.einfachkochen.de")path=`/rezepte?search=${encodeURIComponent(query)}`;else path=`/${searchKey}`}
  const base=`https://${source.host}`;let html:string;
  try{html=await htmlPage(`${base}${path}`,fresh)}catch{html=await htmlPage(`${base}${source.home}`,fresh)}
  const urls=[...new Set([...html.matchAll(/href\s*=\s*["']([^"']+)["']/g)].flatMap(match=>{
   try{const url=new URL(match[1],base);return url.hostname===source.host&&(/-rezept-\d+$/.test(url.pathname)||source.host==="emmikochteinfach.de"&&/^\/[^/]+\/$/.test(url.pathname)||source.host==="www.einfachkochen.de"&&/^\/rezepte\/[^/]+$/.test(url.pathname)||source.host==="www.lecker.de"&&/-\d+\.html$/.test(url.pathname))?[url.href]:[]}catch{return []}
  }))];
  const relevant=(recipe:GermanRecipe)=>!query||mealTheme||[recipe.name,recipe.description??"",...recipe.ingredients.map(item=>item.name),...recipe.instructions].some(value=>slug(value).includes(searchKey));
  const candidates=shuffle(urls.filter(url=>!containsSeafood({name:decodeURIComponent(url)}))).slice(0,60);const recipes:GermanRecipe[]=[];const previous:GermanRecipe[]=[];
  for(let offset=0;offset<candidates.length&&recipes.length<Math.max(3,Math.ceil(limit/sources.length));offset+=6){
   const batch=await Promise.allSettled(candidates.slice(offset,offset+6).map(async url=>{
    let pending=pages.get(url);if(!pending){pending=htmlPage(url).then(html=>readGermanRecipe(html,url)).catch(()=>{pages.delete(url);return null});pages.set(url,pending);if(pages.size>400)pages.delete(pages.keys().next().value!)}return pending;
   }));
   for(const result of batch){if(result.status!=="fulfilled"||!result.value||!relevant(result.value)||course!=="all"&&recipeCourse(result.value)!==course)continue;
    if(excluded.has(recipeSelectionKey(result.value)))previous.push(result.value);else recipes.push(result.value);
   }
  }
  return [...recipes,...previous];
 }));
 const pools=results.map(result=>result.status==="fulfilled"?result.value:[]);const recipes:GermanRecipe[]=[];
 // Round-robin keeps the sources mixed rather than letting one fill all nine.
 for(let index=0;pools.some(pool=>index<pool.length);index++)for(const pool of pools){if(pool[index])recipes.push(pool[index])}
 return chooseRecipeSuggestions(recipes,limit,excluded);
}
