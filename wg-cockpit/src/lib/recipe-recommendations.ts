export type ShoppingSignal={id:string;name:string;addedAt:number};
type Product={name:string};
type Purchase={id?:number;date?:string;purchase?:{items?:Product[]}};
type RecipeLike={name:string;ingredients:{name:string}[]};
const normalize=(text:string)=>text.toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const foods:[RegExp,string][]=[[/kartoffel/,"Kartoffeln"],[/tomat/,"Tomaten"],[/paprika/,"Paprika"],[/zucchini/,"Zucchini"],[/karott|mohre/,"Karotten"],[/brokkoli|broccoli/,"Brokkoli"],[/spinat/,"Spinat"],[/champignon|pilz/,"Pilze"],[/kurbis/,"Kürbis"],[/blumenkohl/,"Blumenkohl"],[/lauch/,"Lauch"],[/aubergin/,"Aubergine"],[/erbsen/,"Erbsen"],[/bohnen/,"Bohnen"],[/linsen/,"Linsen"],[/kichererbse/,"Kichererbsen"],[/hahn|huhn|huhner|chicken|puten/,"Hähnchen"],[/hackfleisch|faschiert/,"Hackfleisch"],[/rind/,"Rindfleisch"],[/schwein/,"Schweinefleisch"],[/tofu/,"Tofu"],[/nudel|pasta|spaghetti|penne/,"Nudeln"],[/\breis\b/,"Reis"],[/couscous/,"Couscous"],[/quark|topfen/,"Quark"],[/joghurt/,"Joghurt"],[/mozzarella/,"Mozzarella"],[/feta|schafskase/,"Feta"],[/kase/,"Käse"],[/\beier?\b/,"Eier"],[/apfel|apfel/,"Apfel"],[/banan/,"Banane"],[/erdbeer/,"Erdbeeren"],[/himbeer/,"Himbeeren"],[/beeren/,"Beeren"],[/birne/,"Birne"],[/hafer/,"Haferflocken"],[/avocado/,"Avocado"],[/spargel/,"Spargel"]];
export function recommendationTerms(items:Product[],history:ShoppingSignal[],bookings:Purchase[]):string[]{
 const scores=new Map<string,number>();const add=(name:string,weight:number)=>{const food=foods.find(([pattern])=>pattern.test(normalize(name)))?.[1];if(food)scores.set(food,(scores.get(food)??0)+weight)};
 items.forEach(item=>add(item.name,5));
 [...history].sort((a,b)=>b.addedAt-a.addedAt).slice(0,40).forEach((item,index)=>add(item.name,3/(1+index/8)));
 [...bookings].filter(entry=>entry.purchase?.items?.length).sort((a,b)=>(b.id??0)-(a.id??0)).slice(0,5).forEach((entry,index)=>entry.purchase!.items!.forEach(item=>add(item.name,4/(index+1))));
 return [...scores].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name])=>name);
}
export function recommendationScore(recipe:RecipeLike,terms:string[]){const text=normalize(`${recipe.name} ${recipe.ingredients.map(item=>item.name).join(" ")}`);return terms.reduce((score,term,index)=>{const pattern=foods.find(([,name])=>name===term)?.[0];return score+(pattern?.test(text)?terms.length-index:0)},0)}
