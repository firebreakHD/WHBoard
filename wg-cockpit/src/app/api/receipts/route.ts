import {NextResponse} from "next/server";
import {removeReceipt,saveReceipt} from "@/lib/receipt-storage";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:Request){try{const form=await request.formData();const file=form.get("file");if(!(file instanceof File))return NextResponse.json({error:"Kein Bild gefunden."},{status:400});return NextResponse.json(await saveReceipt(file))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Beleg konnte nicht gespeichert werden."},{status:400})}}
export async function DELETE(request:Request){const id=new URL(request.url).searchParams.get("id")||"";try{const removed=await removeReceipt(id);return NextResponse.json({ok:removed})}catch{return NextResponse.json({error:"Beleg konnte nicht gelöscht werden."},{status:500})}}
