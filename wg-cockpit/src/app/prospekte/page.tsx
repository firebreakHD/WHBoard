"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {ArrowLeft,ChevronLeft,ChevronRight,ExternalLink,LoaderCircle,MapPin,Percent,Search,Star} from "lucide-react";
import {PageHeading,Panel} from "@/components/ui";
import {ProspectViewer, type ProspectViewerRetailer} from "@/components/prospect-viewer";
import {useHouseholdState} from "@/lib/use-household-state";

type ProspectSettings={location:string;radius:number;favorites:string[]};
type Retailer={id:string;name:string;group:string;url:string;kind:"Prospekt"|"Angebote";note:string};
type Offer={id:string;title:string;unit:string;price:number;oldPrice:number|null;image:string|null;url:string|null;store:string;storeName:string;discount:number|null;condition:string|null};
type OfferResponse={offers:Offer[];updatedAt:string|null;error?:string};
type PlaceSuggestion={id:string;label:string;primary:string;secondary:string};
const retailers:Retailer[]=[
 {id:"hofer",name:"HOFER",group:"Lebensmittel",url:"https://www.hofer.at/flugblatt",kind:"Prospekt",note:"Aktuelles Flugblatt und weitere Aktionen"},
 {id:"spar",name:"SPAR",group:"Lebensmittel",url:"https://www.spar.at/aktionen",kind:"Prospekt",note:"Flugblätter nach Region und Markt"},
 {id:"eurospar",name:"EUROSPAR",group:"Lebensmittel",url:"https://www.spar.at/aktionen",kind:"Prospekt",note:"Aktuelle SPAR-Flugblätter"},
 {id:"interspar",name:"INTERSPAR",group:"Lebensmittel",url:"https://www.interspar.at/aktionen/",kind:"Prospekt",note:"Flugblätter nach Bundesland"},
 {id:"billa",name:"BILLA",group:"Lebensmittel",url:"https://www.billa.at/unsere-aktionen",kind:"Prospekt",note:"Digitale Flugblätter und Aktionen"},
 {id:"billa-plus",name:"BILLA PLUS",group:"Lebensmittel",url:"https://www.billa.at/unsere-aktionen",kind:"Prospekt",note:"Flugblätter und Aktionen"},
 {id:"lidl",name:"Lidl",group:"Lebensmittel",url:"https://www.lidl.at/c/flugblatt/s10012330",kind:"Prospekt",note:"Flugblätter und Prospekte; Filiale für regionale Angebote wählbar"},
 {id:"penny",name:"PENNY",group:"Lebensmittel",url:"https://www.penny.at/flugblatt",kind:"Prospekt",note:"Wöchentliches Online-Flugblatt"},
 {id:"dm",name:"dm",group:"Drogerie",url:"https://www.dm.at/dm-journal-447278",kind:"Prospekt",note:"Aktuelles dm Journal direkt als Bildseiten durchblättern"},
 {id:"bipa",name:"BIPA",group:"Drogerie",url:"https://www.bipa.at/cp/aktionen",kind:"Prospekt",note:"Aktuelle Angebote und Prospektseiten"},
];
const initial:ProspectSettings={location:"",radius:10,favorites:[]};

