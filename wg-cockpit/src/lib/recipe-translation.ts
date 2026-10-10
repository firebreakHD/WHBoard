import {hasEnglishRecipeWords} from "./recipe-policy.ts";

const translations=new Map<string,Promise<string>>();
const unavailable="Die deutsche Übersetzung ist gerade nicht verfügbar. Bitte später erneut versuchen.";
let active=0;
const waiting:(()=>void)[]=[];
async function limited<T>(work:()=>Promise<T>):Promise<T>{
  if(active>=6)await new Promise<void>(resolve=>waiting.push(resolve));else active++;
  try{return await work()}finally{const next=waiting.shift();if(next)next();else active--}
}

export function translationChunks(text:string){
  const chunks:string[]=[];let current="";
  // MyMemory accepts at most 500 UTF-8 bytes, including non-ASCII letters.
  for(const word of text.trim().split(/\s+/)){
    if(Buffer.byteLength(word,"utf8")>480)throw new Error(unavailable);
    const joined=current?`${current} ${word}`:word;
    if(Buffer.byteLength(joined,"utf8")>480){chunks.push(current);current=word}else current=joined;
  }
  if(current)chunks.push(current);return chunks;
}

export async function translateRecipeText(text:string,direction:"en|de"|"de|en"="en|de",source="en"):Promise<string>{
  if(!text.trim())return "";
  const key=`${direction}:${source}:${text}`;const cached=translations.get(key);if(cached)return cached;
  const pending=Promise.all(translationChunks(text).map(chunk=>limited(async()=>{
    try{
      let translated:string|undefined;
      const endpoint=process.env.RECIPE_TRANSLATION_URL;
      if(endpoint){
        const response=await fetch(new URL("translate",endpoint.endsWith("/")?endpoint:`${endpoint}/`),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q:chunk,source:direction==="de|en"?"de":"auto",target:direction==="de|en"?"en":"de",format:"text",...(process.env.RECIPE_TRANSLATION_KEY?{api_key:process.env.RECIPE_TRANSLATION_KEY}:{})}),signal:AbortSignal.timeout(6000)});
        if(!response.ok)throw new Error(unavailable);
        translated=(await response.json() as {translatedText?:string}).translatedText;
      }else{
        const url=new URL("https://api.mymemory.translated.net/get");url.searchParams.set("q",chunk);url.searchParams.set("langpair",direction==="de|en"?direction:`${source}|de`);
        const response=await fetch(url,{signal:AbortSignal.timeout(5000)});
        if(!response.ok)throw new Error(unavailable);
        const result=await response.json() as {responseData?:{translatedText?:string};responseStatus?:number;quotaFinished?:boolean};
        if(result.responseStatus!==200||result.quotaFinished)throw new Error(unavailable);
        translated=result.responseData?.translatedText;
      }
      if(typeof translated!=="string"||!translated.trim()||/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID LANGUAGE|DAILY LIMIT/i.test(translated))throw new Error(unavailable);
      const value=translated.trim().replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");
      if(direction==="en|de"&&hasEnglishRecipeWords(value))throw new Error(unavailable);
      // Some services return the input unchanged despite a successful status.
      // Only allow shared dish names and numeric measurements in that case.
      if(direction==="en|de"&&source!=="de"&&value.toLowerCase()===chunk.toLowerCase()&&/[a-z]/i.test(value)&&! /^(?:pizza|pasta|curry|dessert|gulasch|goulash|risotto|lasagne|lasagna|stroganoff|schnitzel|kaiserschmarrn|falafel|hummus|tiramisu|[\d\s.,/½¼¾–-]+(?:g|kg|ml|l|EL|TL|Stück))$/i.test(value))throw new Error(unavailable);
      return value;
    }catch{throw new Error(unavailable)}
  }))).then(parts=>parts.join(" "));
  translations.set(key,pending);
  try{const result=await pending;if(translations.size>3000)translations.delete(translations.keys().next().value!);return result}catch(error){translations.delete(key);throw error}
}
