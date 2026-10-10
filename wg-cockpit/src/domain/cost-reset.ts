import type { CostPlan } from "./cost-plan.ts";
export function resetCostPlan(plan:CostPlan,scope:"month"|"all",month:string):CostPlan{
 if(scope==="all")return {income:[],fixed:[],expenses:[],closing:[],adjustments:[],closingBalance:0,checks:{}};
 const next=structuredClone(plan);next.expenses=next.expenses.filter(row=>row.month!==month);return next;
}
