import {NextResponse} from "next/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

type EmojiHubResult={name?:unknown;unicode?:unknown};

export async function GET(request:Request){
 const query=new URL(request.url).searchParams.get("q")?.trim().slice(0,64)||"";
 if(query.length<2)return NextResponse.json({results:[]},{headers:{"Cache-Control":"no-store"}});
 try{
  const response=await fetch(`https://emojihub.yurace.pro/api/search?q=${encodeURIComponent(query)}`,{signal:AbortSignal.timeout(1800),next:{revalidate:3600}});
  if(!response.ok)return NextResponse.json({results:[]},{headers:{"Cache-Control":"no-store"}});
  const records=await response.json() as EmojiHubResult[];
  const results=(Array.isArray(records)?records:[]).flatMap(record=>{
   const name=typeof record.name==="string"?record.name:"";
   const codePoints=Array.isArray(record.unicode)?record.unicode.map(value=>typeof value==="string"?value.replace(/^U\+/i,""):"").filter(value=>/^[\da-f]{1,6}$/i.test(value)):[];
   if(!name||!codePoints.length)return[];
   try{return[{name,emoji:String.fromCodePoint(...codePoints.map(value=>parseInt(value,16))),code:codePoints.map(value=>value.toLowerCase()).join("-")}]}catch{return[]}
  }).slice(0,5);
  return NextResponse.json({results},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({results:[]},{headers:{"Cache-Control":"no-store"}})}
}
