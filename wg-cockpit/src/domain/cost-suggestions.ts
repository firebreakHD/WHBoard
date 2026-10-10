import { costSummary,isSavingRow,sumCosts,roundMoney,type CostPlan } from "./cost-plan.ts";
export const savingsSource="https://www.verbraucherzentrale.de/wissen/geld-versicherungen/sparen-und-anlegen/haushaltsbuch-fuehren-ueberblick-ueber-ihre-finanzen-52179";
export function costSuggestions(plan:CostPlan,month:string,percent=10){
 const fixed=plan.actualMonths?.includes(month)?(plan.monthlyFixed||[]).filter(row=>row.month===month):plan.fixed;
 const spending=[...fixed,...plan.expenses.filter(row=>row.month===month&&row.kind!=="in")].filter(row=>!isSavingRow(row));
 const rules=[
  {title:"Abos und digitale Dienste prüfen",pattern:/netflix|spotify|disney|amazon prime|abo|microsoft|mitglied/i,tip:"Prüfe, welche Dienste du tatsächlich nutzt. Unbenutzte Abos zuerst ansehen."},
  {title:"Essen außer Haus planen",pattern:/mcdonald|restaurant|lieferando|essen mit|pizza|burger|cafe|café/i,tip:"Plane einzelne Mahlzeiten zuhause und vergleiche den Monatsbetrag."},
  {title:"Einkäufe mit Liste bündeln",pattern:/billa|\bspar\b|hofer|lidl|supermarkt|lebensmittel/i,tip:"Vergleiche deinen Einkaufsbetrag über mehrere Monate und plane eine feste Einkaufsliste."},
  {title:"Freizeitbudget festlegen",pattern:/steam|gaming|spiel|temu|h&m/i,tip:"Lege vor dem Kauf ein Monatslimit fest und prüfe spontane Ausgaben gesammelt."},
 ];
 return {summary:costSummary(plan,month),suggestions:rules.map(rule=>{const rows=spending.filter(row=>rule.pattern.test(row.name));const amount=sumCosts(rows);return {...rule,amount,count:rows.length,potential:roundMoney(amount*Math.max(0,Math.min(100,percent))/100)}}).filter(rule=>rule.amount>0).sort((a,b)=>b.amount-a.amount),largest:[...spending].sort((a,b)=>b.amount-a.amount).slice(0,3)};
}
