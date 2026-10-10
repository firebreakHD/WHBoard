export type CostRow = { id: string; name: string; amount: number; refund: number; note: string; month: string; refundMode?: "manual" | "half" | "full"; date?:string; sourceFingerprint?:string; sourceFile?:string; isSaving?:boolean; kind?:"in"|"out" };
export type CostPlan = { income: CostRow[]; fixed: CostRow[]; expenses: CostRow[]; closing: CostRow[]; adjustments: CostRow[]; closingBalance: number; monthlyIncome?:CostRow[]; monthlyFixed?:CostRow[]; actualMonths?:string[] };
export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export const newCostId = () => globalThis.crypto?.randomUUID?.() || `cost-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
export const sumCosts = (rows: CostRow[]) => roundMoney(rows.reduce((sum, row) => sum + row.amount, 0));
export const refundFor = (row: CostRow) => row.refundMode === "half" ? roundMoney(row.amount / 2) : row.refundMode === "full" ? row.amount : row.refund;
export const sumRefunds = (rows: CostRow[]) => roundMoney(rows.reduce((sum,row)=>sum+refundFor(row),0));
export const isSavingRow = (row:CostRow) => row.isSaving ?? /\b(sparen|sparbuch|sparrate|bauspar\w*|anspar\w*|depot)\b/i.test(row.name+" "+(row.sourceFingerprint?row.note:""));
export function costSummary(plan: CostPlan, month: string, includeSavings=true) {
  const actual=plan.actualMonths?.includes(month);
  const income = sumCosts(actual?(plan.monthlyIncome||[]).filter(row=>row.month===month):plan.income)+sumCosts(plan.expenses.filter(row=>row.month===month&&row.kind==="in")), fixed = sumCosts(actual?(plan.monthlyFixed||[]).filter(row=>row.month===month):plan.fixed), rows = plan.expenses.filter(row => row.month === month&&row.kind!=="in");
  const expenses = sumCosts(rows), refunds = sumRefunds(rows);
  const fixedRows=actual?(plan.monthlyFixed||[]).filter(row=>row.month===month):plan.fixed;
  const savings=sumCosts([...fixedRows,...rows].filter(isSavingRow));
  const totalOut=roundMoney(fixed+expenses),costsWithoutSavings=roundMoney(totalOut-savings);
  return { income, fixed, available: roundMoney(income - fixed), expenses, refunds, savings,totalOut,costsWithoutSavings, remaining: roundMoney(income - (includeSavings?totalOut:costsWithoutSavings)), closingExpenses: sumCosts(plan.closing), closingRemaining: roundMoney(plan.closingBalance - sumCosts(plan.closing)), afterAdjustments: roundMoney(plan.closingBalance - sumCosts(plan.closing) - sumCosts(plan.adjustments)) };
}
export function isCostPlan(value: unknown): value is CostPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as CostPlan;
  if (!Number.isFinite(plan.closingBalance) || Math.abs(plan.closingBalance) > 1e9) return false;
  if(plan.actualMonths!==undefined&&(!Array.isArray(plan.actualMonths)||plan.actualMonths.length>1200||plan.actualMonths.some(month=>typeof month!=="string"||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))))return false;
  return ["income","fixed","expenses","closing","adjustments","monthlyFixed","monthlyIncome"].every(key => {
    const rows = plan[key as keyof CostPlan];
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
