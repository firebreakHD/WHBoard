import {parseMoneyAmount} from "@/lib/money";
import {productIcons} from "./product-icons";

export type ReceiptLine={id:string;name:string;qty:string;price:number|null;icon:string;confidence:"high"|"check"};
export type ParsedReceipt={store:"Billa"|"Spar"|"Hofer"|"Andere";date:string|null;total:number|null;lines:ReceiptLine[];confidence:number};

const amountPattern=/-?\d{1,3}(?:[.\s]\d{3})*,\d{2}|-?\d+,\d{2}/g;
const excluded=/\b(summe|gesamt|zu zahlen|zahlbetrag|endbetrag|total|subtotal|zwischensumme|r[uü]ckgeld|gegeben|karten?zahlung|barzahlung|visa|mastercard|maestro|zahlung|ust|mwst|mehrwertsteuer|steuer|netto|brutto|kassa|kassabon|kassenbon|filiale|kassen.?nr|bon.?nr|beleg|terminal|autorisation|genehmigung|umsatz|ersparnis|rabatt gesamt|preisvorteil|kundennummer|danke|wiedersehen|pfand retour|steuerbetrag|summe eur)\b/i;
const datePattern=/(?:^|\D)(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\D|$)/;
const knownRules:[RegExp,string,string][]=[
 [/tomat|paradeis/,"Tomaten","🍅"],[/apfel/,"Äpfel","🍎"],[/banan/,"Bananen","🍌"],[/kartoffel|erdaepfel|erdapfel/,"Kartoffeln","🥔"],[/paprik/,"Paprika","🫑"],[/gurk/,"Gurken","🥒"],[/salat|rucola/,"Salat","🥬"],[/zwiebel/,"Zwiebeln","🧅"],[/milch|vollmilch|haferdrink/,"Milch","🥛"],[/joghurt|jogurt/,"Joghurt","🥣"],[/kaese|gouda|emmentaler|mozzarella/,"Käse","🧀"],[/eier|eierkarton/,"Eier","🥚"],[/brot|semmel|weckerl|baguette/,"Brot","🍞"],[/kaffee/,"Kaffee","☕"],[/nudel|pasta|spaghetti/,"Nudeln","🍝"],[/reis/,"Reis","🍚"],[/wasser|mineral/ ,"Wasser","💧"],[/bier/,"Bier","🍺"],[/saft|juice/ ,"Saft","🧃"],[/haehnchen|huhn|hendl|schnitzel/ ,"Fleisch","🍗"],[/fisch|lachs|forelle/ ,"Fisch","🐟"],[/butter/ ,"Butter","🧈"],[/schokolade|schoko/ ,"Schokolade","🍫"],[/chips/ ,"Chips","🍿"],[/toilettenpapier|klopapier|kuechenrolle/ ,"Küchenrolle","🧻"],[/spuelmittel|waschmittel/ ,"Spülmittel","🧴"],[/pfand/ ,"Pfand","♻️"]
];
const normalize=(value:string)=>value.toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ß/g,"ss").replace(/[^a-z0-9]/g,"");
function uuid(){return globalThis.crypto?.randomUUID?.()||`receipt-${Date.now()}-${Math.random().toString(36).slice(2)}`}
function moneyMatches(line:string){return [...line.matchAll(amountPattern)].map(match=>parseMoneyAmount(match[0])).filter(Number.isFinite)}
function detectStore(text:string):ParsedReceipt["store"]{const head=text.split(/\r?\n/).slice(0,18).join(" ").toLocaleLowerCase("de");if(/\bhofer\b/.test(head))return"Hofer";if(/\b(billa|billa plus)\b/.test(head))return"Billa";if(/\b(spar|eurospar|interspar|despar)\b/.test(head))return"Spar";return"Andere"}
function detectDate(lines:string[]){for(const line of lines.slice(0,30)){const match=line.match(datePattern);if(!match)continue;const day=Number(match[1]),month=Number(match[2]);let year=Number(match[3]);if(year<100)year+=2000;const date=new Date(year,month-1,day);if(date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day)return`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`}return null}
function identifyProduct(raw:string){const normalized=normalize(raw);for(const [pattern,name,icon] of knownRules){if(pattern.test(normalized))return{name,icon,confidence:"high" as const}}const local=productIcons.find(item=>normalize(item.name)===normalized)||productIcons.find(item=>normalized.length>4&&(normalized.includes(normalize(item.name))||normalize(item.name).includes(normalized)));return{name:raw.replace(/\s+/g," ").trim().slice(0,80),icon:local?.emoji||"🛒",confidence:"check" as const}}

export function parseReceiptText(text:string):ParsedReceipt{
 const sourceLines=text.split(/\r?\n/).map(line=>line.replace(/[|¦]/g," ").replace(/\s+/g," ").trim()).filter(Boolean);
 const totals=sourceLines.flatMap((line,index)=>/\b(summe|gesamt|zu zahlen|zahlbetrag|endbetrag|total|zwischensumme)\b/i.test(line)?moneyMatches(line).map(value=>({value,index})):[]).filter(item=>item.value>0);
 const receiptTotal=totals.sort((a,b)=>b.index-a.index)[0]?.value??null;
 const rows:ReceiptLine[]=[];
 for(const line of sourceLines){
  if(excluded.test(line))continue;
  const matches=[...line.matchAll(amountPattern)];if(!matches.length)continue;
  const last=matches[matches.length-1];const price=parseMoneyAmount(last[0]);if(price<=0||price>10000)continue;
  let name=line.slice(0,last.index).replace(/[\s*#.:=-]+$/g,"").trim();
  name=name.replace(/^(?:\d+\s*(?:x|st|stk|stk\.)\s*)/i,"").replace(/\b(?:bio|s.?budget|clever|spar natur.?pur|hofer|billa)\b/gi," ").replace(/\s+/g," ").trim();
  if(name.length<2||!/[a-zäöüß]/i.test(name)||excluded.test(name))continue;
  let qty="1 Stück";const quantity=name.match(/\b(\d+(?:[.,]\d+)?)\s*(kg|g|l|stk\.?|st\.?|x)\b/i);
  if(quantity){const unit=quantity[2].toLocaleLowerCase();const normalizedUnit=unit.startsWith("kg")?"kg":unit==="g"?"g":unit==="l"?"l":"Stück";qty=`${quantity[1].replace(".",",")} ${normalizedUnit}`;name=name.replace(quantity[0]," ").replace(/\s+/g," ").trim()}
  const product=identifyProduct(name);
  rows.push({id:uuid(),name:product.name,qty,price,icon:product.icon,confidence:product.confidence});
 }
 const deduplicated:ReceiptLine[]=[];for(const row of rows){const previous=deduplicated.find(item=>normalize(item.name)===normalize(row.name)&&item.price===row.price);if(previous){const amount=Number(previous.qty.match(/[\d,\.]+/)?.[0]?.replace(",",".")||1)+Number(row.qty.match(/[\d,\.]+/)?.[0]?.replace(",",".")||1);previous.qty=`${amount} ${row.qty.replace(/[\d,\.]+\s*/,"")}`}else deduplicated.push(row)}
 const lines=deduplicated.slice(0,150);const confidence=lines.length?Math.round(lines.reduce((sum,line)=>sum+(line.confidence==="high"?0.88:0.55),0)/lines.length*100):0;
 return{store:detectStore(text),date:detectDate(sourceLines),total:receiptTotal,lines,confidence};
}
