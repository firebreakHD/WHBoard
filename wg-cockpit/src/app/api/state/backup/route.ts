import {NextResponse} from "next/server";
import {restoreHouseholdState} from "@/lib/server-state";

export const dynamic="force-dynamic";
export const runtime="nodejs";

const allowed=new Set(["bookings","debtEvents","fixedCosts","fixedIncomes","shoppingItems","shoppingCatalog","shoppingFavorites","shoppingDone","shoppingCards","shoppingStartRun","bookingTemplates","accountBalance","preferences"]);

export async function POST(request:Request){
 let body:unknown;
 try{body=await request.json()}catch{return NextResponse.json({error:"Die Sicherungsdatei ist keine gültige JSON-Datei."},{status:400})}
 if(!body||typeof body!=="object")return NextResponse.json({error:"Ungültige Sicherungsdatei."},{status:400});
 const backup=body as {format?:unknown;version?:unknown;state?:unknown};
 if(backup.format!=="wg-cockpit-backup"||backup.version!==1||!backup.state||typeof backup.state!=="object"||Array.isArray(backup.state))return NextResponse.json({error:"Das ist keine unterstützte WG-Cockpit-Sicherung."},{status:400});
 const state=backup.state as Record<string,unknown>;
 if(Object.keys(state).some(key=>!allowed.has(key)))return NextResponse.json({error:"Die Sicherung enthält unbekannte Datensätze."},{status:400});
 try{await restoreHouseholdState(state);return NextResponse.json({ok:true})}catch{return NextResponse.json({error:"Die Sicherung konnte nicht gespeichert werden."},{status:500})}
}
