import {NextResponse} from "next/server";
import {refreshCockpitRepository} from "@/providers/monitor";

export const dynamic="force-dynamic";
export const runtime="nodejs";

export async function POST(){
 try{
  const result=await refreshCockpitRepository();
  return NextResponse.json({ok:true,...result});
 }catch(error){
  return NextResponse.json({error:error instanceof Error?error.message:"Das Repository konnte nicht aktualisiert werden."},{status:502});
 }
}
