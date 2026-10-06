import {NextResponse} from "next/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

type IconifySearch={icons?:unknown};
type EmojiHubResult={name?:unknown;unicode?:unknown};
type EmojiResult={name:string;emoji:string;code:string};

const aliases:[string,string][]=[
 ["küchenrolle","roll of paper"],["küchentuch","roll of paper"],["toilettenpapier","roll of paper"],["taschentuch","tissue"],["taschentücher","tissue"],["küchenpapier","roll of paper"],
 ["spülmittel","soap"],["waschmittel","laundry"],["weichspüler","laundry"],["geschirrspültabs","dish soap"],["zahnbürste","toothbrush"],["zahnpasta","toothpaste"],
 ["erdäpfel","potato"],["kartoffel","potato"],["karfiol","cauliflower"],["paradeiser","tomato"],["marille","apricot"],["melanzani","eggplant"],["fisolen","green beans"],
 ["einkaufstasche","shopping bag"],["eier","egg"],["milch","milk"],["semmel","bread"],["weckerl","bread"],["brot","bread"],["käs","cheese"],["käse","cheese"],
 ["erdbeeren","strawberry"],["heidelbeeren","blueberry"],["himbeeren","raspberry"],["weintrauben","grapes"],["gurken","cucumber"],["tomaten","tomato"],["paprika","bell pepper"],
 ["hundefutter","dog"],["katzenfutter","cat"],["blumen","bouquet"],["pflanze","potted plant"],["kaffee","coffee"],["mineralwasser","water"],["getränke","drink"],
 ["waschmaschine","washing machine"],["müllbeutel","wastebasket"],["müllsack","wastebasket"],["reiniger","soap"],["reinigen","soap"],["spülschwamm","sponge"],
 ["nudeln","spaghetti"],["pasta","spaghetti"],["reis","cooked rice"],["fleisch","meat"],["huhn","chicken"],["hähnchen","chicken"],["fisch","fish"],["fischstäbchen","fish"],
 ["obst","fruit"],["gemüse","vegetable"],["milchprodukte","milk"],["backwaren","bread"],["fleisch & fisch","fish"],["nudeln & reis","rice"],["haushalt","soap"],["snacks","snack"],["getränke","drink"]
];

const categoryTerms:Record<string,string>={"Obst & Gemüse":"fruit vegetable","Milchprodukte":"milk cheese","Backwaren":"bread","Fleisch & Fisch":"fish meat","Nudeln & Reis":"rice pasta","Getränke":"drink","Snacks":"snack","Haushalt":"cleaning","Sonstiges":"shopping"};
async function englishQuery(value:string){const query=value.trim().toLocaleLowerCase("de");const alias=aliases.find(([term])=>query.includes(term));if(alias)return alias[1];try{const response=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(value.trim())}&langpair=de%7Cen`,{signal:AbortSignal.timeout(900),next:{revalidate:86400}});if(response.ok){const data=await response.json() as {responseData?:{translatedText?:unknown}};const translated=typeof data.responseData?.translatedText==="string"?data.responseData.translatedText.replace(/<[^>]*>/g,"").trim():"";if(translated&&translated.toLocaleLowerCase()!==query)return translated}}catch{}return query}
function iconNameToEmojiResult(name:string):EmojiResult{const [,slug]=name.split(":");return{name:slug.replace(/-/g," ").replace(/\b\w/g,char=>char.toLocaleUpperCase()),emoji:`/api/emoji/image?code=${encodeURIComponent(name)}`,code:name}}
function unicodeResults(records:EmojiHubResult[]):EmojiResult[]{return records.flatMap(record=>{const name=typeof record.name==="string"?record.name:"";const codePoints=Array.isArray(record.unicode)?record.unicode.map(value=>typeof value==="string"?value.replace(/^U\+/i,""):"").filter(value=>/^[\da-f]{1,6}$/i.test(value)):[];if(!name||!codePoints.length)return[];try{return[{name,emoji:String.fromCodePoint(...codePoints.map(value=>parseInt(value,16))),code:codePoints.map(value=>value.toLowerCase()).join("-")}]}catch{return[]}})}
async function iconify(query:string):Promise<EmojiResult[]>{if(!query)return[];const response=await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=32&prefixes=twemoji`,{signal:AbortSignal.timeout(1600),next:{revalidate:86400}});if(!response.ok)return[];const result=await response.json() as IconifySearch;return(Array.isArray(result.icons)?result.icons:[]).filter((name):name is string=>typeof name==="string"&&/^twemoji:[a-z0-9-]{1,80}$/i.test(name)).slice(0,32).map(iconNameToEmojiResult)}

export async function GET(request:Request){
 const params=new URL(request.url).searchParams;const raw=params.get("q")?.trim().slice(0,80)||"";const category=params.get("category")||"";if(raw.length<2)return NextResponse.json({results:[],translatedQuery:"",categoryFallback:false},{headers:{"Cache-Control":"no-store"}});
 const translatedQuery=await englishQuery(raw);
 try{
  let results=await iconify(translatedQuery);
  let categoryFallback=false;
  if(!results.length&&categoryTerms[category]){results=await iconify(categoryTerms[category]);categoryFallback=results.length>0}
  if(!results.length){const response=await fetch(`https://emojihub.yurace.pro/api/search?q=${encodeURIComponent(translatedQuery)}`,{signal:AbortSignal.timeout(1000),next:{revalidate:86400}});if(response.ok){const records=await response.json() as EmojiHubResult[];results=unicodeResults(Array.isArray(records)?records:[]).slice(0,32)}}
  return NextResponse.json({results,translatedQuery,categoryFallback},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({results:[],translatedQuery,categoryFallback:false},{headers:{"Cache-Control":"no-store"}})}
}
