type RecipeIdentity={id:string;name:string};
export function recipeSelectionKey(recipe:RecipeIdentity){
 const name=recipe.name.toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\brezept\b/g,"").replace(/[^a-z0-9]/g,"")||recipe.id;
 let hash=2166136261;for(let i=0;i<name.length;i++){hash^=name.charCodeAt(i);hash=Math.imul(hash,16777619)}
 return (hash>>>0).toString(16).padStart(8,"0");
}
export function chooseRecipeSuggestions<T extends RecipeIdentity>(recipes:T[],limit:number,excluded:ReadonlySet<string>=new Set()){
 const unique=[...new Map(recipes.map(recipe=>[recipeSelectionKey(recipe),recipe])).values()];
 return [...unique.filter(recipe=>!excluded.has(recipeSelectionKey(recipe))),...unique.filter(recipe=>excluded.has(recipeSelectionKey(recipe)))].slice(0,limit);
}
