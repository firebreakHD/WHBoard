import {NextResponse} from "next/server";
import {importHouseholdBookings} from "@/lib/server-state";

export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function POST(request:Request){
 let payload:unknown;try{payload=await request.json()}catch{return NextResponse.json({error:"Ungültige Importdaten."},{status:400})}
 if(!payload||typeof payload!=="object"||!Array.isArray((payload as {entries?:unknown}).entries))return NextResponse.json({error:"Importdaten fehlen."},{status:400});
 const values=(payload as {entries:unknown[]}).entries;if(values.length>500)return NextResponse.json({error:"Pro Import sind höchstens 500 Buchungen möglich."},{status:400});
 const entries=[] as {id:number;kind:"in"|"out";title:string;amount:number;recipient:string;method:string;date:string;detail?:string;importFingerprint:string}[];
 for(const item of values){if(!item||typeof item!=="object")return NextResponse.json({error:"Eine Buchung ist ungültig."},{status:400});const row=item as Record<string,unknown>;const amount=Number(String(row.amount??"").replace(",","."));const date=typeof row.date==="string"?row.date:"";if((row.kind!=="in"&&row.kind!=="out")||typeof row.title!=="string"||!row.title.trim()||!Number.isFinite(amount)||amount<=0||amount>10000000||typeof row.recipient!=="string"||!row.recipient.trim()||!/^\d{2}\.\d{2}\.\d{4}$/.test(date))return NextResponse.json({error:"Bitte alle markierten Buchungen mit Zweck, Betrag, Datum und Gegenpartei vervollständigen."},{status:400});const [day,month,year]=date.split(".").map(Number);const parsed=new Date(year,month-1,day);if(parsed.getFullYear()!==year||parsed.getMonth()!==month-1||parsed.getDate()!==day)return NextResponse.json({error:"Ein Buchungsdatum ist ungültig."},{status:400});entries.push({id:Date.now()+entries.length,kind:row.kind,title:row.title.trim().slice(0,120),amount:Math.round(amount*100)/100,recipient:row.recipient.trim().slice(0,100),method:typeof row.method==="string"?row.method.slice(0,40):"Sonstiges",date,...(typeof row.detail==="string"&&row.detail.trim()?{detail:row.detail.trim().slice(0,500)}:{}),importFingerprint:""})}
 try{return NextResponse.json({ok:true,...await importHouseholdBookings(entries)})}catch{return NextResponse.json({error:"Import konnte nicht gespeichert werden."},{status:500})}
}
