import { NextResponse } from "next/server";
import { costPlanAuthorized } from "@/lib/cost-plan-auth";
import { readCostPlan, saveCostPlan } from "@/lib/cost-plan-store";
import { isCostPlan } from "@/domain/cost-plan";
export const dynamic="force-dynamic";export const runtime="nodejs";
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(request:Request){
 if(!costPlanAuthorized(request))return json({error:"Bitte mit PIN entsperren."},401);
 try{return json(await readCostPlan())}catch{return json({error:"Kostenrechnung konnte nicht geladen werden."},500)}
}
export async function PUT(request:Request){
 if(!costPlanAuthorized(request))return json({error:"Bitte mit PIN entsperren."},401);
 let body:unknown;try{body=await request.json()}catch{return json({error:"Ungültige Eingabe."},400)}
 if(!body||typeof body!=="object"||!("plan" in body)||!("revision" in body)||typeof body.revision!=="string"||!isCostPlan(body.plan))return json({error:"Bitte gültige Namen und positive Beträge eingeben."},400);
 try{const result=await saveCostPlan(body.plan,body.revision);return result?json(result):json({error:"Die Daten wurden auf einem anderen Gerät geändert. Bitte deine Änderungen sichern und den aktuellen Stand neu laden."},409)}catch{return json({error:"Speichern fehlgeschlagen. Deine Änderungen bleiben in der Ansicht erhalten."},500)}
}
