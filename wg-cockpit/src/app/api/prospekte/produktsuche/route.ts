import {NextResponse} from "next/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

type StorePrice={store:string;price:number};
type ProductResult={id:string;name:string;unit:string;image:string|null;prices:StorePrice[];bestPrice:number;bestStore:string;comparePrice:number|null;compareUnit:string|null};

function decodeHtml(value:string){return value.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&nbsp;|&#160;/g," ").replace(/&#(\d+);/g,(_,code:string)=>String.fromCodePoint(Number(code))).replace(/&#x([\da-f]+);/gi,(_,code:string)=>String.fromCodePoint(parseInt(code,16))).trim()}
function textIn(html:string,pattern:RegExp){const value=pattern.exec(html)?.[1];return value?decodeHtml(value.replace(/<[^>]+>/g," ").replace(/\s+/g," ")):""}
function parsePrice(value:string){const match=value.match(/(\d+[.,]\d{1,2})\s*€/);if(!match)return null;const amount=Number(match[1].replace(",","."));return Number.isFinite(amount)&&amount>0?amount:null}
function readProducts(html:string):ProductResult[]{
 const chunks=html.split(/(?=<div class="product-card\b)/).filter(chunk=>chunk.startsWith('<div class="product-card'));
 return chunks.map((chunk,index)=>{
   const name=textIn(chunk,/class="card-name[^>]*>([\s\S]*?)<\/div>/);
   if(!name)return null;
   const stores=[...chunk.matchAll(/class="store-icon[^>]*title="([^"]+)"/g)].map(match=>{const label=decodeHtml(match[1]);const separator=label.lastIndexOf(":");if(separator<0)return null;const store=label.slice(0,separator).trim();const price=parsePrice(label.slice(separator+1));return price?{store,price}:null}).filter((price):price is StorePrice=>Boolean(price));
   if(!stores.length)return null;
   const best=stores.reduce((lowest,current)=>current.price<lowest.price?current:lowest);
   const image=textIn(chunk,/class="card-img[^>]*src="([^"]+)"/);
   const unit=textIn(chunk,/class="mono[^>]*>([\s\S]*?)<\/span>/);
   const pack=textIn(chunk,/class="truncate[^>]*>([\s\S]*?)<\/span>/);
   const id=`${name.toLocaleLowerCase("de").replace(/[^a-z0-9]+/g,"-")}-${index}`;
   const measure=unit.match(/(\d+(?:[.,]\d+)?)\s*(liter|litre|l|ml|kilogramm|kg|g|gramm)/i);let comparePrice:number|null=null;let compareUnit:string|null=null;
   if(measure){let amount=Number(measure[1].replace(",","."));const unitKey=measure[2].toLocaleLowerCase("de");if(unitKey==="ml"){amount/=1000;compareUnit="l"}else if(unitKey==="g"||unitKey==="gramm"){amount/=1000;compareUnit="kg"}else if(unitKey==="kg"||unitKey==="kilogramm")compareUnit="kg";else compareUnit="l";if(amount>0)comparePrice=best.price/amount}
   return{id,name,unit:[unit,pack].filter(Boolean).join(" · "),image:image?new URL(image,"https://sparkorb.at").toString():null,prices:stores.sort((a,b)=>a.price-b.price),bestPrice:best.price,bestStore:best.store,comparePrice,compareUnit};
 }).filter((product):product is ProductResult=>Boolean(product)).slice(0,80);
}

export async function GET(request:Request){
 const query=new URL(request.url).searchParams.get("q")?.trim().slice(0,100)??"";
 if(query.length<2)return NextResponse.json({products:[],updatedAt:null});
 try{
   const response=await fetch(`https://sparkorb.at/app?q=${encodeURIComponent(query)}`,{headers:{"user-agent":"Mozilla/5.0 WG-Cockpit/1.0","accept":"text/html"},next:{revalidate:3600}});
   if(!response.ok)throw new Error(`Preisvergleich antwortet mit ${response.status}.`);
   const html=await response.text();
   const products=readProducts(html);
   return NextResponse.json({products,updatedAt:html.match(/zuletzt aktualisiert[^<]{0,80}/i)?.[0]??null,source:"Sparkorb"},{headers:{"Cache-Control":"public, max-age=900, stale-while-revalidate=1800"}});
 }catch(error){const message=error instanceof Error?error.message:"Produktpreise konnten nicht geladen werden.";return NextResponse.json({products:[],error:message},{status:502,headers:{"Cache-Control":"no-store"}})}
}
