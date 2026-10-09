import test from "node:test";
import assert from "node:assert/strict";
import {costSummary,isCostPlan,isSavingRow} from "../src/domain/cost-plan.ts";
import {initialCostPlan} from "../src/lib/cost-plan-seed.ts";
test("Excel controls reconcile and refunds remain separate",()=>{
 const result=costSummary(initialCostPlan,"2026-09");
 assert.equal(result.fixed,1637.47);assert.equal(result.available,689.73);assert.equal(result.expenses,530.17);assert.equal(result.remaining,159.56);assert.equal(result.refunds,286.65);assert.equal(result.closingExpenses,1639.73);assert.equal(result.closingRemaining,824.08);assert.equal(result.afterAdjustments,74.08);
});
test("months are independent and new rows update calculations",()=>{
 const plan=structuredClone(initialCostPlan);plan.expenses.push({id:"new",name:"Test",amount:100,refund:50,note:"",month:"2026-10"});
 assert.equal(costSummary(plan,"2026-10").expenses,100);assert.equal(costSummary(plan,"2026-09").expenses,530.17);
 plan.fixed[0].amount+=10;assert.equal(costSummary(plan,"2026-10").remaining,579.73);
});
test("reject malformed and duplicate rows while allowing zero",()=>{
 assert.equal(isCostPlan(initialCostPlan),true);const plan=structuredClone(initialCostPlan);plan.expenses[0].amount=0;assert.equal(isCostPlan(plan),true);plan.expenses[0].amount=-1;assert.equal(isCostPlan(plan),false);plan.expenses[0].amount=1;plan.fixed.push({...plan.fixed[0]});assert.equal(isCostPlan(plan),false);assert.equal(isCostPlan(null),false);
});

test("source refund formulas respond to edited amounts",()=>{const plan=structuredClone(initialCostPlan);plan.expenses[0].amount=40;plan.expenses[2].amount=10;assert.equal(costSummary(plan,"2026-09").refunds,294.51);});
test("savings are separated from spending and can be excluded without changing stored rows",()=>{
 const plan=structuredClone(initialCostPlan);const withSavings=costSummary(plan,"2026-09"),without=costSummary(plan,"2026-09",false);
 assert.equal(withSavings.savings,425);assert.equal(withSavings.totalOut,2167.64);assert.equal(withSavings.costsWithoutSavings,1742.64);assert.equal(without.remaining,584.56);assert.equal(withSavings.remaining,159.56);
 assert.equal(isSavingRow(plan.expenses.find(row=>row.name==="Spar")!),false);plan.fixed[4].isSaving=false;assert.equal(costSummary(plan,"2026-09").savings,325);assert.equal(isCostPlan(plan),true);
});
test("deleting all displayed month rows produces zero totals immediately",()=>{const plan=structuredClone(initialCostPlan);plan.income=[];plan.fixed=[];plan.expenses=[];const result=costSummary(plan,"2026-09");assert.equal(result.remaining,0);assert.equal(result.totalOut,0);assert.equal(result.savings,0);});
