import test from "node:test";
import assert from "node:assert/strict";
import {costSummary,isCostPlan,isSavingRow,roundMoney} from "../src/domain/cost-plan.ts";
import {initialCostPlan} from "./fixtures/cost-plan.ts";
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

test("monthly credits count as income, not spending or savings",()=>{const plan=structuredClone(initialCostPlan);plan.expenses.push({id:"credit",name:"Erstattung",amount:50,refund:0,note:"",month:"2026-09",kind:"in",isSaving:true});const result=costSummary(plan,"2026-09");assert.equal(result.income,2377.2);assert.equal(result.expenses,530.17);assert.equal(result.savings,425);assert.equal(result.remaining,209.56);assert.equal(isCostPlan(plan),true)});

test("savings toggle reconciles fixed and additional expenses separately without changing data",()=>{
 const plan=structuredClone(initialCostPlan);plan.expenses.push({id:"saving-month",name:"Extra Sparrate",amount:75,refund:0,note:"",month:"2026-09",isSaving:true});
 const before=structuredClone(plan),included=costSummary(plan,"2026-09"),excluded=costSummary(plan,"2026-09",false);
 assert.equal(included.displayedFixed,1637.47);assert.equal(excluded.displayedFixed,1212.47);
 assert.equal(included.displayedExpenses,605.17);assert.equal(excluded.displayedExpenses,530.17);
 assert.equal(included.savings,500);assert.equal(excluded.savings,500);
 assert.equal(excluded.displayedOut,1742.64);assert.equal(excluded.remaining,584.56);
 assert.equal(roundMoney(included.income-included.displayedOut),included.remaining);
 assert.deepEqual(plan,before);
});
