import type { CostPlan } from "../domain/cost-plan";
// A new costs account starts empty. Existing saved plans are loaded from storage.
export const initialCostPlan:CostPlan={income:[],fixed:[],expenses:[],closing:[],adjustments:[],closingBalance:0};
