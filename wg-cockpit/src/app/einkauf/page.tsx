"use client";

import {useEffect,useMemo,useState} from "react";
import {Check,Pencil,Plus,Search,Trash2,X} from "lucide-react";
import {Panel} from "@/components/ui";
import {useHouseholdState} from "@/lib/use-household-state";

type Item={id:string;name:string;cat:string;icon:string;qty:string;note?:string;priority?:"Normal"|"Dringend"|"Wenn's passt"|"Angebot";favorite?:boolean};
type QuantityUnit="Stück"|"Liter"|"Gramm"|"Kilogramm";
const quantityUnits:QuantityUnit[]=["Stück","Liter","Gramm","Kilogramm"];
function parseQuantity(value:string){const match=value.trim().match(/^(\d+(?:[.,]\d+)?)\s*(x|stk\.?|stück|l|liter|g|gramm|kg|kilogramm)$/i);if(!match)return{amount:1,unit:"Stück" as QuantityUnit};const unitKey=match[2].toLocaleLowerCase();const unit:QuantityUnit=unitKey==="l"||unitKey==="liter"?"Liter":unitKey==="g"||unitKey==="gramm"?"Gramm":unitKey==="kg"||unitKey==="kilogramm"?"Kilogramm":"Stück";return{amount:Number(match[1].replace(",","."))||1,unit}}
function formatQuantity(amount:number|string,unit:QuantityUnit){return `${Number(String(amount).replace(",","."))||1} ${unit}`}
function incrementQuantity(value:string){const match=value.trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);if(!match)return"2 Stück";const amount=Number(match[1].replace(",","."))||1;const rawUnit=match[2].trim();const unitKey=rawUnit.toLocaleLowerCase();const unit=unitKey==="x"||unitKey==="stk"||unitKey==="stk."||unitKey==="stück"?"Stück":unitKey==="l"||unitKey==="liter"?"Liter":unitKey==="g"||unitKey==="gramm"?"Gramm":unitKey==="kg"||unitKey==="kilogramm"?"Kilogramm":rawUnit;return `${amount+1} ${unit||"Stück"}`}
const products:Item[]=[{id:"milk",name:"Milch",cat:"Milchprodukte",icon:"🥛",qty:"2x"},{id:"eggs",name:"Eier",cat:"Milchprodukte",icon:"🥚",qty:"10 Stück"},{id:"bread",name:"Brot",cat:"Backwaren",icon:"🍞",qty:"1x"},{id:"pasta",name:"Nudeln",cat:"Nudeln & Reis",icon:"🍝",qty:"1 Packung"},{id:"cheese",name:"Käse",cat:"Milchprodukte",icon:"🧀",qty:"1x"},{id:"paper",name:"WC Papier",cat:"Haushalt",icon:"🧻",qty:"1 Packung"}];
const catalog=[{name:"Tomaten",emoji:"🍅",cat:"Obst & Gemüse"},{name:"Äpfel",emoji:"🍎",cat:"Obst & Gemüse"},{name:"Paprika",emoji:"🫑",cat:"Obst & Gemüse"},{name:"Gurken",emoji:"🥒",cat:"Obst & Gemüse"},{name:"Bananen",emoji:"🍌",cat:"Obst & Gemüse"},{name:"Joghurt",emoji:"🥣",cat:"Milchprodukte"},{name:"Baguette",emoji:"🥖",cat:"Backwaren"},{name:"Kaffee",emoji:"☕",cat:"Getränke"},{name:"Reis",emoji:"🍚",cat:"Nudeln & Reis"},{name:"Chips",emoji:"🍿",cat:"Snacks"},{name:"Spülmittel",emoji:"🧴",cat:"Haushalt"},{name:"Huhn",emoji:"🍗",cat:"Fleisch & Fisch"},{name:"Thunfisch",emoji:"🐟",cat:"Fleisch & Fisch"}];
const categories=["Obst & Gemüse","Milchprodukte","Backwaren","Fleisch & Fisch","Nudeln & Reis","Getränke","Snacks","Haushalt","Sonstiges"];
const emojis=["🛍️","🍎","🥛","🍞","🥚","🧀","🥬","🍅","🍝","☕","🧻","🧴","🐟","🍗","🧽","💊"];
const initialCatalog:Item[]=catalog.map((p,index)=>({id:`catalog-${index}`,name:p.name,cat:p.cat,icon:p.emoji,qty:"1x"}));

