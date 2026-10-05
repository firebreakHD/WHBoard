"use client";
import {useCallback,useEffect,useRef,useState} from "react";

type StateMap=Record<string,unknown>;
const listeners=new Set<()=>void>();
const writeTimers=new Map<string,number>();
const pendingWrites=new Set<string>();
const localVersions=new Map<string,number>();
const baseValues:StateMap={};
const retryCounts=new Map<string,number>();
let sharedState:StateMap|null=null;
let loading:Promise<void>|null=null;
let pollTimer:number|undefined;
let pollIntervalMs=2500;

function notify(){listeners.forEach(listener=>listener())}
async function loadSharedState(){if(loading)return loading;loading=fetch("/api/state",{cache:"no-store",signal:AbortSignal.timeout(3000)}).then(async response=>{if(!response.ok)throw new Error("WG state load failed");const configured=Number(response.headers.get("X-WG-Sync-Interval"));if(Number.isFinite(configured)&&configured>=1000&&configured<=10000&&configured!==pollIntervalMs){pollIntervalMs=configured;if(pollTimer!==undefined){window.clearInterval(pollTimer);pollTimer=window.setInterval(refreshIfVisible,pollIntervalMs)}}const remote=await response.json() as StateMap;sharedState={...(sharedState||{})};for(const [key,value] of Object.entries(remote)){baseValues[key]=value;if(!pendingWrites.has(key))sharedState[key]=value}notify()}).catch(()=>{sharedState=sharedState||{};notify()}).finally(()=>{loading=null});return loading}
async function flushKey(key:string){writeTimers.delete(key);const version=localVersions.get(key)||0;const value=sharedState?.[key];try{const response=await fetch("/api/state",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({key,value,baseValue:baseValues[key]??null}),signal:AbortSignal.timeout(5000)});if(!response.ok)throw new Error("WG state save failed");const result=await response.json() as {state?:StateMap};if(result.state){for(const [remoteKey,remoteValue] of Object.entries(result.state)){baseValues[remoteKey]=remoteValue;if(!pendingWrites.has(remoteKey))sharedState={...(sharedState||{}),[remoteKey]:remoteValue}}}retryCounts.delete(key);if((localVersions.get(key)||0)===version){pendingWrites.delete(key);if(result.state&&Object.prototype.hasOwnProperty.call(result.state,key))sharedState={...(sharedState||{}),[key]:result.state[key]};notify()}else scheduleFlush(key,220)}catch{const attempt=(retryCounts.get(key)||0)+1;retryCounts.set(key,attempt);scheduleFlush(key,Math.min(30000,1500*2**Math.min(attempt-1,4)))}}
function scheduleFlush(key:string,delay:number){const existing=writeTimers.get(key);if(existing!==undefined)window.clearTimeout(existing);const timer=window.setTimeout(()=>void flushKey(key),delay);writeTimers.set(key,timer)}
function persistKey(key:string){const old=writeTimers.get(key);if(old!==undefined)window.clearTimeout(old);pendingWrites.add(key);localVersions.set(key,(localVersions.get(key)||0)+1);scheduleFlush(key,220)}
function refreshIfVisible(){if(document.visibilityState==="visible")void loadSharedState()}
function beginPolling(){if(pollTimer!==undefined)return;window.addEventListener("focus",refreshIfVisible);pollTimer=window.setInterval(refreshIfVisible,pollIntervalMs)}
function stopPollingIfUnused(){if(listeners.size)return;if(pollTimer!==undefined){window.clearInterval(pollTimer);pollTimer=undefined;window.removeEventListener("focus",refreshIfVisible)}}

export function useHouseholdState<T>(key:string,initial:T):[T,(next:T|((current:T)=>T))=>void,boolean]{
 const [value,setValue]=useState<T>(initial);const [ready,setReady]=useState(false);const valueRef=useRef(value);valueRef.current=value;
 useEffect(()=>{let active=true;const sync=()=>{if(!active)return;if(sharedState&&Object.prototype.hasOwnProperty.call(sharedState,key)){const next=sharedState[key] as T;valueRef.current=next;setValue(next)}if(sharedState!==null)setReady(true)};listeners.add(sync);sync();beginPolling();if(sharedState===null)void loadSharedState();return()=>{active=false;listeners.delete(sync);stopPollingIfUnused()}},[key]);
 const update=useCallback((next:T|((current:T)=>T))=>{const current=(sharedState&&Object.prototype.hasOwnProperty.call(sharedState,key)?sharedState[key]:valueRef.current) as T;const resolved=typeof next==="function"?(next as (current:T)=>T)(current):next;valueRef.current=resolved;setValue(resolved);sharedState={...(sharedState||{}),[key]:resolved};notify();persistKey(key)},[key]);
 return[value,update,ready];
}
