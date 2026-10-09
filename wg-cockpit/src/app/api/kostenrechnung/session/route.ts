import { NextResponse } from "next/server";
import { unlockCostPlan, lockCostPlan } from "@/lib/cost-plan-auth";
export const runtime="nodejs";
export async function POST(request:Request) {
 let body: {pin?:unknown};try{body=await request.json()}catch{return NextResponse.json({error:"Ungültige Eingabe."},{status:400})}
 const result=unlockCostPlan(body?.pin,request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"local");
 return NextResponse.json(result,{status:"error" in result?result.status:200,headers:{"Cache-Control":"no-store"}});
}
export async function DELETE(request:Request){lockCostPlan(request);return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}})}
