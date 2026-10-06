import {NextResponse} from "next/server";

// Emoji graphics are downloaded from Twemoji (CC BY 4.0): https://github.com/jdecked/twemoji
export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:Request){
 const code=new URL(request.url).searchParams.get("code")||"";
 if(!/^[\da-f]{1,6}(?:-[\da-f]{1,6}){0,9}$/i.test(code))return NextResponse.json({error:"Ungültiges Emoji."},{status:400});
 try{
  const response=await fetch(`https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${code.toLowerCase()}.svg`,{signal:AbortSignal.timeout(1800),next:{revalidate:2592000}});
  if(!response.ok)return NextResponse.json({error:"Symbolbild nicht verfügbar."},{status:404});
  const image=await response.text();
  if(image.length>30000||!image.includes("<svg")||/<script|foreignObject|javascript:/i.test(image))return NextResponse.json({error:"Ungültige Symbolgrafik."},{status:502});
  return new NextResponse(image,{headers:{"Content-Type":"image/svg+xml; charset=utf-8","Cache-Control":"public, max-age=2592000, immutable","X-Content-Type-Options":"nosniff"}});
 }catch{return NextResponse.json({error:"Symbolbild konnte nicht geladen werden."},{status:502})}
}
