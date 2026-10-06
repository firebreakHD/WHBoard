"use client";

import {useRef,useState} from "react";
import {Database,Download,FileUp} from "lucide-react";

type Backup={format:"wg-cockpit-backup";version:1;createdAt:string;state:Record<string,unknown>};

export function DataBackup(){
 const input=useRef<HTMLInputElement>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");

 async function exportBackup(){
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/state",{cache:"no-store"});
   if(!response.ok)throw new Error("Die aktuellen Board-Daten konnten nicht geladen werden.");
   const backup:Backup={format:"wg-cockpit-backup",version:1,createdAt:new Date().toISOString(),state:await response.json() as Record<string,unknown>};
   const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
   const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`wg-cockpit-backup-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(url);setMessage("Backup exportiert.");
  }catch(error){setMessage(error instanceof Error?error.message:"Backup-Export fehlgeschlagen.")}
  finally{setBusy(false)}
 }

 async function importBackup(file?:File){
  if(!file)return;setBusy(true);setMessage("");
  try{
   const backup=JSON.parse(await file.text()) as Backup;
   if(backup.format!=="wg-cockpit-backup"||backup.version!==1||!backup.state||typeof backup.state!=="object")throw new Error("Die Datei ist kein gültiges WG-Cockpit-Backup.");
   if(!window.confirm("Das Backup jetzt einspielen? Vorhandene Kontodaten, Buchungen, Schulden sowie Einkaufslisten und Einstellungen werden durch den Stand der Sicherung ersetzt."))return;
   const response=await fetch("/api/state/backup",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(backup)});
   const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error||"Backup konnte nicht eingespielt werden.");
   setMessage("Backup eingespielt. Die Seite wird neu geladen.");window.setTimeout(()=>window.location.reload(),700);
  }catch(error){setMessage(error instanceof Error?error.message:"Backup-Import fehlgeschlagen.")}
  finally{setBusy(false);if(input.current)input.current.value=""}
 }

 return <section className="panel desktop-only-backup"><div className="panel-heading"><div className="section-title"><h2>Daten-Backup</h2><p>Vollständige Sicherung von Haushaltskonto, Schulden, Einkaufsliste und Einstellungen.</p></div><Database size={18}/></div><div className="backup-actions"><button className="button button-secondary" disabled={busy} onClick={()=>void exportBackup()}><Download size={15}/> Backup exportieren</button><button className="button button-primary" disabled={busy} onClick={()=>input.current?.click()}><FileUp size={15}/> Backup einspielen</button><input ref={input} type="file" accept=".json,application/json" hidden onChange={event=>void importBackup(event.currentTarget.files?.[0])}/></div>{message&&<small className="backup-message" role="status">{message}</small>}</section>
}
