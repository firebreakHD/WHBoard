import { NextResponse } from "next/server";
import {readHousehold,updateHousehold} from "@/lib/server-state";
export const dynamic="force-dynamic";export const runtime="nodejs";
const allowed=new Set(["bookings","debtEvents","fixedCosts","fixedIncomes","shoppingItems","shoppingCatalog","shoppingFavorites","shoppingDone","accountBalance","preferences"]);
export async function GET(){try{return NextResponse.json(await readHousehold())}catch{return NextResponse.json({error:"Haushaltsdaten können nicht gelesen werden."},{status:500})}}
export async function PUT(request:Request){let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:"Ungültige JSON-Daten."},{status:400})}if(!body||typeof body!=="object"||!("key" in body)||typeof body.key!=="string"||!allowed.has(body.key)||!("value" in body))return NextResponse.json({error:"Unbekannter Datensatz."},{status:400});try{const data=body as {key:string;value:unknown;baseValue?:unknown};const state=await updateHousehold(data.key,data.value,data.baseValue);return NextResponse.json({ok:true,state})}catch{return NextResponse.json({error:"Haushaltsdaten konnten nicht gespeichert werden."},{status:500})}}
