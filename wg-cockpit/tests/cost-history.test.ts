import test from "node:test";
import assert from "node:assert/strict";
import {costSummary,updateCostRegulars,isCostPlan,nextCostMonth} from "../src/domain/cost-plan.ts";
import {initialCostPlan as fixture} from "./fixtures/cost-plan.ts";
import {initialCostPlan as empty} from "../src/lib/cost-plan-seed.ts";
import {resetCostPlan} from "../src/domain/cost-reset.ts";
test("new production accounts are empty for every month",()=>{
 assert.equal(isCostPlan(empty),true);
 for(const month of ["2026-09","2026-10","2027-01"]){const result=costSummary(empty,month);assert.equal(result.income,0);assert.equal(result.fixed,0);assert.equal(result.expenses,0);assert.equal(result.remaining,0)}
});
test("regular edits apply next month and preserve past and current values",()=>{
 const changed=fixture.fixed.map(row=>row.id==="fixed-4"?{...row,amount:50}:row);
 const plan=updateCostRegulars(fixture,"fixed",changed,false,"2026-10");
 assert.equal(costSummary(plan,"2026-09").fixed,1637.47);assert.equal(costSummary(plan,"2026-10").fixed,1637.47);assert.equal(costSummary(plan,"2026-11").fixed,1645.47);
 assert.equal(isCostPlan(plan),true);assert.equal(nextCostMonth("2026-12"),"2027-01");assert.equal(fixture.fixed[3].amount,42);
});
test("current-month checkbox preserves history and does not pull another future change forward",()=>{
 const next=updateCostRegulars(fixture,"fixed",fixture.fixed.map(row=>row.id==="fixed-4"?{...row,amount:50}:row),false,"2026-10");
 const current=updateCostRegulars(next,"income",[{...fixture.income[0],amount:3000}],true,"2026-10");
 assert.equal(costSummary(current,"2026-09").fixedIncome,2327.2);assert.equal(costSummary(current,"2026-10").fixedIncome,3000);
 assert.equal(costSummary(current,"2026-10").fixed,1637.47);assert.equal(costSummary(current,"2026-11").fixed,1645.47);
 assert.equal(costSummary(current,"2026-11").fixedIncome,3000);
});
test("month reset preserves fixed history and other months; full reset clears everything",()=>{
 const plan=updateCostRegulars(fixture,"income",fixture.income,true,"2026-10");plan.checks={"2026-09":{opening:1,income:2,expenses:3}};
 plan.expenses.push({id:"oct",name:"Isolated fixture",amount:7,refund:0,note:"",month:"2026-10"});
 const monthly=resetCostPlan(plan,"month","2026-09");assert.equal(monthly.expenses.length,1);assert.deepEqual(monthly.regularVersions,plan.regularVersions);
 const all=resetCostPlan(plan,"all","2026-10");assert.equal(costSummary(all,"2026-09").remaining,0);assert.equal(costSummary(all,"2026-10").fixed,0);assert.deepEqual(all.checks,{});
 assert.equal(plan.expenses.length,17);assert.equal(isCostPlan(all),true);
});
test("manual counterchecks are separate by month and validate amounts",()=>{
 const plan=structuredClone(empty);plan.checks={"2026-09":{opening:100,income:200,expenses:50},"2026-10":{opening:0,income:0,expenses:0}};
 assert.equal(isCostPlan(plan),true);assert.equal(costSummary(plan,"2026-09").remaining,0);
 plan.checks["2026-09"].expenses=-1;assert.equal(isCostPlan(plan),false);
});
