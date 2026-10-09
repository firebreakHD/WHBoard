import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import path from "node:path";
import type { CostPlan } from "../domain/cost-plan";
import { initialCostPlan } from "./cost-plan-seed";
type StoredPlan = { plan: CostPlan; revision: string };
const filePath = () => path.join(process.env.WG_DATA_DIR || path.join(process.cwd(),".data"),"cost-plan.json");
let queue: Promise<unknown> = Promise.resolve();
const revisionFor = (plan: CostPlan) => createHash("sha256").update(JSON.stringify(plan)).digest("hex");
export async function readCostPlan(): Promise<StoredPlan> {
 try { const plan = JSON.parse(await readFile(filePath(),"utf8")) as CostPlan; return {plan,revision:revisionFor(plan)}; }
 catch(error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; return {plan:structuredClone(initialCostPlan),revision:revisionFor(initialCostPlan)}; }
}
export function saveCostPlan(plan: CostPlan, revision: string): Promise<StoredPlan | null> {
 const work = queue.then(async () => {
  const current = await readCostPlan(); if(current.revision !== revision) return null;
  const file = filePath(); await mkdir(path.dirname(file),{recursive:true});
  const temporary = file+"."+randomUUID()+".tmp"; await writeFile(temporary,JSON.stringify(plan),"utf8"); await rename(temporary,file);
  return {plan,revision:revisionFor(plan)};
 }); queue = work.then(()=>undefined,()=>undefined); return work;
}
