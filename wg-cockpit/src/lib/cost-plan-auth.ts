import { randomBytes } from "node:crypto";
type AuthState = { sessions: Map<string,number>; attempts: Map<string,{count:number;until:number}> };
const globalAuth = globalThis as typeof globalThis & { costPlanAuth?: AuthState };
const state = globalAuth.costPlanAuth ??= {sessions:new Map(),attempts:new Map()};
const duration = 30 * 60 * 1000;
export function costPlanAuthorized(request: Request) {
 const token = request.headers.get("authorization")?.replace(/^Bearer /,"") || "";
 const expires = state.sessions.get(token);
 if (!expires || expires <= Date.now()) { state.sessions.delete(token); return false; }
 state.sessions.set(token,Date.now()+duration); return true;
}
export function unlockCostPlan(pin: unknown, address: string): {token:string}|{error:string;status:number} {
 const now=Date.now(); for(const [token,expires] of state.sessions) if(expires<=now)state.sessions.delete(token);
 for(const [key,attempt] of state.attempts)if(attempt.until<=now)state.attempts.delete(key);
 const attempt=state.attempts.get(address);
 if(attempt && attempt.count>=5)return {error:"Zu viele Versuche. Bitte in einer Minute erneut versuchen.",status:429};
 if(pin!=="1003") { state.attempts.set(address,{count:(attempt?.count||0)+1,until:attempt?.until||now+60000}); return {error:"Der PIN stimmt nicht.",status:401}; }
 state.attempts.delete(address); const token=randomBytes(32).toString("hex");state.sessions.set(token,now+duration);return {token};
}
export function lockCostPlan(request: Request) { state.sessions.delete(request.headers.get("authorization")?.replace(/^Bearer /,"")||""); }
