"use client";
import { useEffect, useRef, useState } from "react";
import { FileUp, X } from "lucide-react";
import type { CostPlan } from "@/domain/cost-plan";
import { applyCostStatement, markCostStatementDuplicates, type CostStatement, type StatementRow } from "@/domain/cost-statement";
import { readCostPdf } from "@/lib/cost-pdf";
const eur=(value:number)=>new Intl.NumberFormat("de-AT",{style:"currency",currency:"EUR"}).format(value);
export function StatementImport({plan,onClose,onImport}:{plan:CostPlan;onClose:()=>void;onImport:(plan:CostPlan,month:string,count:number)=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [statement,setStatement]=useState<CostStatement|null>(null),[rows,setRows]=useState<StatementRow[]>([]),[filename,setFilename]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[replaceManual,setReplaceManual]=useState(true),[acknowledged,setAcknowledged]=useState(false);
 useEffect(()=>{dialog.current?.showModal()},[]);
 async function selectFile(file?:File){
  if(!file)return;setBusy(true);setError("");setFilename(file.name);setStatement(null);setRows([]);setAcknowledged(false);
  try{const parsed=await readCostPdf(file);setStatement(parsed);setRows(markCostStatementDuplicates(parsed.rows,plan))}catch(err){setError(err instanceof Error?err.message:"Die PDF konnte nicht gelesen werden.")}finally{setBusy(false)}
 }
 function patch(id:string,value:Partial<StatementRow>){setRows(current=>current.map(row=>row.id===id?{...row,...value}:row))}
 const selected=rows.filter(row=>row.selected),duplicates=rows.filter(row=>row.duplicate).length;
 const valid=selected.every(row=>row.name.trim()&&Number.isFinite(row.amount)&&row.amount>=0&&row.date);
 const total=(kind:"in"|"out")=>selected.filter(row=>row.kind===kind).reduce((sum,row)=>sum+row.amount,0);
 const months=new Set(selected.map(row=>row.date.slice(0,7)));
 const manualCount=plan.expenses.filter(row=>months.has(row.month)&&!row.sourceFingerprint).length;
 function accept(){try{const result=applyCostStatement(plan,rows,filename,replaceManual);onImport(result.plan,selected[0]?.date.slice(0,7)||"",result.count)}catch(err){setError(err instanceof Error?err.message:"Bitte die ausgewählten Buchungen prüfen.")}}
 return <dialog ref={dialog} className="cost-import-dialog" aria-labelledby="cost-import-title" onCancel={event=>{event.preventDefault();if(!busy)onClose()}}><header><div><small>KONTOAUSZUG</small><h2 id="cost-import-title">PDF importieren</h2></div><button className="cost-delete" aria-label="Import schließen" onClick={onClose} disabled={busy}><X size={18}/></button></header>
  <p className="cost-note">PDF auswählen, Buchungen prüfen und übernehmen. Du kannst Bezeichnungen und Zuordnung anpassen.</p>
  <label className="cost-pdf-file"><FileUp size={22}/><span>{busy?"Kontoauszug wird gelesen …":filename||"Sparkassen-Kontoauszug auswählen"}<small>PDF mit auswählbarem Text · maximal 20 MB</small></span><input aria-label="PDF-Kontoauszug" type="file" accept="application/pdf,.pdf" disabled={busy} onChange={event=>{void selectFile(event.target.files?.[0]);event.target.value=""}}/></label>
  {error&&<p className="cost-error" role="alert">{error}</p>}
  {statement&&<><div className="cost-import-summary"><div><small>Ausgewählte Buchungen</small><b>{selected.length} von {rows.length}</b></div><div><small>Einnahmen</small><b>{eur(total("in"))}</b></div><div><small>Ausgaben</small><b>{eur(total("out"))}</b></div></div>
   <div className="cost-import-controls">{statement.closing!==undefined&&<span>Kontostand laut PDF: <b>{eur(statement.closing)}</b></span>}{duplicates>0&&<span>{duplicates} bereits importiert</span>}<button className="button" onClick={()=>setRows(current=>current.map(row=>({...row,selected:!row.duplicate&&!current.some(item=>item.selected)})))}>{selected.length?"Alle abwählen":"Alle auswählen"}</button></div>
   {statement.warnings.length>0&&<div className="cost-error" role="alert">{statement.warnings.map(warning=><p key={warning}>{warning}</p>)}{rows.length>0&&<label><input type="checkbox" checked={acknowledged} onChange={event=>setAcknowledged(event.target.checked)}/>Ich habe die Buchungen mit dem Auszug geprüft.</label>}</div>}
   <div className="cost-import-list">{rows.map(row=><article key={row.id} className={`cost-import-row ${row.duplicate?"is-duplicate":""}`}><label className="cost-import-check"><input type="checkbox" aria-label={"Übernehmen "+row.name} checked={row.selected} disabled={row.duplicate} onChange={event=>patch(row.id,{selected:event.target.checked})}/><span>{row.duplicate?"Bereits importiert":row.kind==="in"?"Geld rein":"Geld raus"}</span></label><div className="cost-import-fields"><label>Datum<input type="date" value={row.date} onChange={event=>patch(row.id,{date:event.target.value})}/></label><label>Bezeichnung<input value={row.name} maxLength={300} onChange={event=>patch(row.id,{name:event.target.value})}/></label><label>Betrag €<input type="number" inputMode="decimal" min="0" step="0.01" value={row.amount} onChange={event=>patch(row.id,{amount:event.target.value===""?NaN:Number(event.target.value)})}/></label><label>Zuordnung<select value={row.target} onChange={event=>patch(row.id,{target:event.target.value as StatementRow["target"]})}>{row.kind==="in"?<option value="monthlyIncome">Einnahme</option>:<><option value="expenses">Einmalige Ausgabe</option><option value="monthlyFixed">Fixkosten</option></>}</select></label></div><details><summary>Buchungstext anzeigen</summary><p>{row.note}</p></details></article>)}</div>
   {manualCount>0&&<label className="cost-replace"><input type="checkbox" checked={replaceManual} onChange={event=>setReplaceManual(event.target.checked)}/><span>{manualCount} vorhandene Monatsausgaben ohne PDF-Quelle ersetzen<small>Andere Monate und die allgemeinen Fixkosten bleiben erhalten.</small></span></label>}
  </>}
  <footer><button className="button" disabled={busy} onClick={onClose}>Abbrechen</button><button className="button primary" disabled={busy||!selected.length||!valid||Boolean(statement?.warnings.length&&!acknowledged)} onClick={accept}>{selected.length} Buchungen übernehmen</button></footer>
 </dialog>
}
