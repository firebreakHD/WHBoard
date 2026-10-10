import type { CostPlan, CostRow } from "../../src/domain/cost-plan.ts";
const row = (id: string, name: string, amount: number, refund = 0, note = "", refundMode: CostRow["refundMode"] = "manual"): CostRow => ({id,name,amount,refund,note,refundMode,month:"2026-09"});
// Saved values from Kosten Rechnung_2026.xlsx. The original workbook is never written.
export const initialCostPlan: CostPlan = {
 income: [row("income-1","Gehalt",2327.2)],
 fixed: [row("fixed-1","leasing auto",375.1),row("fixed-2","Miete",395),row("fixed-3","Strom",48),row("fixed-4","Internet",42),row("fixed-5","Sparen Bauspar",100),row("fixed-6","Sparen Sparbuch",180),row("fixed-7","auto versicherung",246.65),row("fixed-8","uniqa versicherung",26.79),row("fixed-9","Lebens Versicherung für 0 stufe",31.2),row("fixed-10","Haushalts Versicherung",14.23),row("fixed-11","Mama Kosten Handy",33.5),row("fixed-12","Sparen Depot",145)],
 expenses: [row("expense-1","Scheibenwasser (Vivien + Ich)",30.24,15.12,"","half"),row("expense-2","Tanken",68.61),row("expense-3","Steam",7.02,7.02,"","full"),row("expense-4","Spar",22.66),row("expense-5","Billa",10.16),row("expense-6","Billa",10.11),row("expense-7","Temu",74.08,74.08,"","full"),row("expense-8","Temu",6.52,6.52,"","full"),row("expense-9","Essen mit Larissa & Vivien",65.2,18.9),row("expense-10","Billa",17.97),row("expense-11","Barhebung",60,60,"","full"),row("expense-12","Barhebung",90,90,"","full"),row("expense-13","H&M",31.48),row("expense-14","Tanken Larissa",15.01,15.01),row("expense-15","Billa",11.42),row("expense-16","Billa",9.69)],
 closing: [147.21,360.61,79.11,80.6,150,280,409,7.02,30,31.2,31.48,33.5].map((amount,index)=>row("closing-"+index,"Posten "+(index+1),amount,0,"In der Excel-Datei ohne Bezeichnung")),
 adjustments: [row("adjustment-1","September Nachzahlung",375),row("adjustment-2","Oktober Zahlung",375)],
 closingBalance:2463.81
};
