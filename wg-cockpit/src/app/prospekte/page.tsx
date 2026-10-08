"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,BookOpen,ExternalLink,MapPin,Star} from "lucide-react";
import {PageHeading,Panel} from "@/components/ui";
import {useHouseholdState} from "@/lib/use-household-state";

type ProspectSettings={location:string;radius:number;favorites:string[]};
type Retailer={id:string;name:string;group:string;url:string;kind:"Prospekt"|"Angebote";note:string};
const retailers:Retailer[]=[
 {id:"hofer",name:"HOFER",group:"Lebensmittel",url:"https://www.hofer.at/flugblatt",kind:"Prospekt",note:"Aktuelles Flugblatt und weitere Aktionen"},
 {id:"spar",name:"SPAR",group:"Lebensmittel",url:"https://www.spar.at/aktionen",kind:"Prospekt",note:"Flugblätter nach Region und Markt"},
 {id:"eurospar",name:"EUROSPAR",group:"Lebensmittel",url:"https://www.spar.at/aktionen",kind:"Prospekt",note:"Aktuelle SPAR-Flugblätter"},
 {id:"interspar",name:"INTERSPAR",group:"Lebensmittel",url:"https://www.interspar.at/aktionen/",kind:"Prospekt",note:"Flugblätter nach Bundesland"},
 {id:"billa",name:"BILLA",group:"Lebensmittel",url:"https://www.billa.at/unsere-aktionen",kind:"Prospekt",note:"Digitale Flugblätter und Aktionen"},
 {id:"billa-plus",name:"BILLA PLUS",group:"Lebensmittel",url:"https://www.billa.at/unsere-aktionen",kind:"Prospekt",note:"Flugblätter und Aktionen"},
 {id:"lidl",name:"Lidl",group:"Lebensmittel",url:"https://www.lidl.at/c/flugblatt/s10012330",kind:"Prospekt",note:"Flugblätter und Prospekte; Filiale für regionale Angebote wählbar"},
 {id:"penny",name:"PENNY",group:"Lebensmittel",url:"https://www.penny.at/flugblatt",kind:"Prospekt",note:"Wöchentliches Online-Flugblatt"},
 {id:"dm",name:"dm",group:"Drogerie",url:"https://www.dm.at/dm-journal-447278",kind:"Prospekt",note:"dm Journal und immergünstig express online durchblättern"},
 {id:"bipa",name:"BIPA",group:"Drogerie",url:"https://www.bipa.at/angebote",kind:"Angebote",note:"Offizielle Aktionen und Gutscheine"},
];
const initial:ProspectSettings={location:"",radius:10,favorites:[]};

export default function ProspektePage(){
 const [settings,setSettings,ready]=useHouseholdState<ProspectSettings>("prospectSettings",initial);
 const [filter,setFilter]=useState<"Alle"|"Favoriten">("Alle");
 const displayed=useMemo(()=>{const sorted=[...retailers].sort((a,b)=>Number(settings.favorites.includes(b.id))-Number(settings.favorites.includes(a.id)));return filter==="Favoriten"?sorted.filter(item=>settings.favorites.includes(item.id)):sorted},[filter,settings.favorites]);
 function toggleFavorite(id:string){setSettings(current=>({...current,favorites:current.favorites.includes(id)?current.favorites.filter(item=>item!==id):[...current.favorites,id]}))}
 if(!ready)return <div className="page-stack"><Panel><span className="loading-state">Prospekte werden geladen …</span></Panel></div>;
 return <div className="page-stack prospect-page">
  <PageHeading eyebrow="Einkauf" title="Prospekte & Angebote" subtitle="Aktuelle Flugblätter direkt bei den Händlern ansehen." action={<Link className="button button-secondary" href="/einkauf"><ArrowLeft size={15}/> Zur Einkaufsliste</Link>}/>
  <Panel className="prospect-location-panel"><div className="prospect-location-icon"><MapPin size={18}/></div><label><b>Standort merken</b><input value={settings.location} onChange={event=>setSettings(current=>({...current,location:event.target.value}))} placeholder="Ort oder Postleitzahl, z. B. Wien" autoComplete="postal-code"/></label><label className="prospect-radius"><b>Umkreis</b><select value={settings.radius} onChange={event=>setSettings(current=>({...current,radius:Number(event.target.value)}))}>{[5,10,20,30,50].map(radius=><option value={radius} key={radius}>{radius} km</option>)}</select></label><small className="prospect-location-note">Ort und Umkreis werden gemerkt. Händler mit regionalen Flugblättern lassen dich den passenden Markt auf ihrer offiziellen Seite auswählen.</small></Panel>
  <div className="prospect-filter-row"><div><button className={filter==="Alle"?"selected":""} onClick={()=>setFilter("Alle")}>Alle Händler <span>{retailers.length}</span></button><button className={filter==="Favoriten"?"selected":""} onClick={()=>setFilter("Favoriten")}>Favoriten <span>{settings.favorites.length}</span></button></div><small>Offizielle Händlerquellen · ohne erfundene Angebote</small></div>
  {displayed.length?<section className="prospect-grid">{displayed.map(retailer=><article className="prospect-card" key={retailer.id}><div className="prospect-card-top"><span className="prospect-retailer-mark"><BookOpen size={19}/></span><button className={`prospect-favorite ${settings.favorites.includes(retailer.id)?"active":""}`} onClick={()=>toggleFavorite(retailer.id)} aria-label={`${retailer.name} ${settings.favorites.includes(retailer.id)?"aus Favoriten entfernen":"als Favorit markieren"}`} aria-pressed={settings.favorites.includes(retailer.id)}><Star size={17} fill={settings.favorites.includes(retailer.id)?"currentColor":"none"}/></button></div><small className="prospect-group">{retailer.group} · Offizielle Quelle</small><h2>{retailer.name}</h2><p>{retailer.note}</p><a className="button button-primary prospect-open" href={retailer.url} target="_blank" rel="noreferrer">{retailer.kind} ansehen <ExternalLink size={14}/></a></article>)}</section>:<Panel className="prospect-empty"><Star size={22}/><b>Noch keine Händler favorisiert</b><small>Markiere einen Händler mit dem Stern, damit er hier zuerst erscheint.</small><button className="button button-secondary" onClick={()=>setFilter("Alle")}>Alle Händler ansehen</button></Panel>}
  <Panel className="prospect-source-note"><b>Quellenhinweis</b><p>Die Händler veröffentlichen ihre aktuellen Prospekte auf eigenen, regelmäßig aktualisierten Seiten. Dort wird auch die jeweilige Region ausgewählt. Eine frei dokumentierte gemeinsame Prospekt-API oder eine erlaubte einheitliche Einbettung ist derzeit nicht verfügbar; deshalb öffnen die Schaltflächen die Originalquelle. Preis- und Rabatt-Highlights werden erst angezeigt, wenn sie aus einer verlässlichen Quelle stammen.</p></Panel>
 </div>
}
