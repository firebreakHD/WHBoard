export type MarketAlertNews={id:string;title:string;summary?:string;url?:string;source?:string;date?:string;category:"KI"|"Quantum"|"Krypto"};
export type MarketAlertAsset={name:string;symbol:string;change24h:number};
export type MarketAlertStock={symbol:string;changePercent:number};
export type MarketAlert={category:"KI"|"Quantum"|"Krypto";title:string;detail:string;href:string};

const criticalTerms:Record<MarketAlertNews["category"],RegExp>={
  KI:/\b(data breach|security breach|cyberattack|ransomware|major outage|service outage|safety incident|regulatory ban|antitrust|lawsuit|class action|重大|Datenleck|Sicherheitslücke|Cyberangriff|Ermittlungen|Klage|Verbot|Ausfall|Sicherheitsvorfall)\b/i,
  Quantum:/\b(bankrupt|bankruptcy|insolvency|going concern|trading halted|delisting|cuts guidance|guidance cut|misses estimates|revenue collapse|cash crisis|layoffs|chapter 11|Insolvenz|zahlungsunfähig|Kursaussetzung|Delisting|Prognose gesenkt|Entlassungen|Kapitalnot)\b/i,
  Krypto:/\b(hack(ed)?|exploit|bridge attack|wallet drain|insolvency|bankrupt|withdrawals suspended|trading halted|depeg|stablecoin collapse|exchange collapse|breach|gehackt|Hackerangriff|Exploit|Insolvenz|Auszahlungen gestoppt|Kursaussetzung|Entkopplung|Kollaps)\b/i,
};
const withinDays=(date:string|undefined,days:number)=>!date||!Number.isFinite(Date.parse(date))||Date.now()-Date.parse(date)<=days*86_400_000;

export function getCriticalMarketAlerts(news:MarketAlertNews[],assets:MarketAlertAsset[]=[],stocks:MarketAlertStock[]=[]):MarketAlert[]{
  const alerts:MarketAlert[]=[];
  for(const item of news){
    if(!withinDays(item.date,7)||!criticalTerms[item.category].test(`${item.title} ${item.summary||""}`))continue;
    alerts.push({category:item.category,title:`Kritische ${item.category}-Meldung`,detail:item.title,href:`/berichte?tab=${encodeURIComponent(item.category)}`});
  }
  for(const asset of assets){
    if(!Number.isFinite(asset.change24h)||asset.change24h>-10)continue;
    alerts.push({category:"Krypto",title:`Starker Kursrückgang · ${asset.symbol}`,detail:`${asset.name} ${asset.change24h.toLocaleString("de-AT",{maximumFractionDigits:1})} % in 24 Stunden`,href:"/berichte?tab=Krypto"});
  }
  for(const stock of stocks){
    if(!Number.isFinite(stock.changePercent)||stock.changePercent>-10)continue;
    alerts.push({category:"Quantum",title:`Starker Kursrückgang · ${stock.symbol}`,detail:`${stock.symbol} ${stock.changePercent.toLocaleString("de-AT",{maximumFractionDigits:1})} % in 24 Stunden`,href:"/berichte?tab=Quantum"});
  }
  const seen=new Set<string>();
  return alerts.filter(alert=>{const key=`${alert.category}:${alert.detail}`;if(seen.has(key))return false;seen.add(key);return true}).slice(0,8);
}
