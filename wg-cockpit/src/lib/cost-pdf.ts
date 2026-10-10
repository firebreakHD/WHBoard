import type { CostStatement } from "@/domain/cost-statement";
export async function readCostPdf(file:File,token:string){
 if(file.size>20*1024*1024)throw new Error("Bitte eine PDF-Datei unter 20 MB auswählen.");
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),60000);
 try{
  const response=await fetch("/api/kostenrechnung/import",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/pdf"},body:file,signal:controller.signal});
  if(!(response.headers.get("content-type")||"").includes("application/json"))throw new Error("Das Add-on konnte den Import nicht beantworten. Bitte Add-on-Version und Verbindung prüfen.");
  const result=await response.json();if(!response.ok)throw new Error(result.error||"Die PDF konnte nicht gelesen werden.");return result as CostStatement;
 }catch(error){if(controller.signal.aborted)throw new Error("Der Import dauert zu lange. Bitte Verbindung prüfen und erneut versuchen.");throw error}
 finally{clearTimeout(timer)}
}
