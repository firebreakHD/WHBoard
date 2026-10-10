import test from "node:test";
import assert from "node:assert/strict";
import { parseCostStatement, applyCostStatement, markCostStatementDuplicates,prepareCostStatement,fixedStatementChanges } from "../src/domain/cost-statement.ts";
import { costSummary, isCostPlan } from "../src/domain/cost-plan.ts";
import { initialCostPlan } from "../src/lib/cost-plan-seed.ts";
const text=`Kontoauszug Nr. 001/2026
IBAN: AT000000000000000000
Alter Kontostand 100,00
Gutschriften 2.000,00
Belastungen 120,00-
Neuer Kontostand 1.980,00
Buchungstext/Booking Text Valuta/Value Beträge/Amounts in EUR
POS 7,00 AT K1 01.09. 12:00 02.09.2026 8,00-
SHOP TEST
SPESEN: 1,00
Internetrechnung 03.09.2026 100,00-
SPARKASSE
AKTIENGESELLSCHAFT
Buchungstext/Booking Text Valuta/Value Beträge/Amounts in EUR
Internet Anbieter
Information über Nicht-Durchführung 04.09.2026 12,00-
Lastschrift über EUR 353,10
wurde per 04.09.2026 nicht durchgeführt
Gehalt 05.09.2026 2.000,00
Firma Test
Neuer Kontostand/New Balance 1.980,00`;
test("PDF rows reconcile; embedded prices, fees and page headers are not extra bookings",()=>{
 const result=parseCostStatement(text);assert.equal(result.rows.length,4);assert.deepEqual(result.warnings,[]);assert.equal(result.rows[0].amount,8);assert.match(result.rows[1].note,/Internet Anbieter/);assert.equal(result.rows[1].target,"monthlyFixed");assert.equal(result.rows[2].target,"expenses");assert.equal(result.rows[3].target,"monthlyIncome");assert.equal(result.closing,1980);
});
test("default import keeps salary and fixed planning; only unmatched monthly transactions are created",()=>{
 const before=structuredClone(initialCostPlan),drafts=parseCostStatement(text).rows;
 const imported=applyCostStatement(before,drafts,"test.pdf",true);assert.equal(imported.count,2);assert.equal(isCostPlan(imported.plan),true);
 const total=costSummary(imported.plan,"2026-09");assert.equal(total.income,2327.2);assert.equal(total.fixed,1637.47);assert.equal(total.expenses,20);assert.equal(total.remaining,669.73);assert.equal(imported.plan.actualMonths,undefined);
 assert.deepEqual(imported.plan.income,before.income);assert.deepEqual(imported.plan.fixed,before.fixed);assert.equal(costSummary(imported.plan,"2026-10").available,689.73);assert.deepEqual(before,initialCostPlan);
});
test("repeated statements are skipped, while genuinely repeated identical transactions survive",()=>{
 const empty={...structuredClone(initialCostPlan),fixed:[],income:[]};
 const parsed=parseCostStatement(text),first=applyCostStatement(empty,parsed.rows,"a.pdf");const marked=markCostStatementDuplicates(parsed.rows,first.plan);assert.ok(marked.every(row=>row.duplicate&&!row.selected));const again=applyCostStatement(first.plan,parsed.rows,"renamed.pdf");assert.equal(again.count,0);assert.equal(again.skipped,4);
 const repeated=parseCostStatement("POS 10,00 01.09.2026 10,00-\nShop\nPOS 10,00 01.09.2026 10,00-\nShop");assert.equal(repeated.rows.length,2);assert.notEqual(repeated.rows[0].fingerprint,repeated.rows[1].fingerprint);
});
test("incomplete, empty and mismatched extracts expose warnings; invalid edits are rejected",()=>{
 assert.ok(parseCostStatement(text.replace("Belastungen 120,00-","Belastungen 999,00-")).warnings.length);
 assert.ok(parseCostStatement("Scan ohne Text").warnings.length);
 const drafts=parseCostStatement(text).rows;drafts[0].amount=NaN;assert.throws(()=>applyCostStatement(initialCostPlan,drafts,"test.pdf"));drafts[0].amount=8;drafts[0].kind="in";drafts[0].target="monthlyFixed";assert.throws(()=>applyCostStatement(initialCostPlan,drafts,"test.pdf"));
});

