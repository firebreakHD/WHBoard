"use client";
import {useMemo,useState} from "react";
import {Search} from "lucide-react";
import type {SensorSnapshot} from "@/providers/monitor";

export function SensorList({sensors}:{sensors:SensorSnapshot[]}){
 const [query,setQuery]=useState("");const filtered=useMemo(()=>{const q=query.trim().toLocaleLowerCase("de");return sensors.filter(s=>!q||`${s.name} ${s.entityId} ${s.state} ${s.deviceClass??""}`.toLocaleLowerCase("de").includes(q))},[sensors,query]);
 return <section className="card sensor-card"><div className="card-head"><div><h2>Hardware & Sensoren</h2><p>{sensors.length} Sensoren aus der Home Assistant Core API</p></div><span className="mini-pill">Nur Anzeige</span></div><label className="sensor-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Sensor oder Raum suchen" aria-label="Sensoren durchsuchen"/></label><div className="sensor-table"><div className="sensor-table-head"><span>Name</span><span>Wert</span><span>Typ</span><span>Entity ID</span></div>{filtered.map(s=><div className="sensor-row" key={s.entityId}><b>{s.name}</b><strong>{s.state}{s.unit?` ${s.unit}`:""}</strong><span>{s.deviceClass||"Sensor"}</span><code>{s.entityId}</code></div>)}{!filtered.length&&<p className="empty-state">{sensors.length?"Keine passenden Sensoren gefunden.":"Home Assistant hat keine Sensor-Entitäten zurückgegeben."}</p>}</div></section>
}
