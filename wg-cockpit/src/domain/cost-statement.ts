import type { CostPlan, CostRow } from "./cost-plan.ts";
import { newCostId,regularRowsForMonth,updateCostRegulars,currentCostMonth,nextCostMonth } from "./cost-plan.ts";

export type StatementTarget = "expenses" | "monthlyFixed" | "monthlyIncome";
export type StatementRow = {
  id: string; date: string; name: string; amount: number; kind: "in" | "out";
  note: string; fingerprint: string; target: StatementTarget; selected: boolean; duplicate: boolean; matchedRegular?:string; suggestedFixed?:boolean; keepMonthly?:boolean;
};
export type CostStatement = { rows: StatementRow[]; opening?: number; closing?: number; credits?: number; debits?: number; warnings: string[] };
const money = (value: string) => Number(value.replace(/\./g, "").replace(",", ".").replace(/[-−]/g, ""));
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const header = (line: string) => /^(SPARKASSE|AKTIENGESELLSCHAFT|Domgasse|3100 St|Buchungstext\/|IBAN Datum|AT\d{18}\s|Kontoauszug Nr|Account Statement|Marcel.*Tr[öo]stl$|IBAN:|BIC:|Zuletzt gültiger|last valid|Ausdruck Digitales|Old Balance|Credits$|Debits$|New Balance|Reklamationen|Aktuelle Informationen|Kontostand per|Neuer Kontostand|\*\*\*)/i.test(line);
function readableName(text: string, details: string[]) {
  const full = [text,...details].join(" ");
  if (/nicht.durchf.hr|nicht durchgef.hr/i.test(full)) return "Bankgebühr – nicht durchgeführte Lastschrift";
  if (/BILLA DANKT/i.test(full)) return "Billa";
  if (/\bSPAR\b/i.test(text)) return "Spar";
  if (/STEAM PURCHASE/i.test(full)) return "Steam";
  if (/MICROSOFT/i.test(full)) return "Microsoft";
  if (/MCDONALDS/i.test(full)) return "McDonald's";
  if (/^AUTOMAT\b/i.test(text)) return "Barhebung";
  if (/^WRLINIEN/i.test(text)) return "Wiener Linien";
  if (/^(POS|E-COMM)\b/i.test(text)) return details.find(line=>!/^SPESEN:|^MDID:/.test(line))?.replace(/\s+\d{3,}\s*$/, "").slice(0,300) || text;
  return text;
}
export function parseCostStatement(text: string): CostStatement {
  const lines = text.split(/\r?\n/).map(line=>line.trim().replace(/\s+/g," ")).filter(Boolean);
  const result: CostStatement = {rows:[],warnings:[]};
  const identity = (text.match(/IBAN:\s*(AT\d+)/i)?.[1]||"account") + ":" + (text.match(/Kontoauszug Nr\.\s*([^\s]+)/i)?.[1]||"statement");
  const occurrences = new Map<string,number>();
  let pending: {text:string;date:string;amount:number;kind:"in"|"out";details:string[]}|undefined;
  function finish() {
    if(!pending)return;
    const full=[pending.text,...pending.details].join(" ");
    const key=[identity,pending.date,pending.kind,pending.amount.toFixed(2),normalize(full)].join("|");
    const occurrence=(occurrences.get(key)||0)+1;occurrences.set(key,occurrence);
    const fixed=pending.kind==="out"&&!/nicht.durchf.hr|nicht durchgef.hr/i.test(full)&&/versicher|prämie|praemie|pension|polizze|bauspar|anspar|kraftcom|wasserkraft|strom|internet|miete|wohnung|handy|netflix|sparen|sonst\.zahlungen|leasing/i.test(full);
    result.rows.push({id:"pdf-"+result.rows.length,date:pending.date,name:readableName(pending.text,pending.details),amount:pending.amount,kind:pending.kind,note:full.slice(0,2000),fingerprint:key+"|"+occurrence,target:pending.kind==="in"?"monthlyIncome":fixed?"monthlyFixed":"expenses",selected:true,duplicate:false});
    pending=undefined;
  }
  for(const line of lines) {
    const balance=line.match(/^(Alter Kontostand|Gutschriften|Belastungen|Neuer Kontostand(?:\/New Balance)?)\s+([\d.]+,\d{2}[-−]?)/i);
    if(balance){const key=balance[1].toLowerCase().startsWith("alter")?"opening":balance[1].toLowerCase().startsWith("gutsch")?"credits":balance[1].toLowerCase().startsWith("belast")?"debits":"closing";result[key]=money(balance[2])*(/[−-]$/.test(balance[2])&&["opening","closing"].includes(key)?-1:1);if(key==="closing")finish();continue;}
    if(header(line))continue;
    const match=line.match(/^(.+?)\s+(\d{2})\.(\d{2})\.(\d{4})\s+([\d.]+,\d{2})([-−]?)$/);
    if(match){finish();pending={text:match[1],date:match[4]+"-"+match[3]+"-"+match[2],amount:money(match[5]),kind:match[6]?"out":"in",details:[]};}
    else if(pending)pending.details.push(line);
  }
  finish();
  const sum=(kind:"in"|"out")=>Math.round(result.rows.filter(row=>row.kind===kind).reduce((value,row)=>value+row.amount,0)*100)/100;
  if(!result.rows.length)result.warnings.push("Keine Buchungen erkannt. Bitte einen Sparkassen-PDF-Kontoauszug mit auswählbarem Text verwenden.");
  if(result.credits===undefined||result.debits===undefined)result.warnings.push("Die Kontrollsummen des Auszugs fehlen. Bitte die erkannten Buchungen mit dem PDF vergleichen.");
  if(result.credits!==undefined&&Math.abs(sum("in")-result.credits)>.01)result.warnings.push("Die erkannten Einnahmen stimmen nicht mit der PDF-Kontrollsumme überein.");
  if(result.debits!==undefined&&Math.abs(sum("out")-result.debits)>.01)result.warnings.push("Die erkannten Ausgaben stimmen nicht mit der PDF-Kontrollsumme überein.");
  if(result.opening!==undefined&&result.closing!==undefined&&Math.abs(result.opening+sum("in")-sum("out")-result.closing)>.01)result.warnings.push("Anfangssaldo, Buchungen und Endsaldo lassen sich noch nicht vollständig abstimmen.");
  return result;
}
export function markCostStatementDuplicates(rows: StatementRow[], plan: CostPlan) {
  const known=new Set([...plan.expenses,...(plan.monthlyFixed||[]),...(plan.monthlyIncome||[])].map(row=>row.sourceFingerprint).filter(Boolean));
  return rows.map(row=>({...row,duplicate:known.has(row.fingerprint),selected:!known.has(row.fingerprint)}));
}
export function matchingRegular(row:StatementRow,plan:CostPlan){
 const text=normalize(row.name+" "+row.note);
 const regularRows=regularRowsForMonth(plan,row.date.slice(0,7));
 const candidates=row.kind==="in"?regularRows.income:regularRows.fixed;
 const named=candidates.find(regular=>{
  const name=normalize(regular.name);if(name.length<4)return false;
  if(text.includes(name))return true;
  const tokens=name.split(/[^a-z0-9]+/).filter(token=>token.length>=4&&!/^(kosten|versicherung|sparen|stufe|leben)$/.test(token));
  if(tokens.length&&tokens.every(token=>text.includes(token)))return true;
  return name==="strom"&&/wasserkraft|stromrechnung/.test(text);
 });
 if(named)return named;
 const amountMatches=candidates.filter(regular=>Math.abs(regular.amount-row.amount)<.005);
 return (row.kind==="in"||row.suggestedFixed||row.target==="monthlyFixed")&&amountMatches.length===1?amountMatches[0]:undefined;
}
export function prepareCostStatement(rows:StatementRow[],plan:CostPlan,updateFixed=false){
 return markCostStatementDuplicates(rows,plan).map(row=>{
  const regular=matchingRegular(row,plan);
  const suggestedFixed=row.suggestedFixed??row.target==="monthlyFixed";
  const target:StatementTarget=updateFixed&&row.kind==="out"&&(regular||suggestedFixed)?"monthlyFixed":"expenses";
  return {...row,suggestedFixed,target,matchedRegular:regular?.name,selected:(!row.duplicate||target==="monthlyFixed")&&(!regular||updateFixed&&row.kind==="out")};
 });
}
export type FixedChange={action:"add"|"update"|"remove";name:string;amount:number;previous?:number;id?:string;draft?:StatementRow};
export function fixedStatementChanges(plan:CostPlan,drafts:StatementRow[]):FixedChange[]{
 const candidates=drafts.filter(row=>row.selected&&row.kind==="out"&&row.target==="monthlyFixed");
 const groups=new Map<string,{draft:StatementRow;amount:number;regular?:CostRow}>();
 for(const draft of candidates){const regular=matchingRegular(draft,plan);const key=regular?.id||normalize(draft.name);const previous=groups.get(key);groups.set(key,{draft,regular,amount:(previous?.amount||0)+draft.amount});}
 const changes:FixedChange[]=[];const seen=new Set<string>();
 for(const {draft,regular,amount} of groups.values()){
  if(regular){seen.add(regular.id);if(Math.abs(regular.amount-amount)>.005)changes.push({action:"update",id:regular.id,name:regular.name,amount,previous:regular.amount,draft})}
  else changes.push({action:"add",name:draft.name,amount,draft});
 }
 for(const regular of plan.fixed)if(!seen.has(regular.id))changes.push({action:"remove",id:regular.id,name:regular.name,amount:0,previous:regular.amount});
 return changes;
}
export function applyCostStatement(plan:CostPlan,drafts:StatementRow[],filename:string,options:{replaceManual?:boolean;updateFixed?:boolean;applyCurrent?:boolean;currentMonth?:string}|boolean={}):{plan:CostPlan;count:number;skipped:number}{
 const settings=typeof options==="boolean"?{replaceManual:options}:options;
 let next:CostPlan=structuredClone(plan);
 const known=new Set([...next.expenses,...(next.monthlyFixed||[]),...(next.monthlyIncome||[])].map(row=>row.sourceFingerprint).filter(Boolean));
 const selected=drafts.filter(row=>row.selected);
 for(const row of selected){
  if(!/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(row.date)||!row.name.trim()||!Number.isFinite(row.amount)||row.amount<0||row.amount>1e9)throw new Error("Bitte Datum, Bezeichnung und Betrag aller ausgewählten Buchungen prüfen.");
  if(row.kind==="in"&&row.target==="monthlyFixed")throw new Error("Einnahmen können keine Fixkosten sein.");
 }
 if(settings.updateFixed&&new Set(selected.map(row=>row.date.slice(0,7))).size>1)throw new Error("Fixkosten bitte mit einem Auszug für einen einzelnen Monat aktualisieren.");
 const months=new Set(selected.filter(row=>!known.has(row.fingerprint)).map(row=>row.date.slice(0,7)));
 if(settings.replaceManual)next.expenses=next.expenses.filter(row=>row.sourceFingerprint||!months.has(row.month));
 if(settings.updateFixed){
  const fromMonth=settings.applyCurrent?(settings.currentMonth||currentCostMonth()):nextCostMonth(settings.currentMonth||currentCostMonth());
  const fixedFingerprints=new Set(selected.filter(row=>row.target==="monthlyFixed"&&row.date.slice(0,7)>=fromMonth).map(row=>row.fingerprint));
  next.expenses=next.expenses.filter(row=>!row.sourceFingerprint||!fixedFingerprints.has(row.sourceFingerprint));
  for(const change of fixedStatementChanges(plan,drafts)){
   if(change.action==="remove")next.fixed=next.fixed.filter(row=>row.id!==change.id);
   else if(change.action==="update")next.fixed=next.fixed.map(row=>row.id===change.id?{...row,amount:change.amount}:row);
   else next.fixed.push({id:newCostId(),name:change.name,amount:change.amount,refund:0,note:change.draft?.note||"",month:change.draft!.date.slice(0,7),sourceFingerprint:change.draft?.fingerprint,sourceFile:filename.slice(0,300)});
  }
  const fixed=next.fixed;next=updateCostRegulars({...next,fixed:plan.fixed},"fixed",fixed,settings.applyCurrent,settings.currentMonth);
 }
 let count=0,skipped=0;
 for(const draft of selected){
  const regular=matchingRegular(draft,plan);
  if(known.has(draft.fingerprint)||(regular&&!draft.keepMonthly)||settings.updateFixed&&draft.target==="monthlyFixed"){skipped++;continue;}
  next.expenses.push({id:"statement-"+newCostId(),name:draft.name.slice(0,300),amount:draft.amount,refund:0,note:draft.note.slice(0,2000),month:draft.date.slice(0,7),date:draft.date,kind:draft.kind,sourceFingerprint:draft.fingerprint,sourceFile:filename.slice(0,300)});
  known.add(draft.fingerprint);count++;
 }
 return {plan:next,count,skipped};
}
