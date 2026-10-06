import {NextResponse} from "next/server";
import {readReceipt} from "@/lib/receipt-storage";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const receipt=await readReceipt(id);if(!receipt)return NextResponse.json({error:"Beleg nicht gefunden."},{status:404});return new NextResponse(receipt.data,{headers:{"Content-Type":receipt.type,"Content-Disposition":"inline","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}})}catch{return NextResponse.json({error:"Beleg konnte nicht geöffnet werden."},{status:500})}}
