import { parseCostStatement } from "../domain/cost-statement";
import path from "node:path";
import { pathToFileURL } from "node:url";
export async function readCostPdfOnServer(data: Uint8Array) {
  if(data.length>20*1024*1024)throw new Error("Bitte eine PDF-Datei unter 20 MB auswählen.");
  if(new TextDecoder().decode(data.slice(0,5))!=="%PDF-")throw new Error("Die ausgewählte Datei ist keine PDF.");
  const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc=pathToFileURL(path.join(process.cwd(),"node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")).href;
  const task=pdfjs.getDocument({data,useSystemFonts:true,disableFontFace:true});
  let timer:ReturnType<typeof setTimeout>|undefined;
  const read=async()=>{
    const pdf=await task.promise;
    if(pdf.numPages>100)throw new Error("Bitte einen Kontoauszug mit höchstens 100 Seiten auswählen.");
    const pages:string[]=[];
    for(let number=1;number<=pdf.numPages;number++){
      const page=await pdf.getPage(number),content=await page.getTextContent();
      const lines:{y:number;items:{x:number;text:string}[]}[]=[];
      for(const item of content.items){if(!("str" in item)||!item.str.trim())continue;const y=item.transform[5],x=item.transform[4];let line=lines.find(line=>Math.abs(line.y-y)<2);if(!line){line={y,items:[]};lines.push(line)}line.items.push({x,text:item.str})}
      pages.push(lines.sort((a,b)=>b.y-a.y).map(line=>line.items.sort((a,b)=>a.x-b.x).map(item=>item.text).join(" ")).join("\n"));
      page.cleanup();
    }
    return parseCostStatement(pages.join("\n"));
  };
  try{return await Promise.race([read(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("Das Lesen dauert zu lange. Bitte eine kleinere PDF auswählen.")),45000)})])}
  catch(error){if(error instanceof Error&&error.name==="PasswordException")throw new Error("Diese PDF ist passwortgeschützt. Bitte einen ungeschützten Kontoauszug exportieren.");throw error}
  finally{clearTimeout(timer);void task.destroy().catch(()=>{})}
}
