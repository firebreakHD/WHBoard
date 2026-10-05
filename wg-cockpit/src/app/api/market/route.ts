import {NextResponse} from "next/server";

export const dynamic="force-dynamic";
export const runtime="nodejs";
type News={id:string;title:string;summary:string;url:string;source:string;date:string;category:"KI"|"Quantum"|"Krypto"};
type Asset={id:string;name:string;symbol:string;price:number;change24h:number;change7d:number;marketCap:number};
type StockQuote={symbol:"IONQ"|"QBTS"|"RGTI";price:number;currency:string;changePercent:number;updatedAt:string};
type SourceStatus={name:string;status:"online"|"unavailable";detail:string};
type Payload={news:News[];assets:Asset[];stocks:StockQuote[];fxRate:number|null;updatedAt:string;sources:string[];sourceStatus:SourceStatus[];warnings:string[]};
let cache:{at:number;value:Payload}|null=null;
const decode=(value:string)=>value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
async function fetchText(url:string,timeout=6500){const response=await fetch(url,{cache:"no-store",headers:{Accept:"application/rss+xml, application/xml, text/xml, application/json","User-Agent":"Mozilla/5.0 (compatible; WGCockpit/1.0)"},signal:AbortSignal.timeout(timeout)});if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.text()}
async function fetchStockQuote(symbol:StockQuote["symbol"]):Promise<StockQuote>{const payload=JSON.parse(await fetchText(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`,5000)) as {chart?:{error?:{description?:string}|null;result?:{meta?:{regularMarketPrice?:number;currency?:string;regularMarketTime?:number;chartPreviousClose?:number;regularMarketChangePercent?:number}}[]|null}};const meta=payload.chart?.result?.[0]?.meta;if(payload.chart?.error||!meta||!Number.isFinite(meta.regularMarketPrice))throw new Error(payload.chart?.error?.description||"Kein Kurs verfügbar");const changePercent=Number.isFinite(meta.regularMarketChangePercent)?meta.regularMarketChangePercent!:meta.chartPreviousClose?((meta.regularMarketPrice!/meta.chartPreviousClose)-1)*100:0;return{symbol,price:meta.regularMarketPrice!,currency:meta.currency||"USD",changePercent,updatedAt:meta.regularMarketTime?new Date(meta.regularMarketTime*1000).toISOString():new Date().toISOString()}}
function parseFeed(xml:string,category:News["category"],source:string):News[]{
 const entries=[...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].slice(0,12);
 return entries.map((match,index)=>{const kind=match[1].toLowerCase();const body=match[2];const field=(name:string)=>body.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,"i"))?.[1]||"";const title=decode(field("title"));const linkTag=body.match(/<link\b([^>]*)>([\s\S]*?)<\/link>|<link\b([^>]*)\/>/i);const linkAttr=linkTag?.[1]||linkTag?.[3]||"";const rawLink=kind==="entry"?(linkAttr.match(/href=["']([^"']+)/i)?.[1]||field("link")):field("link");const url=decode(rawLink.trim()).replace(/^<|>$/g,"");const summary=decode(field("description")||field("summary")||field("content")).slice(0,260);const pub=decode(field("pubDate")||field("published")||field("updated"));const parsed=pub?Date.parse(pub):NaN;const date=Number.isFinite(parsed)?new Date(parsed).toISOString():"";return{id:`${category}-${index}-${title}`,title,summary,url,source:decode(field("source"))||source,date,category}}).filter(x=>x.title&&/^https?:\/\//i.test(x.url));
}
async function loadMarket():Promise<Payload>{
 const specs:[string,News["category"],string][]=[
  ["https://openai.com/news/rss.xml","KI","OpenAI News"],
  ["https://blog.google/innovation-and-ai/technology/ai/rss/","KI","Google AI"],
  ["https://news.google.com/rss/search?q=quantum+computing&hl=de&gl=AT&ceid=AT:de","Quantum","Google News · Quantum"],
  ["https://news.google.com/rss/search?q=IONQ+IonQ+stock&hl=en-US&gl=US&ceid=US:en","Quantum","Google News · IonQ"],
  ["https://news.google.com/rss/search?q=QBTS+%22D-Wave%22+Quantum&hl=en-US&gl=US&ceid=US:en","Quantum","Google News · D-Wave"],
  ["https://news.google.com/rss/search?q=RGTI+Rigetti+Quantum&hl=en-US&gl=US&ceid=US:en","Quantum","Google News · Rigetti"],
  ["https://news.google.com/rss/search?q=bitcoin+OR+ethereum+OR+cryptocurrency&hl=de&gl=AT&ceid=AT:de","Krypto","Google News · Krypto"],
 ];
 const [feedResults,cryptoResult,fxResult,stockResults]=await Promise.all([
  Promise.allSettled(specs.map(async([url,category,source])=>parseFeed(await fetchText(url),category,source))),
  fetchText("https://api.coinlore.net/api/tickers/?start=0&limit=100",10000).then(JSON.parse).then(value=>{if(!Array.isArray(value?.data))throw new Error("Invalid CoinLore response");return{status:"fulfilled" as const,value:value.data as {id:string;name:string;symbol:string;nameid:string;price_usd:string;percent_change_24h:string;percent_change_7d:string;market_cap_usd:string}[]}}).catch(reason=>({status:"rejected" as const,reason})),
  fetchText("https://api.frankfurter.dev/v2/rate/usd/eur").then(JSON.parse).then(value=>({status:"fulfilled" as const,value:value as {rate:number}})).catch(reason=>({status:"rejected" as const,reason})),
  Promise.allSettled((["IONQ","QBTS","RGTI"] as const).map(fetchStockQuote)),
 ]);
 const news=feedResults.flatMap(result=>result.status==="fulfilled"?result.value:[]).sort((a,b)=>Date.parse(b.date||"")-Date.parse(a.date||"")).slice(0,30);
 const sourceStatus:SourceStatus[]=feedResults.map((result,index)=>({name:specs[index][2],status:result.status==="fulfilled"?"online":"unavailable",detail:result.status==="fulfilled"?`${result.value.length} Meldungen abgerufen`:"Quelle gerade nicht erreichbar"}));
 const warnings:string[]=[];if(feedResults.every(x=>x.status==="rejected"))warnings.push("Nachrichtenquellen sind derzeit nicht erreichbar.");
 let assets:Asset[]=[];let fxRate:number|null=null;
 if(fxResult.status==="fulfilled"&&Number.isFinite(fxResult.value.rate))fxRate=fxResult.value.rate;
 if(cryptoResult.status==="fulfilled"&&fxRate){const wanted=new Set(["bitcoin","ethereum","solana","binance-coin","ripple","xrp","cardano","dogecoin","avalanche"]);assets=cryptoResult.value.filter(c=>wanted.has(c.nameid)).map(c=>({id:c.id,name:c.name,symbol:c.symbol,price:Number(c.price_usd)*fxRate!,change24h:Number(c.percent_change_24h)||0,change7d:Number(c.percent_change_7d)||0,marketCap:Number(c.market_cap_usd)*fxRate!})).filter(c=>Number.isFinite(c.price))}
 sourceStatus.push({name:"CoinLore API",status:cryptoResult.status==="fulfilled"?"online":"unavailable",detail:cryptoResult.status==="fulfilled"?`${assets.length} Krypto-Kurse abgefragt`:"Kursquelle gerade nicht erreichbar"});
 sourceStatus.push({name:"Frankfurter API · USD/EUR",status:fxResult.status==="fulfilled"&&fxRate!==null?"online":"unavailable",detail:fxResult.status==="fulfilled"&&fxRate!==null?`Referenzkurs ${fxRate.toFixed(4)}`:"Wechselkurs gerade nicht erreichbar"});
 const stocks=stockResults.flatMap(result=>result.status==="fulfilled"?[result.value]:[]);
 sourceStatus.push({name:"Yahoo Finance · Quantum-Aktien",status:stocks.length?"online":"unavailable",detail:stocks.length?`${stocks.length}/3 Kurse abgefragt`:"Aktienkurse gerade nicht erreichbar"});
 if(!assets.length){const reason=cryptoResult.status==="rejected"?cryptoResult.reason:null;const code=reason instanceof Error?reason.message:"keine passenden Kurse in der Antwort";warnings.push(`Krypto-Kurse gerade nicht erreichbar (${code}).`)}
 return{news,assets,stocks,fxRate,updatedAt:new Date().toISOString(),sources:sourceStatus.map(source=>source.name),sourceStatus,warnings};
}
export async function GET(request:Request){const force=new URL(request.url).searchParams.has("refresh");if(!force&&cache&&Date.now()-cache.at<5*60*1000)return NextResponse.json(cache.value,{headers:{"Cache-Control":"private, max-age=60","X-Market-Cache":"HIT"}});try{const value=await loadMarket();cache={at:Date.now(),value};return NextResponse.json(value,{headers:{"Cache-Control":"private, max-age=60","X-Market-Cache":"MISS"}})}catch{return NextResponse.json({news:[],assets:[],stocks:[],fxRate:null,updatedAt:new Date().toISOString(),sources:[],sourceStatus:[],warnings:["Marktdaten momentan nicht erreichbar."]} satisfies Payload,{status:200})}}
