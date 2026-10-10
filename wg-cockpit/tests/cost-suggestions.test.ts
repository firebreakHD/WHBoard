import test from "node:test";
import assert from "node:assert/strict";
import { costSuggestions } from "../src/domain/cost-suggestions.ts";
import { initialCostPlan } from "../src/lib/cost-plan-seed.ts";
test("suggestions use the selected month and exclude savings and income",()=>{
 const plan=structuredClone(initialCostPlan);
 plan.expenses.push({id:"credit",name:"Steam",amount:999,kind:"in",refund:0,note:"",month:"2026-09"});
 plan.expenses.push({id:"saving",name:"Steam Sparplan",amount:999,isSaving:true,refund:0,note:"",month:"2026-09"});
 const result=costSuggestions(plan,"2026-09",10);const gaming=result.suggestions.find(row=>row.title==="Freizeitbudget festlegen")!;
 assert.equal(gaming.amount,119.1);assert.equal(gaming.potential,11.91);
 assert.equal(costSuggestions(plan,"2026-10").suggestions.length,0);
 assert.deepEqual(plan.fixed,initialCostPlan.fixed);
});