test("regular matches are skipped by default; unmatched credits remain monthly income",()=>{
 const plan=structuredClone(initialCostPlan);const drafts=parseCostStatement(text+"\nRückerstattung 06.09.2026 25,00").rows;
 const prepared=prepareCostStatement(drafts,plan);assert.equal(prepared.find(row=>row.name==="Gehalt")?.selected,false);assert.equal(prepared.find(row=>row.name==="Internetrechnung")?.selected,false);assert.ok(prepared.filter(row=>row.selected).every(row=>row.target==="expenses"));
 const result=applyCostStatement(plan,prepared,"sample.pdf");assert.deepEqual(result.plan.income,plan.income);assert.deepEqual(result.plan.fixed,plan.fixed);assert.equal(result.plan.monthlyIncome,undefined);assert.equal(result.plan.expenses.find(row=>row.name==="Rückerstattung")?.kind,"in");assert.equal(costSummary(result.plan,"2026-09").income,2352.2);
});
test("explicit fixed synchronization previews adds, edits and removals without changing salary",()=>{
 const plan={...structuredClone(initialCostPlan),fixed:initialCostPlan.fixed.slice(0,4)};
 const drafts=prepareCostStatement(parseCostStatement(text+"\nNetflix 06.09.2026 15,00-").rows,plan,true);
 const changes=fixedStatementChanges(plan,drafts);assert.equal(changes.filter(row=>row.action==="update").length,1);assert.equal(changes.filter(row=>row.action==="add").length,1);assert.equal(changes.filter(row=>row.action==="remove").length,3);
 const result=applyCostStatement(plan,drafts,"sample.pdf",{updateFixed:true});assert.equal(result.plan.fixed.length,2);assert.equal(result.plan.fixed.find(row=>row.name==="Internet")?.amount,100);assert.equal(result.plan.fixed.find(row=>row.name==="Netflix")?.amount,15);assert.deepEqual(result.plan.income,plan.income);assert.ok(result.plan.expenses.every(row=>row.month!=="2026-09"||!["Netflix","Internetrechnung","Gehalt"].includes(row.name)));
});

test("salary matching by unique amount is reviewable and imports can be explicitly overridden",()=>{
 const plan=structuredClone(initialCostPlan);const rows=parseCostStatement("Firma Muster 01.10.2026 2.327,20").rows;const prepared=prepareCostStatement(rows,plan);assert.equal(prepared[0].matchedRegular,"Gehalt");assert.equal(prepared[0].selected,false);prepared[0].selected=true;prepared[0].keepMonthly=true;assert.equal(applyCostStatement(plan,prepared,"sample.pdf").count,1);
});
test("promoting a previously imported expense to fixed cost does not double count it",()=>{
 const plan={...structuredClone(initialCostPlan),income:[],fixed:[],expenses:[]};const rows=parseCostStatement("Netflix 01.09.2026 15,00-").rows;
 const first=applyCostStatement(plan,prepareCostStatement(rows,plan),"a.pdf").plan;
 const result=applyCostStatement(first,prepareCostStatement(rows,first,true),"a.pdf",{updateFixed:true}).plan;
 assert.equal(result.fixed.length,1);assert.equal(result.expenses.length,0);assert.equal(costSummary(result,"2026-09").totalOut,15);
});

test("saving transfers retain their classification after fixed synchronization",()=>{
 const plan={...structuredClone(initialCostPlan),income:[],fixed:[],expenses:[]};const rows=parseCostStatement("Banküberweisung 01.09.2026 100,00-\nBausparvertrag Ansparen").rows;
 const result=applyCostStatement(plan,prepareCostStatement(rows,plan,true),"a.pdf",{updateFixed:true}).plan;
 assert.equal(costSummary(result,"2026-09").savings,100);
});
