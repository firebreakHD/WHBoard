export type CostRow = { id: string; name: string; amount: number; refund: number; note: string; month: string; refundMode?: "manual" | "half" | "full"; date?:string; sourceFingerprint?:string; sourceFile?:string; isSaving?:boolean; kind?:"in"|"out" };
export type CostCheck={opening:number;income:number;expenses:number};
export type RegularVersion={fromMonth:string;income:CostRow[];fixed:CostRow[]};
export type CostPlan = { income: CostRow[]; fixed: CostRow[]; expenses: CostRow[]; closing: CostRow[]; adjustments: CostRow[]; closingBalance: number; monthlyIncome?:CostRow[]; monthlyFixed?:CostRow[]; actualMonths?:string[]; checks?:Record<string,CostCheck>; regularVersions?:RegularVersion[] };
export function currentCostMonth(){const parts=new Intl.DateTimeFormat("en",{year:"numeric",month:"2-digit",timeZone:"Europe/Vienna"}).formatToParts(new Date());return `${parts.find(part=>part.type==="year")!.value}-${parts.find(part=>part.type==="month")!.value}`}
export function nextCostMonth(month:string){const [year,value]=month.split("-").map(Number);return value===12?`${year+1}-01`:`${year}-${String(value+1).padStart(2,"0")}`}
export function regularRowsForMonth(plan:CostPlan,month:string){
 const version=[...(plan.regularVersions||[])].filter(item=>item.fromMonth<=month).sort((a,b)=>a.fromMonth.localeCompare(b.fromMonth)).at(-1);
 if((!version||version.fromMonth==="0000-01")&&plan.actualMonths?.includes(month))return {income:(plan.monthlyIncome||[]).filter(row=>row.month===month),fixed:(plan.monthlyFixed||[]).filter(row=>row.month===month)};
 return version||{income:plan.income,fixed:plan.fixed};
}
export function updateCostRegulars(plan:CostPlan,group:"income"|"fixed",rows:CostRow[],applyCurrent=false,today=currentCostMonth()):CostPlan{
 const next=structuredClone(plan),fromMonth=applyCurrent?today:nextCostMonth(today);
 next.regularVersions??=[{fromMonth:"0000-01",income:structuredClone(plan.income),fixed:structuredClone(plan.fixed)}];
 const effective=regularRowsForMonth(next,fromMonth);
 if(!next.regularVersions.some(version=>version.fromMonth===fromMonth))next.regularVersions.push({fromMonth,income:structuredClone(effective.income),fixed:structuredClone(effective.fixed)});
 next.regularVersions=next.regularVersions.map(version=>version.fromMonth>=fromMonth?{...version,[group]:structuredClone(rows)}:version).sort((a,b)=>a.fromMonth.localeCompare(b.fromMonth));
 next[group]=structuredClone(rows);return next;
}
export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export const newCostId = () => globalThis.crypto?.randomUUID?.() || `cost-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
export const sumCosts = (rows: CostRow[]) => roundMoney(rows.reduce((sum, row) => sum + row.amount, 0));
export const refundFor = (row: CostRow) => row.refundMode === "half" ? roundMoney(row.amount / 2) : row.refundMode === "full" ? row.amount : row.refund;
export const sumRefunds = (rows: CostRow[]) => roundMoney(rows.reduce((sum,row)=>sum+refundFor(row),0));
export const isSavingRow = (row:CostRow) => row.isSaving ?? /\b(sparen|sparbuch|sparrate|bauspar\w*|anspar\w*|depot)\b/i.test(row.name+" "+(row.sourceFingerprint?row.note:""));
export function costSummary(plan: CostPlan, month: string, includeSavings=true) {
  const regular=regularRowsForMonth(plan,month),fixedIncome=sumCosts(regular.income),additionalIncome=sumCosts(plan.expenses.filter(row=>row.month===month&&row.kind==="in"));
  const income = fixedIncome+additionalIncome, fixed = sumCosts(regular.fixed), rows = plan.expenses.filter(row => row.month === month&&row.kind!=="in");
  const expenses = sumCosts(rows), refunds = sumRefunds(rows);
  const fixedRows=regular.fixed;
  const fixedSavings=sumCosts(fixedRows.filter(isSavingRow)),expenseSavings=sumCosts(rows.filter(isSavingRow));
  const savings=roundMoney(fixedSavings+expenseSavings);
  const displayedFixed=roundMoney(fixed-(includeSavings?0:fixedSavings)),displayedExpenses=roundMoney(expenses-(includeSavings?0:expenseSavings));
  const totalOut=roundMoney(fixed+expenses),costsWithoutSavings=roundMoney(totalOut-savings);
  return { income,fixedIncome,additionalIncome, fixed, available: roundMoney(income - fixed), expenses, refunds, savings,fixedSavings,expenseSavings,displayedFixed,displayedExpenses,displayedOut:roundMoney(displayedFixed+displayedExpenses),totalOut,costsWithoutSavings, remaining: roundMoney(income - (includeSavings?totalOut:costsWithoutSavings)), closingExpenses: sumCosts(plan.closing), closingRemaining: roundMoney(plan.closingBalance - sumCosts(plan.closing)), afterAdjustments: roundMoney(plan.closingBalance - sumCosts(plan.closing) - sumCosts(plan.adjustments)) };
}
export function isCostPlan(value: unknown): value is CostPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as CostPlan;
  if (!Number.isFinite(plan.closingBalance) || Math.abs(plan.closingBalance) > 1e9) return false;
  if(plan.regularVersions!==undefined){
   if(!Array.isArray(plan.regularVersions)||plan.regularVersions.length>1200)return false;
   const months=new Set<string>();
   for(const version of plan.regularVersions){if(!version||!/^\d{4}-(0[1-9]|1[0-2])$/.test(version.fromMonth)||months.has(version.fromMonth)||!isCostPlan({income:version.income,fixed:version.fixed,expenses:[],closing:[],adjustments:[],closingBalance:0}))return false;months.add(version.fromMonth)}
  }
  if(plan.checks!==undefined&&(!plan.checks||typeof plan.checks!=="object"||Array.isArray(plan.checks)||Object.keys(plan.checks).length>1200||Object.entries(plan.checks).some(([month,check])=>!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!check||![check.opening,check.income,check.expenses].every(value=>Number.isFinite(value)&&Math.abs(value)<=1e9)||check.income<0||check.expenses<0)))return false;
  if(plan.actualMonths!==undefined&&(!Array.isArray(plan.actualMonths)||plan.actualMonths.length>1200||plan.actualMonths.some(month=>typeof month!=="string"||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))))return false;
  return (["income","fixed","expenses","closing","adjustments","monthlyFixed","monthlyIncome"] as const).every(key => {
    const rows = plan[key];
    if(rows===undefined&&(key==="monthlyFixed"||key==="monthlyIncome"))return true;
    if (!Array.isArray(rows) || rows.length > 10000) return false;
    const ids = new Set<string>();
    return rows.every(row => {
      if (!row || typeof row !== "object" || typeof row.id !== "string" || !row.id || ids.has(row.id)) return false;
      ids.add(row.id);
      return (row.kind===undefined||["in","out"].includes(row.kind)) && (row.isSaving===undefined||typeof row.isSaving==="boolean") && (row.date===undefined||(typeof row.date==="string"&&/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(row.date))) && (row.sourceFingerprint===undefined||(typeof row.sourceFingerprint==="string"&&row.sourceFingerprint.length<=4000)) && (row.sourceFile===undefined||(typeof row.sourceFile==="string"&&row.sourceFile.length<=300)) && (row.refundMode === undefined || ["manual","half","full"].includes(row.refundMode)) && typeof row.name === "string" && row.name.length <= 300 && typeof row.note === "string" && row.note.length <= 2000 && typeof row.month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(row.month) && Number.isFinite(row.amount) && row.amount >= 0 && row.amount <= 1e9 && Number.isFinite(row.refund) && row.refund >= 0 && row.refund <= 1e9;
    });
  });
}
