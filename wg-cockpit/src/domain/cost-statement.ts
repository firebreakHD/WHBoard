import type { CostPlan, CostRow } from "./cost-plan.ts";
import { newCostId } from "./cost-plan.ts";

export type StatementTarget = "expenses" | "monthlyFixed" | "monthlyIncome";
export type StatementRow = {
  id: string; date: string; name: string; amount: number; kind: "in" | "out";
  note: string; fingerprint: string; target: StatementTarget; selected: boolean; duplicate: boolean;
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
export function applyCostStatement(plan: CostPlan, drafts: StatementRow[], filename: string, replaceManual=false): {plan:CostPlan;count:number;skipped:number} {
  const next: CostPlan=structuredClone(plan);
  next.monthlyFixed??=[];next.monthlyIncome??=[];next.actualMonths??=[];
  const known=new Set([...next.expenses,...next.monthlyFixed,...next.monthlyIncome].map(row=>row.sourceFingerprint).filter(Boolean));
  const months=new Set(drafts.filter(row=>row.selected&&!known.has(row.fingerprint)).map(row=>row.date.slice(0,7)));
  if(replaceManual)next.expenses=next.expenses.filter(row=>row.sourceFingerprint||!months.has(row.month));
  let count=0,skipped=0;
  for(const draft of drafts){
    if(!draft.selected)continue;
    if(known.has(draft.fingerprint)){skipped++;continue;}
    if(!/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(draft.date)||!draft.name.trim()||!Number.isFinite(draft.amount)||draft.amount<0||draft.amount>1e9||!(["expenses","monthlyFixed","monthlyIncome"] as string[]).includes(draft.target))throw new Error("Bitte Datum, Bezeichnung und Betrag aller ausgewählten Buchungen prüfen.");
    if((draft.kind==="in")!==(draft.target==="monthlyIncome"))throw new Error("Einnahmen und Ausgaben müssen zur gewählten Zuordnung passen.");
    const month=draft.date.slice(0,7);
    const row:CostRow={id:"statement-"+newCostId(),name:draft.name.slice(0,300),amount:draft.amount,refund:0,note:draft.note.slice(0,2000),month,date:draft.date,sourceFingerprint:draft.fingerprint,sourceFile:filename.slice(0,300)};
    next[draft.target]!.push(row);known.add(draft.fingerprint);if(!next.actualMonths.includes(month))next.actualMonths.push(month);count++;
  }
  return {plan:next,count,skipped};
}
