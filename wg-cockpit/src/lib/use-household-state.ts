"use client";
import {useCallback,useEffect,useRef,useState} from "react";

type StateMap=Record<string,unknown>;
const listeners=new Set<()=>void>();
const writeTimers=new Map<string,number>();
let sharedState:StateMap|null=null;
let loading:Promise<void>|null=null;
let pollTimer:number|undefined;

function notify(){listeners.forEach(listener=>listener())}
async function loadSharedState(){if(loading)return loading;loading=fetch("/api/state",{cache:"no-store"}).then(async response=>{if(!response.ok)throw new Error("WG state load failed");const remote=await response.json() as StateMap;sharedState={...(sharedState||{}),...remote};notify()}).catch(()=>{sharedState=sharedState||{};notify()}).finally(()=>{loading=null});return loading}
function persistKey(key:string){const old=writeTimers.get(key);if(old!==undefined)window.clearTimeout(old);const timer=window.setTimeout(()=>{writeTimers.delete(key);const value=sharedState?.[key];fetch("/api/state",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({key,value})}).catch(()=>{})},220);writeTimers.set(key,timer)}
function refreshIfVisible(){if(document.visibilityState==="visible")void loadSharedState()}
function beginPolling(){if(pollTimer!==undefined)return;window.addEventListener("focus",refreshIfVisible);pollTimer=window.setInterval(refreshIfVisible,30000)}
function stopPollingIfUnused(){if(listeners.size)return;if(pollTimer!==undefined){window.clearInterval(pollTimer);pollTimer=undefined;window.removeEventListener("focus",refreshIfVisible)}}

export function useHouseholdState<T>(key:string,initial:T):[T,(next:T|((current:T)=>T))=>void,boolean]{
 const [value,setValue]=useState<T>(initial);const [ready,setReady]=useState(false);const valueRef=useRef(value);valueRef.current=value;
 useEffect(()=>{let active=true;const sync=()=>{if(!active)return;if(sharedState&&Object.prototype.hasOwnProperty.call(sharedState,key)){const next=sharedState[key] as T;valueRef.current=next;setValue(next)}if(sharedState!==null)setReady(true)};listeners.add(sync);sync();beginPolling();if(sharedState===null)void loadSharedState();return()=>{active=false;listeners.delete(sync);stopPollingIfUnused()}},[key]);
 const update=useCallback((next:T|((current:T)=>T))=>{const current=(sharedState&&Object.prototype.hasOwnProperty.call(sharedState,key)?sharedState[key]:valueRef.current) as T;const resolved=typeof next==="function"?(next as (current:T)=>T)(current):next;valueRef.current=resolved;setValue(resolved);sharedState={...(sharedState||{}),[key]:resolved};notify();persistKey(key)},[key]);
 return[value,update,ready];
}
