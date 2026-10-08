"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, BookOpen, Check, ChefHat, Heart, Minus, Plus, Search, ShoppingBasket, Users, X } from "lucide-react";
import { useHouseholdState } from "@/lib/use-household-state";
import { localizeRecipeAmount, localizeRecipeIngredient, normalizeRecipeShoppingQuantity } from "@/lib/recipe-localization";
import { matchProductIcon } from "./product-icons";

export type RecipeShoppingItem = { id: string; name: string; cat: string; icon: string; qty: string; note?: string; priority?: "Nichts" | "Dringend" | "Wenn's passt" | "Angebot" | "Normal" | ("Nichts" | "Dringend" | "Wenn's passt" | "Angebot")[]; favorite?: boolean; source?:"recipe"|"offer"; repeatStep?:string };
type RecipeIngredient = { name: string; amount: string; hint?: string };
type Recipe = { id: string; name: string; image: string; category: string; area: string; instructions: string[]; source: string; ingredients: RecipeIngredient[]; portions?: number; own?: boolean; provider?: "mealdb"|"cooklang"; ingredientCount?:number; detailsLoaded?:boolean; locale?:string };
type Offer = { id: string; title: string; unit: string; price: number; oldPrice: number | null; image: string | null; url: string | null; store: string; storeName: string; discount: number | null; condition: string | null };
type OfferResponse = { offers?: Offer[] };
type Props = { items: RecipeShoppingItem[]; setItems: Dispatch<SetStateAction<RecipeShoppingItem[]>>; layout: "tiles" | "list"; onBack?: () => void; onShowProspects?: () => void; embedded?: boolean; active?: boolean };
const tabs = ["Entdecken", "Beliebt", "Meine Rezepte", "Favoriten", "Zur Liste hinzugefügt"] as const;
type RecipeTab = typeof tabs[number];
const pantryWords = ["butter", "kaffee", "wasser", "öl", "oel", "salz", "pfeffer", "zucker", "mehl", "gewürz", "gewuerz", "essig"];
const icons: [string[], string][] = [[ ["tomat"], "🍅"], [["potato", "kartoffel"], "🥔"], [["zwiebel", "onion"], "🧅"], [["butter"], "🧈"], [["milk", "milch"], "🥛"], [["cheese", "käse"], "🧀"], [["cream", "sahne", "obers"], "🥛"], [["egg", "ei"], "🥚"], [["chicken", "huhn", "hähnchen"], "🍗"], [["fish", "fisch"], "🐟"], [["rice", "reis"], "🍚"], [["oil", "öl"], "🫒"], [["garlic", "knoblauch"], "🧄"], [["carrot", "karotte"], "🥕"], [["broccoli", "brokkoli"], "🥦"], [["cabbage", "kohl"], "🥬"], [["pasta", "nudel"], "🍝"], [["bread", "brot"], "🍞"]];
function normalizeIngredientName(raw:string){return localizeRecipeIngredient(raw).name}
function iconFor(name: string) { const known=matchProductIcon(normalizeIngredientName(name));if(known)return known.emoji;const needle = normalizeIngredientName(name).toLocaleLowerCase("de"); return icons.find(entry => entry[0].some(word => needle.includes(word)))?.[1] ?? "🥣"; }
function categoryFor(name: string) { const n = name.toLocaleLowerCase("de"); if (/milch|butter|käse|cheese|cream|sahne|obers|yogurt|joghurt/.test(n)) return "Milchprodukte"; if (/tomat|potato|kartoffel|zwiebel|onion|karotte|carrot|gemüse|broccoli|kohl|salat/.test(n)) return "Obst & Gemüse"; if (/chicken|huhn|fleisch|beef|fish|fisch|lachs/.test(n)) return "Fleisch & Fisch"; if (/rice|reis|pasta|nudel/.test(n)) return "Nudeln & Reis"; if (/bread|brot|mehl/.test(n)) return "Backwaren"; return "Sonstiges"; }
function scaledAmount(raw: string, factor: number) { const match = raw.trim().match(/^((?:\d+\s+)?\d+\/\d+|\d+(?:[.,]\d+)?)(\s*)(.*)$/); if (!match) return localizeRecipeAmount(raw); if (factor === 1) return `${match[1]}${match[2]}${localizeRecipeAmount(match[3])}`; const source = match[1].trim().split(/\s+/); const last = source.pop()!; let fraction: number; if (last.includes("/")) { const [numerator, denominator] = last.split("/"); fraction = Number(numerator) / Number(denominator); } else fraction = Number(last.replace(",", ".")); const value = ((Number(source[0]) || 0) + fraction) * factor; const amount = Number.isInteger(value) ? `${value}` : value.toLocaleString("de-AT", { maximumFractionDigits: 2 }); return `${amount}${match[2]}${localizeRecipeAmount(match[3])}`; }
function mergedQuantity(oldValue: string, nextValue: string) { const pattern = /^(\d+(?:[.,]\d+)?)\s*(.*)$/; const oldMatch = oldValue.match(pattern); const newMatch = nextValue.match(pattern); if (oldMatch && newMatch && oldMatch[2].trim().toLocaleLowerCase("de") === newMatch[2].trim().toLocaleLowerCase("de")) { const total = Number(oldMatch[1].replace(",", ".")) + Number(newMatch[1].replace(",", ".")); return `${Number.isInteger(total) ? total : total.toLocaleString("de-AT", { maximumFractionDigits: 2 })}${oldMatch[2] ? ` ${oldMatch[2].trim()}` : ""}`; } return oldValue && nextValue ? `${oldValue} + ${nextValue}` : oldValue || nextValue; }
function pantryDefault(name: string) { const value = name.toLocaleLowerCase("de"); return !pantryWords.some(word => value.includes(word)); }
function stepIcon(step:string){const value=step.toLocaleLowerCase("de");if(/ofen|back|vorheiz/.test(value))return "🔥";if(/koch|köchel|sied|wasser/.test(value))return "🍲";if(/schneid|hack|würfel|raspel/.test(value))return "🔪";if(/brat|pfanne|anbrat/.test(value))return "🍳";if(/rühr|misch|vermeng|verquirl/.test(value))return "🥣";if(/servier|anricht/.test(value))return "🍽️";return "👩‍🍳";}
function RecipePhoto({src,alt,detail=false}:{src:string;alt:string;detail?:boolean}){const[failed,setFailed]=useState(false);if(!src||failed)return <span className={detail?"recipe-detail-image-placeholder":"recipe-placeholder"}><ChefHat size={detail?34:30}/><small>Rezeptbild nicht verfügbar</small></span>;return <img className={detail?"recipe-detail-image":undefined} src={src} alt={alt} loading="lazy" onError={()=>setFailed(true)}/>}
function newId() { return `recipe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

export function RecipeInspiration({ items, setItems, layout, onBack, onShowProspects, embedded=false, active=true }: Props) {
  const [tab, setTab] = useState<RecipeTab>("Entdecken");
  const [recipes, setRecipes, recipesReady] = useHouseholdState<Recipe[]>("recipeLibrary", []);
  const [ownRecipes, setOwnRecipes, ownReady] = useHouseholdState<Recipe[]>("myRecipes", []);
  const [favoriteIds, setFavoriteIds, favoritesReady] = useHouseholdState<string[]>("recipeFavorites", []);
  const [usedCounts, setUsedCounts, countsReady] = useHouseholdState<Record<string, number>>("recipeUseCounts", {});
  const [addedRecipeIds, setAddedRecipeIds, addedReady] = useHouseholdState<string[]>("addedRecipeIds", []);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [search, setSearch] = useState("");
  const [visibleRecipes, setVisibleRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [instructionsOpen,setInstructionsOpen]=useState(false);
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [servings, setServings] = useState(4);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [source, setSource] = useState("");
  const searchTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const searchRequest=useRef(0);

  async function loadRecipes(query = "") {
    const request=++searchRequest.current;setBusy(true); setError("");
    try {
      const response = await fetch(`/api/recipes${query ? `?q=${encodeURIComponent(query)}` : ""}`, { cache: "no-store", signal: AbortSignal.timeout(12000) });
      const data = await response.json() as { recipes?: Recipe[]; error?: string };
      if(request!==searchRequest.current)return;
      if (!response.ok) throw new Error(data.error || "Rezepte konnten nicht geladen werden.");
      const found = data.recipes ?? [];
      setVisibleRecipes(found);
      if (found.length) setRecipes(current => [...new Map([...found, ...current].map(recipe => [recipe.id, recipe])).values()]);
      if (!found.length) setError(query ? "Keine Rezepte gefunden. Suche mit einem deutschen oder englischen Gerichtsnamen." : "Gerade sind keine Rezepte erreichbar.");
    } catch (cause) { if(request===searchRequest.current){setVisibleRecipes([]); setError(cause instanceof Error ? cause.message : "Rezeptquelle ist gerade nicht erreichbar.");} }
    finally { if(request===searchRequest.current)setBusy(false); }
  }
  useEffect(() => { void loadRecipes(); fetch("/api/prospekte/angebote", { cache: "no-store" }).then(response => response.ok ? response.json() as Promise<OfferResponse> : null).then(data => setOffers(data?.offers ?? [])).catch(() => {}); }, []);

  const allRecipes = useMemo(() => [...new Map([...ownRecipes, ...visibleRecipes, ...recipes].map(recipe => [recipe.id, recipe])).values()], [ownRecipes, recipes, visibleRecipes]);
  const shown = useMemo(() => {
    if (tab === "Meine Rezepte") return ownRecipes;
    if (tab === "Zur Liste hinzugefügt") return allRecipes.filter(recipe => addedRecipeIds.includes(recipe.id));
    if (tab === "Favoriten") return allRecipes.filter(recipe => favoriteIds.includes(recipe.id));
    if (tab === "Beliebt") return allRecipes.filter(recipe => (usedCounts[recipe.id] ?? 0) > 0).sort((a, b) => (usedCounts[b.id] ?? 0) - (usedCounts[a.id] ?? 0));
    return visibleRecipes;
  }, [addedRecipeIds, allRecipes, favoriteIds, ownRecipes, tab, usedCounts, visibleRecipes]);

  async function openRecipe(recipe: Recipe) {
    const basis = Math.max(1, recipe.portions ?? 4);
    setSelected(recipe); setServings(basis); setDetailError("");setInstructionsOpen(false);
    setSelectedIngredients(recipe.ingredients.map((ingredient, index) => `${recipe.id}:${index}`).filter((_, index) => pantryDefault(recipe.ingredients[index].name)));
    if(recipe.provider!=="cooklang"||recipe.detailsLoaded)return;
    setDetailBusy(true);
    try{const response=await fetch(`/api/recipes?id=${encodeURIComponent(recipe.id)}`,{cache:"no-store",signal:AbortSignal.timeout(15000)});const data=await response.json() as {recipe?:Recipe;error?:string};if(!response.ok||!data.recipe)throw new Error(data.error||"Rezeptdetails konnten nicht geladen werden.");const detail=data.recipe;setSelected(current=>current?.id===recipe.id?detail:current);setServings(Math.max(1,detail.portions??4));setSelectedIngredients(detail.ingredients.map((ingredient,index)=>`${detail.id}:${index}`).filter((_,index)=>pantryDefault(detail.ingredients[index].name)));setRecipes(current=>[...new Map([detail,...current].map(entry=>[entry.id,entry])).values()]);setVisibleRecipes(current=>current.map(entry=>entry.id===detail.id?detail:entry));setOwnRecipes(current=>current.map(entry=>entry.id===detail.id?detail:entry));}catch(cause){setDetailError(cause instanceof Error?cause.message:"Rezeptdetails konnten nicht geladen werden.")}finally{setDetailBusy(false)}
  }
  function toggleIngredient(key: string) { setSelectedIngredients(current => current.includes(key) ? current.filter(value => value !== key) : [...current, key]); }
  function isOffer(name: string) {
    const normalize = (value: string) => value.toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
    const wanted = normalize(name);
    if (!wanted || wanted.length < 4) return null;
    return offers.find(offer => { const title = normalize(offer.title); return title === wanted || (wanted.length >= 6 && (title.includes(wanted) || wanted.includes(title))); }) ?? null;
  }
  function addSelected() {
    if (!selected || selectedIngredients.length === 0) return;
    const factor = servings / Math.max(1, selected.portions ?? 4);
    const additions = selected.ingredients.map((ingredient, index) => ({ ingredient, index })).filter(entry => selectedIngredients.includes(`${selected.id}:${entry.index}`));
    setItems(current => {
      const next = [...current];
      for (const { ingredient, index } of additions) {
        const localized=localizeRecipeIngredient(ingredient.name);const name = localized.name; if (!name) continue;
        const quantity = normalizeRecipeShoppingQuantity(scaledAmount(ingredient.amount || "1 Stück", factor));
        const match = next.find(item => item.name.toLocaleLowerCase("de") === name.toLocaleLowerCase("de"));
        const ingredientNote=[localized.hint||ingredient.hint,`Für ${selected.name}`].filter(Boolean).join(" · ");
        if (match) {
          const at = next.findIndex(item => item.id === match.id);
          next[at] = { ...match, qty: mergedQuantity(match.qty, quantity), note: [match.note,ingredientNote].filter(Boolean).join(" · "),source:match.source??"recipe",repeatStep:match.repeatStep??"1 Stück" };
        } else next.unshift({ id: newId(), name, cat: categoryFor(name), icon: iconFor(name), qty: quantity, note: ingredientNote, priority: ["Nichts"],source:"recipe",repeatStep:"1 Stück" });
      }
      return next;
    });
    setUsedCounts(current => ({ ...current, [selected.id]: (current[selected.id] ?? 0) + 1 }));
    setAddedRecipeIds(current => current.includes(selected.id) ? current : [selected.id, ...current]);
    setSelected(null);
  }
  function toggleFavorite(recipe: Recipe) { setFavoriteIds(current => current.includes(recipe.id) ? current.filter(id => id !== recipe.id) : [recipe.id, ...current]); }
  function saveOwnRecipe() {
    const name = recipeName.trim();
    const ingredients = recipeIngredients.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
      const match = line.match(/^((?:\d+(?:[.,]\d+)?\s*)?(?:g|kg|ml|l|EL|TL|Stk\.?|Stück)?\s*)?(.+)$/i);
      const localized=localizeRecipeIngredient((match?.[2]??line).trim());
      return { amount: localizeRecipeAmount((match?.[1] ?? "").trim()), name: localized.name, hint: localized.hint };
    }).filter(ingredient => ingredient.name);
    if (!name || !ingredients.length) return;
    const recipe: Recipe = { id: newId(), name, image: "", category: "Eigenes Rezept", area: "", ingredients, instructions: instructions.split(/\r?\n/).map(line => line.trim()).filter(Boolean), source: source.trim(), portions: 4, own: true };
    setOwnRecipes(current => [recipe, ...current]); setRecipes(current => [recipe, ...current]);
    setRecipeName(""); setRecipeIngredients(""); setInstructions(""); setSource(""); setCreateOpen(false); setTab("Meine Rezepte");
  }

  useEffect(()=>{if(embedded||!active)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=previous}},[active,embedded]);
  if (!recipesReady || !ownReady || !favoritesReady || !countsReady || !addedReady) { const loading=<section className={`recipe-module ${embedded?"recipe-embedded":"recipe-fullscreen"}`}><p className="quiet-note">Rezepte werden geladen …</p></section>;return embedded?loading:typeof document==="undefined"?null:createPortal(loading,document.body); }
  const content=<section className={`recipe-module ${embedded?"recipe-embedded":"recipe-fullscreen"}`} aria-label="Rezepte und Inspiration">
    <div className="recipe-module-heading"><div><span><ChefHat size={15}/> Rezepte & Inspiration</span><h3>Was kochen wir heute?</h3></div><div>{!embedded&&<button className="recipe-back-button" onClick={onBack}><ArrowLeft size={15}/> Einkaufsliste</button>}<button className="recipe-create-button" onClick={() => setCreateOpen(true)}><Plus size={16}/> Eigenes Rezept</button></div></div>
    <div className="recipe-tabs" role="tablist">{tabs.map(value => <button key={value} role="tab" aria-selected={tab === value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{value}{value === "Favoriten" && favoriteIds.length > 0 ? ` · ${favoriteIds.length}` : ""}</button>)}</div>
    {tab === "Entdecken" && <form className="recipe-search" onSubmit={event => { event.preventDefault(); if(searchTimer.current)clearTimeout(searchTimer.current);void loadRecipes(search.trim()); }}><Search size={16}/><input value={search} onChange={event => {const value=event.target.value;setSearch(value);if(searchTimer.current)clearTimeout(searchTimer.current);if(value.trim().length>=2)searchTimer.current=setTimeout(()=>void loadRecipes(value.trim()),450);else if(!value.trim())void loadRecipes()}} placeholder="Gericht auf Deutsch suchen, z. B. Gulasch oder Auflauf"/><button type="submit">Suchen</button></form>}
    {tab==="Entdecken"&&search.trim()&&!busy&&visibleRecipes.length>0&&<p className="recipe-subtitle">{visibleRecipes.length} passende Rezepte aus mehreren Quellen gefunden.</p>}
    {tab === "Beliebt" && <p className="recipe-subtitle">Rezepte, die ihr bereits in eure Einkaufsliste übernommen habt.</p>}
    <div className={`recipe-card-grid ${layout === "list" ? "recipe-card-list" : ""}`}>
      {shown.map(recipe => <article className="recipe-card" key={recipe.id}><button className="recipe-card-open" onClick={() => openRecipe(recipe)}><RecipePhoto src={recipe.image} alt={recipe.name}/><span className="recipe-card-copy"><small>{recipe.own ? "Euer Rezept" : recipe.provider==="cooklang"?"Cooklang-Rezept · "+recipe.category:[recipe.area, recipe.category].filter(Boolean).join(" · ") || "Rezept"}</small><b>{recipe.name}</b><span>{recipe.ingredientCount??recipe.ingredients.length ? `${recipe.ingredientCount??recipe.ingredients.length} Zutaten` : "Zutaten & Zubereitung öffnen"}{usedCounts[recipe.id] ? ` · ${usedCounts[recipe.id]}× übernommen` : ""}</span></span></button><div className="recipe-card-actions">{addedRecipeIds.includes(recipe.id)&&<span className="recipe-added-badge"><Check size={11}/> Zur Liste hinzugefügt</span>}{isOffer(recipe.name) && (onShowProspects?<button type="button" className="recipe-offer-badge" onClick={onShowProspects}>Passendes Angebot</button>:<a className="recipe-offer-badge" href="/prospekte">Passendes Angebot</a>)}<button className={`recipe-heart ${favoriteIds.includes(recipe.id) ? "active" : ""}`} onClick={() => toggleFavorite(recipe)} aria-label="Favorit umschalten"><Heart size={17} fill={favoriteIds.includes(recipe.id) ? "currentColor" : "none"}/></button></div></article>)}
      {!shown.length && <div className="recipe-empty">{busy ? "Rezepte werden geladen …" : error || (tab === "Meine Rezepte" ? "Hier könnt ihr eure eigenen Rezepte speichern." : tab === "Beliebt" ? "Noch kein Rezept übernommen. Entdeckt ein Rezept und fügt Zutaten zur Liste hinzu." : "Hier sind noch keine Rezepte." )}</div>}
    </div>
    {busy && shown.length > 0 && <small className="recipe-loading-note">Weitere Rezepte werden geladen …</small>}
    <small className="recipe-source-credit">Rezeptsuche: <a href="https://www.themealdb.com/" target="_blank" rel="noreferrer">TheMealDB</a> und <a href="https://recipes.cooklang.org/about" target="_blank" rel="noreferrer">Cooklang Federation</a>. Rezepte öffnen die jeweilige Originalquelle.</small>

    {selected && <div className="recipe-detail-scrim" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}><section className="recipe-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="recipe-detail-title"><header className="recipe-detail-header"><div><small>{selected.own ? "Eigenes WG-Rezept" : [selected.area, selected.category].filter(Boolean).join(" · ")}</small><h3 id="recipe-detail-title">{selected.name}</h3></div><button className="sheet-close" onClick={() => setSelected(null)} aria-label="Schließen"><X size={18}/></button></header><div className="recipe-detail-scroll">{<RecipePhoto src={selected.image} alt={selected.name} detail/>} {detailBusy&&<p className="recipe-detail-loading">Rezept, Zutaten und Schritte werden geladen …</p>}{detailError&&<p className="recipe-detail-error">{detailError}</p>}<div className="recipe-portions"><span><Users size={16}/> Portionen <b>{servings}</b></span><div><button onClick={() => setServings(value => Math.max(1, value - 1))} aria-label="Portionen verringern"><Minus size={15}/></button><button onClick={() => setServings(value => Math.min(20, value + 1))} aria-label="Portionen erhöhen"><Plus size={15}/></button></div></div>{(()=>{const pantry=selected.ingredients.map((ingredient,index)=>({ingredient,index})).filter(({ingredient})=>pantryWords.some(word=>ingredient.name.toLocaleLowerCase("de").includes(word)));const regular=selected.ingredients.map((ingredient,index)=>({ingredient,index})).filter(({ingredient})=>!pantryWords.some(word=>ingredient.name.toLocaleLowerCase("de").includes(word)));const renderIngredient=({ingredient,index}:{ingredient:RecipeIngredient;index:number})=>{const key=`${selected.id}:${index}`;const checked=selectedIngredients.includes(key);const offer=isOffer(ingredient.name);return <button type="button" key={key} aria-pressed={checked} className={`recipe-ingredient ${checked?"selected":""}`} onClick={()=>toggleIngredient(key)}><span className="recipe-ingredient-icon">{iconFor(ingredient.name)}</span><span className="recipe-ingredient-copy"><b>{ingredient.name}</b>{ingredient.hint&&<small>{ingredient.hint}</small>}{offer&&<small className="recipe-ingredient-offer">Im Angebot: {offer.price.toLocaleString("de-AT",{style:"currency",currency:"EUR"})} · {offer.storeName}</small>}</span><span className="recipe-ingredient-amount">{scaledAmount(ingredient.amount,servings/Math.max(1,selected.portions??4))}</span>{checked&&<Check className="recipe-ingredient-check" size={16}/>}</button>};return <><div className="recipe-ingredient-heading"><h4>Zutaten auswählen</h4><small>Grau = bleibt weg · antippen zum Hinzufügen</small></div><div className={`recipe-ingredients ${layout==="list"?"recipe-ingredients-list":""}`}>{regular.map(renderIngredient)}</div>{pantry.length>0&&<><div className="recipe-ingredient-heading recipe-pantry-heading"><h4>🏡 Könntest du schon haben</h4><small>Vorrat ist zuerst abgewählt</small></div><div className={`recipe-ingredients recipe-pantry-ingredients ${layout==="list"?"recipe-ingredients-list":""}`}>{pantry.map(renderIngredient)}</div></>}</>})()}{selected.instructions.length>0&&<button type="button" className="recipe-instructions-open" onClick={()=>setInstructionsOpen(true)}><BookOpen size={16}/><span><b>Zubereitung ansehen</b><small>{selected.instructions.length} übersichtliche Schritte</small></span><ArrowLeft size={15}/></button>}{selected.source&&<a className="recipe-original-link" href={selected.source} target="_blank" rel="noreferrer">Originalrezept ansehen <BookOpen size={14}/></a>}<small className="recipe-portion-hint">Mengen werden proportional auf die gewählte Portionszahl angepasst.</small></div><footer className="recipe-detail-footer"><span>{detailBusy?"Rezept wird geladen …":`${selectedIngredients.length} von ${selected.ingredients.length} ausgewählt`}</span><button className="recipe-add-button" disabled={detailBusy||!selectedIngredients.length} onClick={addSelected}><ShoppingBasket size={17}/> {detailBusy?"Lädt …":`${selectedIngredients.length} Zutaten zur Einkaufsliste`}</button></footer></section></div>}

    {instructionsOpen&&selected&&createPortal(<div className="recipe-instructions-scrim" onMouseDown={event=>{if(event.target===event.currentTarget)setInstructionsOpen(false)}}><section className="recipe-instructions-dialog" role="dialog" aria-modal="true" aria-labelledby="recipe-instructions-title"><header><div><small>Schritt für Schritt</small><h2 id="recipe-instructions-title">{selected.name}</h2></div><button className="sheet-close" onClick={()=>setInstructionsOpen(false)} aria-label="Schließen"><X size={19}/></button></header><div className="recipe-instructions-content"><ol>{selected.instructions.map((step,index)=><li key={`${selected.id}-step-${index}`}><span className="recipe-step-number">{index+1}</span><div><span className="recipe-instruction-icon">{stepIcon(step)}</span><p>{step}</p></div></li>)}</ol></div><footer><button className="recipe-add-button" onClick={()=>setInstructionsOpen(false)}>Fertig</button></footer></section></div>,document.body)}
    {createOpen && createPortal(<div className="recipe-detail-scrim" onMouseDown={event => { if (event.target === event.currentTarget) setCreateOpen(false); }}><section className="recipe-create-dialog" role="dialog" aria-modal="true" aria-labelledby="recipe-create-title"><header className="recipe-detail-header"><div><small>Für eure WG</small><h3 id="recipe-create-title">Rezept speichern</h3></div><button className="sheet-close" onClick={() => setCreateOpen(false)} aria-label="Schließen"><X size={18}/></button></header><div className="recipe-create-fields"><label>Name<input value={recipeName} onChange={event => setRecipeName(event.target.value)} placeholder="z. B. Gemüselasagne"/></label><label>Zutaten, eine pro Zeile<textarea value={recipeIngredients} onChange={event => setRecipeIngredients(event.target.value)} placeholder={'2 Tomaten\n250 g Nudeln\n1 EL Olivenöl'} rows={6}/></label><label>Zubereitung (optional)<textarea value={instructions} onChange={event => setInstructions(event.target.value)} rows={4} placeholder="Ein Schritt pro Zeile"/></label><label>Rezeptlink (optional)<input value={source} onChange={event => setSource(event.target.value)} placeholder="https://…"/></label></div><footer className="recipe-detail-footer"><button className="recipe-back-button" onClick={() => setCreateOpen(false)}>Abbrechen</button><button className="recipe-add-button" disabled={!recipeName.trim() || !recipeIngredients.trim()} onClick={saveOwnRecipe}><Check size={16}/> Rezept speichern</button></footer></section></div>, document.body)}
  </section>;
  return embedded?content:typeof document==="undefined"?null:createPortal(content,document.body);
}