export default function Einkauf(){
 const [items,setItems,itemsReady]=useHouseholdState<Item[]>("shoppingItems",products);
 const [legacyDone,setLegacyDone,doneReady]=useHouseholdState<string[]>("shoppingDone",[]);
 const [catalogItems,setCatalogItems,catalogReady]=useHouseholdState<Item[]>("shoppingCatalog",initialCatalog);
 const [favoriteNames,setFavoriteNames,favoritesReady]=useHouseholdState<string[]>("shoppingFavorites",[]);
 const [preferences,,preferencesReady]=useHouseholdState<{disableShoppingEditing?:boolean}>("preferences",{});
 const [filter,setFilter]=useState("Alle");
 const [search,setSearch]=useState("");
 const [editor,setEditor]=useState<Item|null>(null);
 const [isNew,setIsNew]=useState(false);
 const [catalogEdit,setCatalogEdit]=useState(false);
 const [customCategory,setCustomCategory]=useState("");
 const [message,setMessage]=useState("");
 const legacyDoneIds=legacyDone;
 useEffect(()=>{if(!itemsReady||!doneReady||!legacyDoneIds.length)return;setItems(current=>current.filter(item=>!legacyDoneIds.includes(item.id)));setLegacyDone([])},[itemsReady,doneReady,legacyDoneIds,setItems,setLegacyDone]);
 const filterItems=(list:Item[])=>list.filter(i=>(filter==="Alle"||i.cat===filter)&&(!search||`${i.name} ${i.cat}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())));
 const open=items;
 const visibleOpen=filterItems(open);
 const favoriteProducts=useMemo(()=>favoriteNames.map(name=>catalogItems.find(p=>p.name.toLocaleLowerCase()===name.toLocaleLowerCase())||items.find(p=>p.name.toLocaleLowerCase()===name.toLocaleLowerCase())).filter((item):item is Item=>Boolean(item)),[favoriteNames,catalogItems,items]);
 const visibleFavorites=filterItems(favoriteProducts);
 const suggestions=catalogItems.filter(p=>!favoriteNames.some(name=>name.toLocaleLowerCase()===p.name.toLocaleLowerCase())&&(filter==="Alle"||filter===p.cat)&&(!search||p.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())));

 function closeEditor(){setEditor(null);setIsNew(false);setCatalogEdit(false)}
 function saveItem(){
  if(!editor?.name.trim()){setMessage("Bitte einen Artikelnamen eingeben.");return;}
  const category=editor.cat==="Eigene Kategorie"?(customCategory.trim()||"Sonstiges"):editor.cat;
  const saved={...editor,name:editor.name.trim(),cat:category,qty:editor.qty.trim()||"1 Stück",priority:editor.priority||"Normal"};
  const updatedFavorites=favoriteNames.filter(name=>name.toLocaleLowerCase()!==editor.name.toLocaleLowerCase()&&name.toLocaleLowerCase()!==saved.name.toLocaleLowerCase());
  setFavoriteNames(saved.favorite?[saved.name,...updatedFavorites]:updatedFavorites);
  if(catalogEdit){setCatalogItems(catalogItems.map(x=>x.id===editor.id?saved:x));setMessage("Produkt gespeichert.")}
  else if(isNew){
   const duplicate=items.find(x=>x.name.toLocaleLowerCase()===saved.name.toLocaleLowerCase());
   if(duplicate){setMessage(`${saved.name} steht schon auf der Liste.`);closeEditor();return;}
   setItems([saved,...items]);
   setCatalogItems(catalogItems.some(x=>x.name.toLocaleLowerCase()===saved.name.toLocaleLowerCase())?catalogItems:[{...saved,id:`catalog-${saved.id}`},...catalogItems]);
   setMessage(`${saved.name} hinzugefügt.`);
  }else{setItems(items.map(x=>x.id===saved.id?saved:x));setCatalogItems(prev=>prev.some(x=>x.name.toLocaleLowerCase()===saved.name.toLocaleLowerCase())?prev.map(x=>x.name.toLocaleLowerCase()===saved.name.toLocaleLowerCase()?{...x,favorite:saved.favorite}:x):saved.favorite?[{...saved,id:`catalog-${saved.id}`},...prev]:prev);setMessage(`${saved.name} aktualisiert.`)}
  closeEditor();setSearch("");
 }
 function beginNew(name=search.trim(),cat=filter==="Alle"?"Sonstiges":filter,icon="🛍️"){
  setCatalogEdit(false);setIsNew(true);setCustomCategory("");
  setEditor({id:crypto.randomUUID(),name,cat,icon,qty:"1 Stück",priority:"Normal",favorite:favoriteNames.some(value=>value.toLocaleLowerCase()===name.toLocaleLowerCase())});
 }
 function addCatalog(product:Item){
  const existing=items.find(x=>x.name.toLocaleLowerCase()===product.name.toLocaleLowerCase());
  if(existing){
   const updated={...existing,qty:incrementQuantity(existing.qty)};
   setItems(items.map(item=>item.id===existing.id?updated:item));
   setMessage(`${existing.name}: Menge jetzt ${updated.qty}.`);
   return;
  }
  const added={...product,id:crypto.randomUUID(),qty:product.qty||"1 Stück",priority:"Normal" as const};
  setItems([added,...items]);setMessage(`${added.name} hinzugefügt.`);
 }
 function editListItem(item:Item){setEditor({...item,favorite:favoriteNames.some(name=>name.toLocaleLowerCase()===item.name.toLocaleLowerCase())});setIsNew(false);setCatalogEdit(false);setCustomCategory(categories.includes(item.cat)?"":item.cat)}
 function editCatalog(item:Item){setCatalogEdit(true);setIsNew(false);setEditor({...item,favorite:favoriteNames.some(name=>name.toLocaleLowerCase()===item.name.toLocaleLowerCase())});setCustomCategory(categories.includes(item.cat)?"":item.cat)}
 function removeFavorite(name:string){setFavoriteNames(favoriteNames.filter(value=>value.toLocaleLowerCase()!==name.toLocaleLowerCase()));setCatalogItems(catalogItems.filter(item=>item.name.toLocaleLowerCase()!==name.toLocaleLowerCase()));setMessage(`${name} aus Favoriten und Produktkatalog entfernt.`)}
 function removeCatalog(id:string){const removed=catalogItems.find(x=>x.id===id);setCatalogItems(catalogItems.filter(x=>x.id!==id));if(removed)setFavoriteNames(favoriteNames.filter(name=>name.toLocaleLowerCase()!==removed.name.toLocaleLowerCase()));closeEditor();setMessage(`${removed?.name||"Produkt"} aus dem Katalog entfernt.`)}
 function removeItem(id:string){setItems(items.filter(x=>x.id!==id));setLegacyDone(legacyDone.filter(x=>x!==id));closeEditor();setMessage("Artikel aus der Liste entfernt.")}
 if(!itemsReady||!doneReady||!catalogReady||!favoritesReady||!preferencesReady)return <div className="page-stack"><Panel><span className="loading-state">Einkaufsliste wird geladen …</span></Panel></div>;
 return <div className="page-stack bring-page">
  <Panel className="bring-board">
   <div className="bring-board-heading"><h2>Einkaufsliste</h2></div>
   <div className="chip-row shopping-categories"><button className={`chip ${filter==="Alle"?"chosen":""}`} onClick={()=>setFilter("Alle")}>Alle</button>{categories.map(c=><button className={`chip ${filter===c?"chosen":""}`} onClick={()=>setFilter(c)} key={c}>{c}</button>)}</div>
   <section className="bring-list-section"><div className="bring-section-heading"><b>Auf eurer Liste</b><small>{open.length}</small></div>{visibleOpen.length?<div className="bring-tile-grid">{visibleOpen.map(item=><article className="bring-tile" key={item.id}><button className="tile-body tile-remove-on-tap" onClick={()=>removeItem(item.id)} aria-label={`${item.name} aus der Liste entfernen`} title="Antippen zum Entfernen"><span className="tile-emoji">{item.icon}</span><b>{item.name}</b><small>{item.qty}</small>{item.priority&&item.priority!=="Normal"&&<em>{item.priority}</em>}</button>{!preferences.disableShoppingEditing&&<><button className="tile-pencil" onClick={()=>{editListItem(item)}} aria-label={`${item.name} bearbeiten`} title="Artikel bearbeiten"><Pencil size={16}/></button><button className="tile-remove" onClick={()=>removeItem(item.id)} aria-label={`${item.name} löschen`} title="Artikel löschen"><Trash2 size={14}/></button></>}</article>)}</div>:<div className="shopping-empty">Liste ist leer.</div>}</section>
   <section className="bring-favorites"><div className="bring-section-heading"><b>Favoriten</b><small>{favoriteProducts.length}</small></div>{visibleFavorites.length?<div className="bring-tile-grid favorite-grid">{visibleFavorites.map(p=>{const listed=open.find(item=>item.name.toLocaleLowerCase()===p.name.toLocaleLowerCase());return <article className="bring-tile favorite-tile" key={p.id}><button className="suggestion-add" onClick={()=>addCatalog(p)} aria-label={listed?`${p.name} schon auf der Liste, Menge ${listed.qty}; antippen erhöht die Menge`:`${p.name} zur Einkaufsliste hinzufügen`}><span className="tile-emoji">{p.icon}</span><b>{p.name}</b><small>{p.cat}</small>{listed&&<span className="suggestion-added-pill">Schon drauf · {listed.qty}</span>}</button>{!preferences.disableShoppingEditing&&<><button className="tile-remove" onClick={()=>removeFavorite(p.name)} aria-label={`${p.name} aus Favoriten löschen`} title="Favorit sofort löschen"><Trash2 size={15}/></button><button className="tile-pencil" onClick={()=>editCatalog(p)} aria-label={`${p.name} bearbeiten`} title="Produkt bearbeiten"><Pencil size={16}/></button></>}</article>})}</div>:<div className="favorite-empty">Noch keine Favoriten</div>}</section>
   <section className="bring-recommendations"><div className="bring-section-heading"><b>{search?"Passende Artikel":"Alle Artikel"}</b><small>{suggestions.length}</small></div><div className="bring-tile-grid suggestion-grid">{suggestions.map(p=>{const listed=open.find(item=>item.name.toLocaleLowerCase()===p.name.toLocaleLowerCase());return <article className="bring-tile suggestion-tile" key={p.id}><button className="suggestion-add" onClick={()=>addCatalog(p)} aria-label={listed?`${p.name} schon auf der Liste, Menge ${listed.qty}; antippen erhöht die Menge`:`${p.name} zur Einkaufsliste hinzufügen`}><span className="tile-emoji">{p.icon}</span><b>{p.name}</b><small>{p.cat}</small>{listed&&<span className="suggestion-added-pill">Schon drauf · {listed.qty}</span>}</button>{!preferences.disableShoppingEditing&&<><button className="tile-remove" onClick={()=>removeCatalog(p.id)} aria-label={`${p.name} aus dem Katalog löschen`} title="Produkt sofort löschen"><Trash2 size={15}/></button><button className="tile-pencil" onClick={()=>editCatalog(p)} aria-label={`${p.name} bearbeiten`} title="Produkt bearbeiten"><Pencil size={16}/></button></>}</article>})}</div></section>
  </Panel>
  <div className="shopping-search-dock"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ich brauche …" onKeyDown={e=>{if(e.key==="Enter"&&search.trim())beginNew(search.trim(),filter==="Alle"?"Sonstiges":filter)}}/><button onClick={()=>beginNew(search.trim())} aria-label="Neuen Artikel hinzufügen"><Plus size={22}/></button></div>
  {editor&&<div className="detail-sheet-scrim" onClick={closeEditor}><section className="detail-sheet" role="dialog" aria-modal="true" aria-labelledby="item-editor-title" onClick={e=>e.stopPropagation()}><div className="sheet-grab"/><div className="sheet-header"><div><small>{isNew?"Neues Produkt":catalogEdit?"Produktkatalog":"Artikeldetails"}</small><h2 id="item-editor-title">{isNew?"Zur Liste hinzufügen":catalogEdit?"Produkt bearbeiten":"Artikel bearbeiten"}</h2></div><button className="sheet-close" onClick={closeEditor} aria-label="Schließen"><X size={19}/></button></div><div className="editor-preview"><span>{editor.icon}</span><b>{editor.name||"Neuer Artikel"}</b><small>{editor.qty||"1 Stück"}</small></div><label className="editor-field">Name<input autoFocus value={editor.name} onChange={e=>setEditor({...editor,name:e.target.value})} placeholder="Produktname"/></label><label className="editor-field">Kategorie<select value={categories.includes(editor.cat)?editor.cat:"Eigene Kategorie"} onChange={e=>setEditor({...editor,cat:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}<option>Eigene Kategorie</option></select></label>{editor.cat==="Eigene Kategorie"&&<label className="editor-field">Eigene Kategorie<input value={customCategory} onChange={e=>setCustomCategory(e.target.value)} placeholder="z. B. Drogerie"/></label>}{(()=>{const quantity=parseQuantity(editor.qty);return <div className="editor-field"><span>Menge</span><div className="quantity-input-row"><input aria-label="Menge" type="number" min="0.01" step="0.01" value={quantity.amount} onChange={e=>setEditor({...editor,qty:formatQuantity(e.target.value,quantity.unit)})}/><select aria-label="Mengeneinheit" value={quantity.unit} onChange={e=>setEditor({...editor,qty:formatQuantity(quantity.amount,e.target.value as QuantityUnit)})}>{quantityUnits.map(unit=><option key={unit}>{unit}</option>)}</select></div></div>})()}<label className="editor-field">Notiz (optional)<input value={editor.note||""} onChange={e=>setEditor({...editor,note:e.target.value})} placeholder="Marke, Sorte oder Hinweis"/></label><label className="favorite-toggle"><input type="checkbox" checked={Boolean(editor.favorite)} onChange={e=>setEditor({...editor,favorite:e.target.checked})}/><span>Als Favorit markieren</span></label><div className="editor-field"><span>Priorität</span><div className="priority-options">{(["Normal","Dringend","Wenn's passt","Angebot"] as const).map(p=><button className={editor.priority===p?"selected":""} onClick={()=>setEditor({...editor,priority:p})} key={p}>{p}</button>)}</div></div><div className="emoji-picker">{emojis.map(icon=><button className={editor.icon===icon?"selected":""} onClick={()=>setEditor({...editor,icon})} key={icon}>{icon}</button>)}</div><div className="sheet-actions">{!isNew&&<button className="delete-item" onClick={()=>catalogEdit?removeCatalog(editor.id):removeItem(editor.id)}><Trash2 size={16}/> Löschen</button>}<button className="button button-primary" onClick={saveItem}><Check size={16}/>{isNew?"Zur Liste hinzufügen":"Speichern"}</button></div></section></div>}
  {message&&<div className="shopping-toast" role="status">{message}<button onClick={()=>setMessage("")}>OK</button></div>}
 </div>
}
