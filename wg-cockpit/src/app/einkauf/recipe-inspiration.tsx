"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, BookOpen, Check, ChefHat, Heart, Minus, Plus, Search, ShoppingBasket, Users, X } from "lucide-react";
import { useHouseholdState } from "@/lib/use-household-state";

export type RecipeShoppingItem = { id: string; name: string; cat: string; icon: string; qty: string; note?: string; priority?: "Nichts" | "Dringend" | "Wenn's passt" | "Angebot" | "Normal" | ("Nichts" | "Dringend" | "Wenn's passt" | "Angebot")[]; favorite?: boolean };
type RecipeIngredient = { name: string; amount: string };
type Recipe = { id: string; name: string; image: string; category: string; area: string; instructions: string[]; source: string; ingredients: RecipeIngredient[]; portions?: number; own?: boolean };
type Offer = { id: string; title: string; unit: string; price: number; oldPrice: number | null; image: string | null; url: string | null; store: string; storeName: string; discount: number | null; condition: string | null };
type OfferResponse = { offers?: Offer[] };
type Props = { items: RecipeShoppingItem[]; setItems: Dispatch<SetStateAction<RecipeShoppingItem[]>>; layout: "tiles" | "list"; onBack: () => void };
const tabs = ["Entdecken", "Beliebt", "Meine Rezepte", "Favoriten"] as const;
type RecipeTab = typeof tabs[number];
const pantryWords = ["butter", "kaffee", "wasser", "öl", "oel", "salz", "pfeffer", "zucker", "mehl", "gewürz", "gewuerz", "essig"];
const icons: [string[], string][] = [[ ["tomat"], "🍅"], [["potato", "kartoffel"], "🥔"], [["zwiebel", "onion"], "🧅"], [["butter"], "🧈"], [["milk", "milch"], "🥛"], [["cheese", "käse"], "🧀"], [["cream", "sahne", "obers"], "🥛"], [["egg", "ei"], "🥚"], [["chicken", "huhn", "hähnchen"], "🍗"], [["fish", "fisch"], "🐟"], [["rice", "reis"], "🍚"], [["oil", "öl"], "🫒"], [["garlic", "knoblauch"], "🧄"], [["carrot", "karotte"], "🥕"], [["broccoli", "brokkoli"], "🥦"], [["cabbage", "kohl"], "🥬"], [["pasta", "nudel"], "🍝"], [["bread", "brot"], "🍞"]];
function iconFor(name: string) { const needle = name.toLocaleLowerCase("de"); return icons.find(entry => entry[0].some(word => needle.includes(word)))?.[1] ?? "🥣"; }
function categoryFor(name: string) { const n = name.toLocaleLowerCase("de"); if (/milch|butter|käse|cheese|cream|sahne|obers|yogurt|joghurt/.test(n)) return "Milchprodukte"; if (/tomat|potato|kartoffel|zwiebel|onion|karotte|carrot|gemüse|broccoli|kohl|salat/.test(n)) return "Obst & Gemüse"; if (/chicken|huhn|fleisch|beef|fish|fisch|lachs/.test(n)) return "Fleisch & Fisch"; if (/rice|reis|pasta|nudel/.test(n)) return "Nudeln & Reis"; if (/bread|brot|mehl/.test(n)) return "Backwaren"; return "Sonstiges"; }
function scaledAmount(raw: string, factor: number) { const match = raw.trim().match(/^((?:\d+\s+)?\d+\/\d+|\d+(?:[.,]\d+)?)(\s*)(.*)$/); if (!match || factor === 1) return raw; const source = match[1].trim().split(/\s+/); const last = source.pop()!; let fraction: number; if (last.includes("/")) { const [numerator, denominator] = last.split("/"); fraction = Number(numerator) / Number(denominator); } else fraction = Number(last.replace(",", ".")); const value = ((Number(source[0]) || 0) + fraction) * factor; const amount = Number.isInteger(value) ? `${value}` : value.toLocaleString("de-AT", { maximumFractionDigits: 2 }); return `${amount}${match[2]}${match[3]}`; }
function mergedQuantity(oldValue: string, nextValue: string) { const pattern = /^(\d+(?:[.,]\d+)?)\s*(.*)$/; const oldMatch = oldValue.match(pattern); const newMatch = nextValue.match(pattern); if (oldMatch && newMatch && oldMatch[2].trim().toLocaleLowerCase("de") === newMatch[2].trim().toLocaleLowerCase("de")) { const total = Number(oldMatch[1].replace(",", ".")) + Number(newMatch[1].replace(",", ".")); return `${Number.isInteger(total) ? total : total.toLocaleString("de-AT", { maximumFractionDigits: 2 })}${oldMatch[2] ? ` ${oldMatch[2].trim()}` : ""}`; } return oldValue && nextValue ? `${oldValue} + ${nextValue}` : oldValue || nextValue; }
function pantryDefault(name: string) { const value = name.toLocaleLowerCase("de"); return !pantryWords.some(word => value.includes(word)); }
function newId() { return `recipe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

export function RecipeInspiration({ items, setItems, layout, onBack }: Props) {
  const [tab, setTab] = useState<RecipeTab>("Entdecken");
  const [recipes, setRecipes, recipesReady] = useHouseholdState<Recipe[]>("recipeLibrary", []);
  const [ownRecipes, setOwnRecipes, ownReady] = useHouseholdState<Recipe[]>("myRecipes", []);
  const [favoriteIds, setFavoriteIds, favoritesReady] = useHouseholdState<string[]>("recipeFavorites", []);
  const [usedCounts, setUsedCounts, countsReady] = useHouseholdState<Record<string, number>>("recipeUseCounts", {});
  const [offers, setOffers] = useState<Offer[]>([]);
  const [search, setSearch] = useState("");
  const [visibleRecipes, setVisibleRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(4);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [source, setSource] = useState("");

  async function loadRecipes(query = "") {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/recipes${query ? `?q=${encodeURIComponent(query)}` : ""}`, { cache: "no-store", signal: AbortSignal.timeout(12000) });
      const data = await response.json() as { recipes?: Recipe[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Rezepte konnten nicht geladen werden.");
      const found = data.recipes ?? [];
      setVisibleRecipes(found);
      if (found.length) setRecipes(current => [...new Map([...found, ...current].map(recipe => [recipe.id, recipe])).values()]);
      if (!found.length) setError(query ? "Keine Rezepte gefunden. Suche mit einem deutschen oder englischen Gerichtsnamen." : "Gerade sind keine Rezepte erreichbar.");
    } catch (cause) { setVisibleRecipes([]); setError(cause instanceof Error ? cause.message : "Rezeptquelle ist gerade nicht erreichbar."); }
    finally { setBusy(false); }
  }
  useEffect(() => { void loadRecipes(); fetch("/api/prospekte/angebote", { cache: "no-store" }).then(response => response.ok ? response.json() as Promise<OfferResponse> : null).then(data => setOffers(data?.offers ?? [])).catch(() => {}); }, []);

  const allRecipes = useMemo(() => [...new Map([...ownRecipes, ...visibleRecipes, ...recipes].map(recipe => [recipe.id, recipe])).values()], [ownRecipes, recipes, visibleRecipes]);
  const shown = useMemo(() => {
    if (tab === "Meine Rezepte") return ownRecipes;
    if (tab === "Favoriten") return allRecipes.filter(recipe => favoriteIds.includes(recipe.id));
    if (tab === "Beliebt") return allRecipes.filter(recipe => (usedCounts[recipe.id] ?? 0) > 0).sort((a, b) => (usedCounts[b.id] ?? 0) - (usedCounts[a.id] ?? 0));
    return visibleRecipes;
  }, [allRecipes, favoriteIds, ownRecipes, tab, usedCounts, visibleRecipes]);

  function openRecipe(recipe: Recipe) {
    const basis = Math.max(1, recipe.portions ?? 4);
    setSelected(recipe); setServings(basis);
    setSelectedIngredients(recipe.ingredients.map((ingredient, index) => `${recipe.id}:${index}`).filter((_, index) => pantryDefault(recipe.ingredients[index].name)));
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
        const name = ingredient.name.trim(); if (!name) continue;
        const quantity = scaledAmount(ingredient.amount || "1 Stück", factor);
        const match = next.find(item => item.name.toLocaleLowerCase("de") === name.toLocaleLowerCase("de"));
        if (match) {
          const at = next.findIndex(item => item.id === match.id);
          next[at] = { ...match, qty: mergedQuantity(match.qty, quantity), note: match.note || `Für ${selected.name}` };
        } else next.unshift({ id: newId(), name, cat: categoryFor(name), icon: iconFor(name), qty: quantity, note: `Für ${selected.name}`, priority: ["Nichts"] });
      }
      return next;
    });
    setUsedCounts(current => ({ ...current, [selected.id]: (current[selected.id] ?? 0) + 1 }));
    setSelected(null);
  }
  function toggleFavorite(recipe: Recipe) { setFavoriteIds(current => current.includes(recipe.id) ? current.filter(id => id !== recipe.id) : [recipe.id, ...current]); }
  function saveOwnRecipe() {
    const name = recipeName.trim();
    const ingredients = recipeIngredients.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
      const match = line.match(/^((?:\d+(?:[.,]\d+)?\s*)?(?:g|kg|ml|l|EL|TL|Stk\.?|Stück)?\s*)?(.+)$/i);
      return { amount: (match?.[1] ?? "").trim(), name: (match?.[2] ?? line).trim() };
    }).filter(ingredient => ingredient.name);
    if (!name || !ingredients.length) return;
    const recipe: Recipe = { id: newId(), name, image: "", category: "Eigenes Rezept", area: "", ingredients, instructions: instructions.split(/\r?\n/).map(line => line.trim()).filter(Boolean), source: source.trim(), portions: 4, own: true };
    setOwnRecipes(current => [recipe, ...current]); setRecipes(current => [recipe, ...current]);
    setRecipeName(""); setRecipeIngredients(""); setInstructions(""); setSource(""); setCreateOpen(false); setTab("Meine Rezepte");
  }

  if (!recipesReady || !ownReady || !favoritesReady || !countsReady) return <div className="recipe-module"><p className="quiet-note">Rezepte werden geladen …</p></div>;
  return <section className="recipe-module" aria-label="Rezepte und Inspiration">
    <div className="recipe-module-heading"><div><span><ChefHat size={15}/> Rezepte & Inspiration</span><h3>Was kochen wir heute?</h3></div><div><button className="recipe-back-button" onClick={onBack}><ArrowLeft size={15}/> Einkaufsliste</button><button className="recipe-create-button" onClick={() => setCreateOpen(true)}><Plus size={16}/> Eigenes Rezept</button></div></div>
    <div className="recipe-tabs" role="tablist">{tabs.map(value => <button key={value} role="tab" aria-selected={tab === value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{value}{value === "Favoriten" && favoriteIds.length > 0 ? ` · ${favoriteIds.length}` : ""}</button>)}</div>
    {tab === "Entdecken" && <form className="recipe-search" onSubmit={event => { event.preventDefault(); void loadRecipes(search.trim()); }}><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Gericht suchen, z. B. Pasta oder Auflauf"/><button type="submit">Suchen</button></form>}
    {tab === "Beliebt" && <p className="recipe-subtitle">Rezepte, die ihr bereits in eure Einkaufsliste übernommen habt.</p>}
    <div className={`recipe-card-grid ${layout === "list" ? "recipe-card-list" : ""}`}>
      {shown.map(recipe => <article className="recipe-card" key={recipe.id}><button className="recipe-card-open" onClick={() => openRecipe(recipe)}>{recipe.image ? <img src={recipe.image} alt="" loading="lazy"/> : <span className="recipe-placeholder"><ChefHat size={30}/></span>}<span className="recipe-card-copy"><small>{recipe.own ? "Euer Rezept" : [recipe.area, recipe.category].filter(Boolean).join(" · ") || "Rezept"}</small><b>{recipe.name}</b><span>{recipe.ingredients.length} Zutaten{usedCounts[recipe.id] ? ` · ${usedCounts[recipe.id]}× übernommen` : ""}</span></span></button><div className="recipe-card-actions">{isOffer(recipe.name) && <a className="recipe-offer-badge" href="/prospekte">Passendes Angebot</a>}<button className={`recipe-heart ${favoriteIds.includes(recipe.id) ? "active" : ""}`} onClick={() => toggleFavorite(recipe)} aria-label="Favorit umschalten"><Heart size={17} fill={favoriteIds.includes(recipe.id) ? "currentColor" : "none"}/></button></div></article>)}
      {!shown.length && <div className="recipe-empty">{busy ? "Rezepte werden geladen …" : error || (tab === "Meine Rezepte" ? "Hier könnt ihr eure eigenen Rezepte speichern." : tab === "Beliebt" ? "Noch kein Rezept übernommen. Entdeckt ein Rezept und fügt Zutaten zur Liste hinzu." : "Hier sind noch keine Rezepte." )}</div>}
    </div>
    {busy && shown.length > 0 && <small className="recipe-loading-note">Weitere Rezepte werden geladen …</small>}
    <small className="recipe-source-credit">Rezeptdaten und Bilder: <a href="https://www.themealdb.com/" target="_blank" rel="noreferrer">TheMealDB</a>. Eigene Rezepte bleiben in eurem WG-Cockpit gespeichert.</small>

    {selected && <div className="recipe-detail-scrim" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}><section className="recipe-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="recipe-detail-title"><header className="recipe-detail-header"><div><small>{selected.own ? "Eigenes WG-Rezept" : [selected.area, selected.category].filter(Boolean).join(" · ")}</small><h3 id="recipe-detail-title">{selected.name}</h3></div><button className="sheet-close" onClick={() => setSelected(null)} aria-label="Schließen"><X size={18}/></button></header><div className="recipe-detail-scroll">{selected.image && <img className="recipe-detail-image" src={selected.image} alt={selected.name}/>}<div className="recipe-portions"><span><Users size={16}/> Portionen <b>{servings}</b></span><div><button onClick={() => setServings(value => Math.max(1, value - 1))} aria-label="Portionen verringern"><Minus size={15}/></button><button onClick={() => setServings(value => Math.min(20, value + 1))} aria-label="Portionen erhöhen"><Plus size={15}/></button></div></div><div className="recipe-ingredient-heading"><h4>Zutaten auswählen</h4><small>Grau = nicht hinzufügen · antippen zum Ändern</small></div><div className={`recipe-ingredients ${layout === "list" ? "recipe-ingredients-list" : ""}`}>{selected.ingredients.map((ingredient, index) => { const key = `${selected.id}:${index}`; const checked = selectedIngredients.includes(key); const offer = isOffer(ingredient.name); return <button type="button" key={key} aria-pressed={checked} className={`recipe-ingredient ${checked ? "selected" : ""}`} onClick={() => toggleIngredient(key)}><span className="recipe-ingredient-icon">{iconFor(ingredient.name)}</span><span className="recipe-ingredient-copy"><b>{ingredient.name}</b>{offer && <small className="recipe-ingredient-offer">Im Angebot: {offer.price.toLocaleString("de-AT", { style: "currency", currency: "EUR" })} · {offer.storeName}</small>}{!offer && pantryWords.some(word => ingredient.name.toLocaleLowerCase("de").includes(word)) && <small>Vorrat? Zum Hinzufügen antippen</small>}</span><span className="recipe-ingredient-amount">{scaledAmount(ingredient.amount, servings / Math.max(1, selected.portions ?? 4))}</span>{checked && <Check className="recipe-ingredient-check" size={16}/>}</button>; })}</div>{selected.instructions.length > 0 && <details className="recipe-steps"><summary><BookOpen size={15}/> Zubereitung ansehen</summary><ol>{selected.instructions.map((step, index) => <li key={index}>{step}</li>)}</ol></details>}{selected.source && <a className="recipe-original-link" href={selected.source} target="_blank" rel="noreferrer">Originalrezept ansehen <BookOpen size={14}/></a>}<small className="recipe-portion-hint">Die Quelle nennt keine verlässliche Portionszahl. Mengen werden proportional ab 4 Ausgangsportionen angepasst.</small></div><footer className="recipe-detail-footer"><span>{selectedIngredients.length} von {selected.ingredients.length} ausgewählt</span><button className="recipe-add-button" disabled={!selectedIngredients.length} onClick={addSelected}><ShoppingBasket size={17}/> {selectedIngredients.length} Zutaten zur Einkaufsliste</button></footer></section></div>}

    {createOpen && createPortal(<div className="recipe-detail-scrim" onMouseDown={event => { if (event.target === event.currentTarget) setCreateOpen(false); }}><section className="recipe-create-dialog" role="dialog" aria-modal="true" aria-labelledby="recipe-create-title"><header className="recipe-detail-header"><div><small>Für eure WG</small><h3 id="recipe-create-title">Rezept speichern</h3></div><button className="sheet-close" onClick={() => setCreateOpen(false)} aria-label="Schließen"><X size={18}/></button></header><div className="recipe-create-fields"><label>Name<input value={recipeName} onChange={event => setRecipeName(event.target.value)} placeholder="z. B. Gemüselasagne"/></label><label>Zutaten, eine pro Zeile<textarea value={recipeIngredients} onChange={event => setRecipeIngredients(event.target.value)} placeholder={'2 Tomaten\n250 g Nudeln\n1 EL Olivenöl'} rows={6}/></label><label>Zubereitung (optional)<textarea value={instructions} onChange={event => setInstructions(event.target.value)} rows={4} placeholder="Ein Schritt pro Zeile"/></label><label>Rezeptlink (optional)<input value={source} onChange={event => setSource(event.target.value)} placeholder="https://…"/></label></div><footer className="recipe-detail-footer"><button className="recipe-back-button" onClick={() => setCreateOpen(false)}>Abbrechen</button><button className="recipe-add-button" disabled={!recipeName.trim() || !recipeIngredients.trim()} onClick={saveOwnRecipe}><Check size={16}/> Rezept speichern</button></footer></section></div>, document.body)}
  </section>;
}
