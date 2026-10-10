import { NextResponse } from "next/server";
import { costPlanAuthorized,unlockCostPlan,lockCostPlan } from "@/lib/cost-plan-auth";
import { resetCostPlan } from "@/domain/cost-reset";
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
export async function DELETE(request:Request){
 if(!costPlanAuthorized(request))return json({error:"Bitte mit PIN entsperren."},401);
 let body;try{body=await request.json()}catch{return json({error:"Ungültige Eingabe."},400)}
 if(!body||!isCostPlan(body.plan)||typeof body.revision!=="string"||!["month","all"].includes(body.scope)||typeof body.month!=="string"||!/^\d{4}-(0[1-9]|1[0-2])$/.test(body.month))return json({error:"Bitte Monat und Löschumfang prüfen."},400);
 const confirmation=unlockCostPlan(body.pin,request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"cost-delete");
 if("error" in confirmation)return json({error:confirmation.error},confirmation.status);
 lockCostPlan(new Request(request.url,{headers:{Authorization:"Bearer "+confirmation.token}}));
 try{const result=await saveCostPlan(resetCostPlan(body.plan,body.scope,body.month),body.revision);return result?json(result):json({error:"Die Daten wurden auf einem anderen Gerät geändert. Bitte neu laden und erneut prüfen."},409)}
 catch{return json({error:"Löschen fehlgeschlagen. Bitte erneut versuchen."},500)}
}
