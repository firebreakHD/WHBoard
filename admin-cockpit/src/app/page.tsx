import { Activity, AlertTriangle, ArrowUpRight, Box, HardDrive, Network, Server, ShieldCheck } from "lucide-react";
import { AdminTabs } from "@/components/admin-tabs";
import { monitorProvider } from "@/providers/monitor";

export const dynamic = "force-dynamic";
export default async function AdminDashboard({searchParams}:{searchParams:Promise<{refresh?:string}>}) {
  const {refresh}=await searchParams;
  const snapshot = await monitorProvider.getSnapshot({force:Boolean(refresh)});
  const wgCockpitUrl = process.env.WG_COCKPIT_URL || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");
  const refreshHref = "/?refresh=" + Date.now();
  return <main className="admin-page">
    <AdminTabs active="/" status={snapshot.source === "Demo" ? "Lokal-Vorschau" : "Home Assistant"} refreshHref={refreshHref}/>
    <header className="page-header"><div><small>ADMIN</small><h1>Admin</h1><p>Systemweite Übersicht für Betrieb, Geräte und Wartung.</p></div><span className={`mode-pill ${snapshot.source === "Demo" ? "demo-mode" : "live-mode"}`}><i/> {snapshot.source === "Demo" ? "VORSCHAU" : "LIVE · READ ONLY"}</span></header>
    <div className="notice"><ShieldCheck size={18}/><div><b>{snapshot.source === "Demo" ? "Home Assistant noch nicht verbunden" : "Home Assistant live verbunden"}</b><span>{snapshot.source === "Demo" ? "Im Add-on liest dieses Portal Supervisor- und Sensorinformationen aus; lokal werden keine Gerätedaten vorgetäuscht." : `Live-Status vom ${snapshot.resources.host} · Aktualisiert ${new Date(snapshot.updatedAt).toLocaleTimeString("de-AT", {hour:"2-digit",minute:"2-digit"})}`}</span></div><a href="/einstellungen">Details</a></div>
    <div className="stats">
      <Stat name="SERVICE HEALTH" value={snapshot.systems} detail="Home Assistant & Apps" icon={<Activity/>}/>
      <Stat name="PRÜFEN" value={String(snapshot.warnings.length)} detail="Warnungen und Updates" icon={<AlertTriangle/>} warn={snapshot.warnings.length>0}/>
      <Stat name="PIPELINE" value={snapshot.docker} detail="Supervisor Apps" icon={<Box/>}/>
      <Stat name="ERREICHBARKEIT" value={snapshot.homeAssistant} detail={snapshot.responseTime} icon={<Server/>}/>
      <Stat name="HOST-SPEICHER" value={snapshot.nasStorage} detail={snapshot.resources.host} icon={<HardDrive/>}/>
      <Stat name="NETZWERK" value={snapshot.network} detail="Home Assistant Host" icon={<Network/>}/>
    </div>
    <section className="card operator-card"><div className="card-head"><div><h2>Operator-Hinweise</h2><p>Auffällige Dienste, Hostwerte und Updates aus Home Assistant.</p></div><span className="mini-pill">Nur Anzeige</span></div>{snapshot.warnings.length ? snapshot.warnings.map(w=><div className="warning-item" key={w.title}><span className="warn-icon"><AlertTriangle size={15}/></span><div><b>{w.title}</b><small>{w.detail}</small></div><span className="badge warning-badge">Prüfen</span></div>) : <div className="empty-note"><b>Keine Operator-Hinweise</b><span>Es liegen derzeit keine Supervisor-Warnungen vor.</span></div>}</section>
    <div className="content-grid">
      <section className="card services"><div className="card-head"><div><h2>Service Health</h2><p>Home Assistant Core und installierte Apps · {snapshot.source}</p></div><a href="/docker" className="mini-pill">{snapshot.services.length} Dienste <ArrowUpRight size={14}/></a></div><div className="table-head"><span>Service</span><span>Status</span><span>CPU</span><span>RAM</span><span>Details</span></div>{snapshot.services.map(s=><details className="service-detail" key={s.name}><summary className="service"><b><i className="container-icon"><Box size={14}/></i>{s.name}</b><span className={`badge ${s.status}`}>{s.updateAvailable?"Update":s.status}</span><span>{s.cpu}</span><span>{s.ram}</span><span className="details-link">Details</span></summary><div className="detail-panel"><span>Version <b>{s.version||"–"}</b></span><span>Laufzeit <b>{s.uptime}</b></span><span>Neustarts <b>{s.restartCount}</b></span><span>Hinweis <b>{s.updateAvailable?"Update verfügbar":"Kein Eingriff erforderlich"}</b></span></div></details>)}{!snapshot.services.length&&<p className="empty-state">Starte das Admin Cockpit als Home Assistant App, um Live-Daten einzulesen.</p>}</section>
      <div className="right-col"><section className="card"><div className="card-head"><div><h2>Systemressourcen</h2><p>{snapshot.resources.host} · {snapshot.source}</p></div></div><Resource label="CPU · Home Assistant Core" value={snapshot.resources.cpuPercent}/><Resource label="RAM · Home Assistant Core" value={snapshot.resources.memoryPercent}/><Resource label="Host-Datenträger" value={snapshot.resources.storagePercent}/><div className="sys-meta"><span>Prozessor<b>{snapshot.resources.processor}</b></span><span>Betriebssystem<b>{snapshot.resources.os}</b></span></div></section><section className="card link-card"><span className="link-icon">⌂</span><div><b>Zum WG Cockpit</b><small>Finanzen, Einkauf und Berichte</small></div><a href={wgCockpitUrl||"#"} aria-label="WG Cockpit öffnen"><ArrowUpRight size={17}/></a></section></div>
    </div>
    <footer>Admin Cockpit <span>Unabhängiges Portal · {snapshot.source} · zuletzt aktualisiert {new Date(snapshot.updatedAt).toLocaleString("de-AT")}</span></footer>
  </main>;
}
function Stat({name,value,detail,icon,warn=false}:{name:string;value:string;detail:string;icon:React.ReactNode;warn?:boolean}) { return <article className="stat"><span className={`stat-icon ${warn?"warn":""}`}>{icon}</span><small>{name}</small><b>{value}</b><span>{detail}</span></article>; }
function Resource({label,value}:{label:string;value:number}) { return <div className="resource"><div><span>{label}</span><b>{Math.round(value)} %</b></div><div className="track"><i style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></div></div>; }
