"use client";
import {useEffect} from "react";
export function PwaRegistration(){useEffect(()=>{if("serviceWorker" in navigator)navigator.serviceWorker.register("/service-worker.js").catch(()=>{})},[]);return null}
