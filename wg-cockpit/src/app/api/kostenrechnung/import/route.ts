import { NextResponse } from "next/server";
import { costPlanAuthorized } from "@/lib/cost-plan-auth";
import { readCostPdfOnServer } from "@/lib/cost-pdf-server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request:Request){
  if(!costPlanAuthorized(request))return json({error:"Bitte mit PIN entsperren."},401);
  if(Number(request.headers.get("content-length"))>20*1024*1024)return json({error:"Bitte eine PDF-Datei unter 20 MB auswählen."},413);
  try{return json(await readCostPdfOnServer(new Uint8Array(await request.arrayBuffer())))}
  catch(error){return json({error:error instanceof Error?error.message:"Die PDF konnte nicht gelesen werden."},400)}
}
