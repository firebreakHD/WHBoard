import test from "node:test";
import assert from "node:assert/strict";
import { parseCostStatement, applyCostStatement, markCostStatementDuplicates } from "../src/domain/cost-statement.ts";
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
test("import uses actual month totals without changing shared planning or other months",()=>{
 const before=structuredClone(initialCostPlan),drafts=parseCostStatement(text).rows;
 const imported=applyCostStatement(before,drafts,"test.pdf",true);assert.equal(imported.count,4);assert.equal(isCostPlan(imported.plan),true);
 const total=costSummary(imported.plan,"2026-09");assert.equal(total.income,2000);assert.equal(total.fixed,100);assert.equal(total.expenses,20);assert.equal(total.remaining,1880);
 assert.deepEqual(imported.plan.income,before.income);assert.deepEqual(imported.plan.fixed,before.fixed);assert.equal(costSummary(imported.plan,"2026-10").available,689.73);assert.deepEqual(before,initialCostPlan);
});
test("repeated statements are skipped, while genuinely repeated identical transactions survive",()=>{
 const parsed=parseCostStatement(text),first=applyCostStatement(initialCostPlan,parsed.rows,"a.pdf");const marked=markCostStatementDuplicates(parsed.rows,first.plan);assert.ok(marked.every(row=>row.duplicate&&!row.selected));const again=applyCostStatement(first.plan,parsed.rows,"renamed.pdf");assert.equal(again.count,0);assert.equal(again.skipped,4);
 const repeated=parseCostStatement("POS 10,00 01.09.2026 10,00-\nShop\nPOS 10,00 01.09.2026 10,00-\nShop");assert.equal(repeated.rows.length,2);assert.notEqual(repeated.rows[0].fingerprint,repeated.rows[1].fingerprint);
});
test("incomplete, empty and mismatched extracts expose warnings; invalid edits are rejected",()=>{
 assert.ok(parseCostStatement(text.replace("Belastungen 120,00-","Belastungen 999,00-")).warnings.length);
 assert.ok(parseCostStatement("Scan ohne Text").warnings.length);
 const drafts=parseCostStatement(text).rows;drafts[0].amount=NaN;assert.throws(()=>applyCostStatement(initialCostPlan,drafts,"test.pdf"));drafts[0].amount=8;drafts[0].target="monthlyIncome";assert.throws(()=>applyCostStatement(initialCostPlan,drafts,"test.pdf"));
});