export default function ProspektePage(){
 const [settings,setSettings,ready]=useHouseholdState<ProspectSettings>("prospectSettings",initial);
 const [locationQuery,setLocationQuery]=useState("");const [placeSuggestions,setPlaceSuggestions]=useState<PlaceSuggestion[]>([]);const [locationFocused,setLocationFocused]=useState(false);const [locationSearching,setLocationSearching]=useState(false);const [locationError,setLocationError]=useState("");const [activePlace,setActivePlace]=useState(0);
 const [filter,setFilter]=useState<"Alle"|"Favoriten">("Alle");
 const [selected,setSelected]=useState<Retailer|null>(null);
 const [offers,setOffers]=useState<Offer[]>([]);
 const [offerStore,setOfferStore]=useState("Alle");
 const [offersLoading,setOffersLoading]=useState(true);
 const [offersUpdated,setOffersUpdated]=useState<string|null>(null);
 const offerTrack=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(ready)setLocationQuery(settings.location)},[ready,settings.location]);
 useEffect(()=>{
  const query=locationQuery.trim();
  if(query.length<2||query===settings.location){setPlaceSuggestions([]);setLocationSearching(false);setLocationError("");return}
  const controller=new AbortController();
  const timer=window.setTimeout(()=>{
   setLocationSearching(true);setLocationError("");
   void fetch(`/api/places?q=${encodeURIComponent(query)}`,{signal:controller.signal}).then(async response=>{const data=await response.json() as {results?:PlaceSuggestion[];error?:string};if(!response.ok)throw new Error(data.error||"Standortsuche nicht verfügbar.");setPlaceSuggestions(data.results??[]);setActivePlace(0)}).catch(error=>{if(error instanceof DOMException&&error.name==="AbortError")return;setPlaceSuggestions([]);setLocationError(error instanceof Error?error.message:"Standortsuche nicht verfügbar.")}).finally(()=>{if(!controller.signal.aborted)setLocationSearching(false)});
  },500);
  return()=>{window.clearTimeout(timer);controller.abort()};
 },[locationQuery,settings.location]);
 useEffect(()=>{let active=true;fetch("/api/prospekte/angebote").then(response=>response.json() as Promise<OfferResponse>).then(data=>{if(!active)return;setOffers(data.offers??[]);setOffersUpdated(data.updatedAt??null)}).catch(()=>{}).finally(()=>{if(active)setOffersLoading(false)});return()=>{active=false}},[]);
 const offerStores=useMemo(()=>[...new Map(offers.map(offer=>[offer.store,offer.storeName])).entries()], [offers]);
 const visibleOffers=useMemo(()=>offerStore==="Alle"?offers:offers.filter(offer=>offer.store===offerStore),[offerStore,offers]);
 const displayed=useMemo(()=>{const sorted=[...retailers].sort((a,b)=>Number(settings.favorites.includes(b.id))-Number(settings.favorites.includes(a.id)));return filter==="Favoriten"?sorted.filter(item=>settings.favorites.includes(item.id)):sorted},[filter,settings.favorites]);
 function toggleFavorite(id:string){setSettings(current=>({...current,favorites:current.favorites.includes(id)?current.favorites.filter(item=>item!==id):[...current.favorites,id]}))}
 function chooseLocation(location:string){setSettings(current=>({...current,location}));setLocationQuery(location);setPlaceSuggestions([]);setLocationFocused(false);setLocationError("")}
 if(!ready)return <div className="page-stack"><Panel><span className="loading-state">Prospekte werden geladen …</span></Panel></div>;
 return <div className="page-stack prospect-page">
  <PageHeading eyebrow="Einkauf" title="Prospekte & Angebote" subtitle="Aktuelle Flugblätter direkt bei den Händlern ansehen." action={<Link className="button button-secondary" href="/einkauf"><ArrowLeft size={15}/> Zur Einkaufsliste</Link>}/>
  <Panel className="prospect-location-panel"><div className="prospect-location-icon"><MapPin size={18}/></div><label className="prospect-location-input"><b>Standort merken</b><span className="prospect-location-control"><Search size={16}/><input role="combobox" aria-autocomplete="list" aria-expanded={locationFocused&&placeSuggestions.length>0} aria-controls="prospect-location-suggestions" value={locationQuery} onChange={event=>{setLocationQuery(event.target.value);setLocationFocused(true);setPlaceSuggestions([]);setActivePlace(0)}} onFocus={()=>setLocationFocused(true)} onBlur={()=>window.setTimeout(()=>setLocationFocused(false),140)} onKeyDown={event=>{if(event.key==="ArrowDown"&&placeSuggestions.length){event.preventDefault();setActivePlace(index=>Math.min(index+1,placeSuggestions.length-1))}else if(event.key==="ArrowUp"&&placeSuggestions.length){event.preventDefault();setActivePlace(index=>Math.max(0,index-1))}else if(event.key==="Enter"){event.preventDefault();if(placeSuggestions[activePlace])chooseLocation(placeSuggestions[activePlace].label);else if(locationQuery.trim())chooseLocation(locationQuery.trim())}else if(event.key==="Escape"){setLocationFocused(false);setPlaceSuggestions([])}}} placeholder="Ort, Adresse oder Postleitzahl" autoComplete="off"/><span className="prospect-location-status" aria-live="polite">{locationSearching?<LoaderCircle size={15} className="prospect-location-spinner"/>:null}</span></span>{locationFocused&&(placeSuggestions.length>0||locationQuery.trim().length>=2)&&<div className="prospect-place-suggestions" id="prospect-location-suggestions" role="listbox">{placeSuggestions.map((place,index)=><button type="button" role="option" aria-selected={activePlace===index} className={activePlace===index?"active":""} key={place.id} onMouseDown={event=>event.preventDefault()} onClick={()=>chooseLocation(place.label)}><MapPin size={16}/><span><b>{place.primary}</b>{place.secondary&&<small>{place.secondary}</small>}</span></button>)}{locationSearching&&<small className="prospect-place-state">Standorte werden gesucht …</small>}{!locationSearching&&!placeSuggestions.length&&<div className="prospect-place-empty"><span>{locationError||"Kein genauer Treffer gefunden."}</span><button type="button" onMouseDown={event=>event.preventDefault()} onClick={()=>chooseLocation(locationQuery.trim())}>Eingabe als Standort merken</button></div>}</div>}</label><label className="prospect-radius"><b>Umkreis</b><select value={settings.radius} onChange={event=>setSettings(current=>({...current,radius:Number(event.target.value)}))}>{[5,10,20,30,50].map(radius=><option value={radius} key={radius}>{radius} km</option>)}</select></label><small className="prospect-location-note">Standort wird nach der Auswahl gespeichert. Händler zeigen passende Märkte auf ihrer offiziellen Seite.</small><small className="prospect-geocoder-credit">Ortsvorschläge: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap-Mitwirkende</a> · Photon</small></Panel>
  <section className="prospect-offers" aria-label="Aktuelle reduzierte Produkte">
   <div className="prospect-offers-heading"><div><span className="prospect-offers-eyebrow"><Percent size={13}/> Angebote aus den Prospekten</span><h2>Diese Woche günstiger</h2><p>Ein kurzer Blick auf aktuelle Aktionen lohnt sich.</p></div><div className="prospect-offer-arrows"><button onClick={()=>offerTrack.current?.scrollBy({left:-340,behavior:"smooth"})} aria-label="Angebote nach links"><ChevronLeft size={18}/></button><button onClick={()=>offerTrack.current?.scrollBy({left:340,behavior:"smooth"})} aria-label="Angebote nach rechts"><ChevronRight size={18}/></button></div></div>
   {offerStores.length>0&&<div className="prospect-offer-filters" aria-label="Angebote nach Händler filtern"><button className={offerStore==="Alle"?"selected":""} onClick={()=>setOfferStore("Alle")}>Alle <span>{offers.length}</span></button>{offerStores.map(([id,name])=><button key={id} className={offerStore===id?"selected":""} onClick={()=>setOfferStore(id)}>{name}</button>)}</div>}
   {offersLoading?<div className="prospect-offers-loading">Aktuelle Angebote werden geladen …</div>:visibleOffers.length>0?<div className="prospect-offer-track" ref={offerTrack}>{visibleOffers.map(offer=><a className="prospect-offer-card" href={offer.url??"https://sparkorb.at/angebote"} target="_blank" rel="noreferrer" key={`${offer.store}-${offer.id}`} title={`${offer.title} bei ${offer.storeName}`}>
     <div className="prospect-offer-image">{offer.image?<img src={offer.image} alt="" loading="lazy"/>:<span>{offer.storeName}</span>}{offer.discount!==null&&<span className="prospect-offer-discount">−{offer.discount}%</span>}</div>
     <div className="prospect-offer-copy"><span className="prospect-offer-store">{offer.storeName}</span><b>{offer.title}</b>{offer.unit&&<small>{offer.unit}</small>}{offer.condition&&<small className="prospect-offer-condition">{offer.condition}</small>}<div className="prospect-offer-prices"><strong>{offer.price.toLocaleString("de-AT",{style:"currency",currency:"EUR"})}</strong>{offer.oldPrice!==null&&<del>{offer.oldPrice.toLocaleString("de-AT",{style:"currency",currency:"EUR"})}</del>}</div></div>
    </a>)}</div>:<div className="prospect-offers-empty">{offersLoading?"":"Angebote sind gerade nicht abrufbar. Die Prospekte darunter bleiben verfügbar."} <a href="https://sparkorb.at/angebote" target="_blank" rel="noreferrer">Angebote öffnen</a></div>}
   {!offersLoading&&offers.length>0&&<small className="prospect-offers-source">Preise: Sparkorb · {offersUpdated?`Stand ${offersUpdated}`:"täglich aktualisiert"} · Angebot beim Händler prüfen</small>}
  </section>
  <div className="prospect-filter-row"><div><button className={filter==="Alle"?"selected":""} onClick={()=>setFilter("Alle")}>Alle Händler <span>{retailers.length}</span></button><button className={filter==="Favoriten"?"selected":""} onClick={()=>setFilter("Favoriten")}>Favoriten <span>{settings.favorites.length}</span></button></div><small>Offizielle Händlerquellen · ohne erfundene Angebote</small></div>
  {displayed.length?<section className="prospect-grid">{displayed.map(retailer=><article className="prospect-card" key={retailer.id}>
    <div className="prospect-card-top"><span className="prospect-group-label">{retailer.group}</span><button className={`prospect-favorite ${settings.favorites.includes(retailer.id)?"active":""}`} onClick={()=>toggleFavorite(retailer.id)} aria-label={`${retailer.name} ${settings.favorites.includes(retailer.id)?"aus Favoriten entfernen":"als Favorit markieren"}`} aria-pressed={settings.favorites.includes(retailer.id)}><Star size={17} fill={settings.favorites.includes(retailer.id)?"currentColor":"none"}/></button></div>
    <button className="prospect-card-cover" onClick={()=>setSelected(retailer)} aria-label={`${retailer.name} Prospekt öffnen`}>
      {retailer.kind==="Prospekt"?<img src={`/api/prospekte?retailer=${encodeURIComponent(retailer.id)}&page=1&location=${encodeURIComponent(settings.location)}&raw=1`} alt={`Titelseite des aktuellen ${retailer.name} Flugblatts`} loading="lazy"/>:<div className="prospect-cover-placeholder"><span>{retailer.name}</span><small>Aktuelles Flugblatt</small></div>}
      <span className="prospect-cover-hint">{retailer.kind==="Prospekt"?"Antippen zum Blättern":"Offizielle Quelle öffnen"}</span>
    </button>
    <h2>{retailer.name}</h2><p>{retailer.note}</p><button className="button button-primary prospect-open" onClick={()=>setSelected(retailer)}>{retailer.kind} ansehen <ExternalLink size={14}/></button>
  </article>)}</section>:<Panel className="prospect-empty"><Star size={22}/><b>Noch keine Händler favorisiert</b><small>Markiere einen Händler mit dem Stern, damit er hier zuerst erscheint.</small><button className="button button-secondary" onClick={()=>setFilter("Alle")}>Alle Händler ansehen</button></Panel>}
  {selected&&<ProspectViewer retailer={selected as ProspectViewerRetailer} location={settings.location} favorite={settings.favorites.includes(selected.id)} onFavorite={()=>toggleFavorite(selected.id)} onClose={()=>setSelected(null)}/>}
  <Panel className="prospect-source-note"><b>Quellen</b><p>Bildseiten kommen aus den öffentlichen offiziellen Publikationen von HOFER, BILLA, SPAR, EUROSPAR, INTERSPAR, Lidl, PENNY, dm und BIPA. Die BILLA-Ausgabe richtet sich nach dem gespeicherten Standort.</p></Panel>
 </div>
}
