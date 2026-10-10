const canonicalIngredients: Record<string,string> = {
  "tomato":"Tomaten","tomatoes":"Tomaten","cherry tomatoes":"Kirschtomaten","potato":"Kartoffeln","potatoes":"Kartoffeln","onion":"Zwiebeln","onions":"Zwiebeln","red onion":"Rote Zwiebeln","spring onion":"Frühlingszwiebeln","green onion":"Frühlingszwiebeln","garlic":"Knoblauch","ginger":"Ingwer","carrot":"Karotten","carrots":"Karotten","celery":"Sellerie","cucumber":"Gurken","bell pepper":"Paprika","bell peppers":"Paprika","sweet pepper":"Paprika","sweet peppers":"Paprika","yellow pepper":"Gelbe Paprika","yellow peppers":"Gelbe Paprika","yellow bell pepper":"Gelbe Paprika","yellow bell peppers":"Gelbe Paprika","yellow capsicum":"Gelbe Paprika","yellow paprika":"Gelbe Paprika","green pepper":"Grüne Paprika","green peppers":"Grüne Paprika","green bell pepper":"Grüne Paprika","green bell peppers":"Grüne Paprika","green capsicum":"Grüne Paprika","green paprika":"Grüne Paprika","red pepper":"Rote Paprika","red peppers":"Rote Paprika","red bell pepper":"Rote Paprika","red bell peppers":"Rote Paprika","red capsicum":"Rote Paprika","red paprika":"Rote Paprika","orange pepper":"Orange Paprika","orange bell pepper":"Orange Paprika","chilli pepper":"Chili","chili pepper":"Chili","pepper flakes":"Chiliflocken","pepper":"Pfeffer","black pepper":"Pfeffer","white pepper":"Pfeffer","salt":"Salz","sugar":"Zucker","brown sugar":"Brauner Zucker","flour":"Mehl","plain flour":"Mehl","all purpose flour":"Mehl","self raising flour":"Selbsttreibendes Mehl","egg":"Eier","eggs":"Eier","milk":"Milch","butter":"Butter","unsalted butter":"Butter","cheese":"Käse","cheddar":"Cheddar","parmesan":"Parmesan","cream":"Schlagobers","double cream":"Schlagobers","heavy cream":"Schlagobers","whipping cream":"Schlagobers","sour cream":"Sauerrahm","cream cheese":"Frischkäse","yogurt":"Joghurt","plain yogurt":"Naturjoghurt","chicken":"Huhn","chicken breast":"Hühnerbrust","beef":"Rindfleisch","minced beef":"Faschiertes","ground beef":"Faschiertes","pork":"Schweinefleisch","pork shoulder":"Schweineschulter","pork loin":"Schweinskarree","bacon":"Speck","sausage":"Wurst","lard":"Schweineschmalz","fish":"Fisch","salmon":"Lachs","tuna":"Thunfisch","prawn":"Garnelen","prawns":"Garnelen","shrimp":"Garnelen","rice":"Reis","pasta":"Nudeln","spaghetti":"Spaghetti","noodles":"Nudeln","bread":"Brot","breadcrumbs":"Semmelbrösel","olive oil":"Olivenöl","vegetable oil":"Pflanzenöl","sunflower oil":"Sonnenblumenöl","water":"Wasser","hot water":"Wasser","cold water":"Wasser","warm water":"Wasser","black coffee":"Kaffee","white coffee":"Kaffee","coffee":"Kaffee","instant coffee":"Kaffee","espresso":"Kaffee","tea":"Tee","lemon":"Zitrone","lime":"Limette","orange":"Orange","apple":"Äpfel","banana":"Bananen","mushroom":"Champignons","mushrooms":"Champignons","broccoli":"Brokkoli","spinach":"Spinat","cabbage":"Kohl","lettuce":"Salat","peas":"Erbsen","green peas":"Erbsen","sweetcorn":"Mais","corn":"Mais","beans":"Bohnen","kidney beans":"Kidneybohnen","chickpeas":"Kichererbsen","lentils":"Linsen","parsley":"Petersilie","coriander":"Koriander","cilantro":"Koriander","basil":"Basilikum","oregano":"Oregano","thyme":"Thymian","rosemary":"Rosmarin","cumin":"Kreuzkümmel","cumin seeds":"Kreuzkümmelsamen","caraway seeds":"Kümmel","paprika":"Paprikapulver","chili powder":"Chilipulver","chilli powder":"Chilipulver","curry powder":"Currypulver","nutmeg":"Muskatnuss","cinnamon":"Zimt","vanilla":"Vanille","honey":"Honig","mustard":"Senf","ketchup":"Ketchup","mayonnaise":"Mayonnaise","soy sauce":"Sojasauce","vinegar":"Essig","white vinegar":"Weißweinessig","wine vinegar":"Weinessig","red wine vinegar":"Rotweinessig","white wine vinegar":"Weißweinessig","apple cider vinegar":"Apfelessig","cider vinegar":"Apfelessig","balsamic vinegar":"Balsamico","stock":"Brühe","beef stock":"Rinderbrühe","chicken stock":"Hühnerbrühe","vegetable stock":"Gemüsebrühe","vegetable broth":"Gemüsebrühe","tomato paste":"Tomatenmark","coconut milk":"Kokosmilch","coconut":"Kokos","almonds":"Mandeln","walnuts":"Walnüsse","oats":"Haferflocken","rolled oats":"Haferflocken","chocolate":"Schokolade","dark chocolate":"Zartbitterschokolade","baking powder":"Backpulver","yeast":"Hefe","dried yeast":"Trockenhefe","potato starch":"Kartoffelstärke","cornstarch":"Speisestärke","bay leaf":"Lorbeerblatt","bay leaves":"Lorbeerblätter","avocado":"Avocado","courgette":"Zucchini","zucchini":"Zucchini","aubergine":"Aubergine","eggplant":"Aubergine","cauliflower":"Blumenkohl","sweet potato":"Süßkartoffeln","red wine":"Rotwein","white wine":"Weißwein","sauerkraut":"Sauerkraut","penne rigate":"Penne","penne":"Penne","fusilli":"Fusilli","tagliatelle":"Tagliatelle","linguine":"Linguine","macaroni":"Makkaroni","rigatoni":"Rigatoni"
};

const prepWords: [RegExp,string][] = [
  [/\bfinely chopped\b|\bchopped finely\b/gi,"fein gehackt"],[/\broughly chopped\b/gi,"grob gehackt"],[/\bchopped\b/gi,"gehackt"],[/\bdiced\b/gi,"gewürfelt"],[/\bminced\b/gi,"fein gehackt"],[/\bsliced\b/gi,"in Scheiben"],[/\bgrated\b/gi,"gerieben"],[/\bpeeled\b/gi,"geschält"],[/\bcrushed\b/gi,"zerdrückt"],[/\bmashed\b/gi,"zerstampft"],[/\bshredded\b/gi,"geraspelt"],[/\bbeaten\b/gi,"verquirlt"],[/\bdrained\b/gi,"abgetropft"],[/\bfresh\b/gi,"frisch"],[/\bdried\b/gi,"getrocknet"],[/\bground\b/gi,"gemahlen"],[/\bblack\b/gi,"schwarz"],[/\bwhite\b/gi,"weiß"],[/\bripe\b/gi,"reif"]
];

function keyOf(value:string){return value.toLocaleLowerCase("en").replace(/[’']/g," ").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ")}
function escapeRegExp(value:string){return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}

export function localizeRecipeIngredientMentions(text:string){
  const aliases=Object.entries(canonicalIngredients).filter(([english])=>english!=="paprika").sort(([a],[b])=>b.length-a.length);
  const translations=new Map(aliases.map(([english,german])=>[english.toLocaleLowerCase("en"),german]));
  const pattern=new RegExp(`\\b(${aliases.map(([english])=>escapeRegExp(english)).join("|")})\\b`,"gi");
  return text.replace(pattern,match=>translations.get(match.toLocaleLowerCase("en"))??match);
}

export function localizeRecipeIngredient(raw:string){
  const original=raw.trim().replace(/\s+/g," ");
  const parentheticalColor=original.match(/\((red|green|yellow|orange)\)/i)?.[1]?.toLocaleLowerCase("en");
  const source=original.replace(/\s*\([^)]*\)\s*/g," ").replace(/\s+/g," ");
  if(parentheticalColor&&/\b(?:bell\s+)?pepper\b/i.test(source)){const colored=canonicalIngredients[`${parentheticalColor} pepper`];if(colored)return{name:colored,hint:""}}
  const direct=keyOf(source);
  if(canonicalIngredients[direct])return{name:canonicalIngredients[direct],hint:""};
  let base=source;const hints:string[]=[];
  for(const [pattern,german] of prepWords){if(pattern.test(base)){hints.push(german);base=base.replace(pattern," ").replace(/\s+/g," ").trim()}}
  base=base.replace(/^(?:warm|hot|cold|boiling|luke warm|lukewarm)\s+/i,"").replace(/\s+(?:warm|hot|cold)$/i,"").trim();
  const normalized=keyOf(base);
  const name=canonicalIngredients[normalized]||canonicalIngredients[normalized.replace(/s$/i,"")]||base;
  const hint=[...new Set(hints)].join(", ");
  return{name,hint};
}

const measureWords: [RegExp,string][] = [
  [/\btablespoons?\b|\btbs\b|\btbsp\b/gi,"EL"],[/\bteaspoons?\b|\btsp\b/gi,"TL"],[/\bcups?\b/gi,"Tasse"],[/\bounces?\b/gi,"oz"],[/\bpounds?\b/gi,"Pfund"],[/\bcloves?\b/gi,"Zehen"],[/\bpinch(?:es)?\b/gi,"Prise"],[/\bhandfuls?\b/gi,"Handvoll"],[/\bbunch(?:es)?\b/gi,"Bund"],[/\bslices?\b/gi,"Scheiben"],[/\bpackets?\b|\bpkg\b/gi,"Päckchen"],[/\bcans?\b/gi,"Dosen"],[/\bsmall\b/gi,"klein"],[/\blarge\b/gi,"groß"],[/\bmedium\b/gi,"mittelgroß"],[/\bto taste\b/gi,"nach Geschmack"],[/\bsplash(?:es)?\b/gi,"Schuss"],[/\bsprigs?\b/gi,"Zweige"],[/\bchopped\b/gi,"gehackt"],[/\bcrushed\b/gi,"zerdrückt"],[/\bgrated\b/gi,"gerieben"],[/\bdiced\b/gi,"gewürfelt"],[/\bsliced\b/gi,"in Scheiben"]
];

export function localizeRecipeAmount(raw:string){
  let value=raw.trim().replace(/\s+/g," ");
  const measurement=value.match(/^((?:\d+\s+)?\d+(?:[.,]\d+)?(?:\/\d+)?)\s*(fluid\s+ounces?|fl\s*oz|ounces?|oz|pounds?|lbs?|lb|stones?|st)\b(.*)$/i);
  if(measurement){
    const [whole,...fractional]=measurement[1].trim().split(/\s+/);let quantity=0;
    if(fractional.length){const [numerator,denominator]=fractional[0].split("/").map(Number);quantity=Number(whole)+(denominator?numerator/denominator:0)}
    else if(whole.includes("/")){const [numerator,denominator]=whole.split("/").map(Number);quantity=denominator?numerator/denominator:0}
    else quantity=Number(whole.replace(",","."));
    const unit=measurement[2].toLocaleLowerCase("en");const isFluid=/fluid|fl\s*oz/.test(unit);
    const grams=quantity*(/^(?:pounds?|lbs?|lb)$/.test(unit)?453.59237:/^(?:stones?|st)$/.test(unit)?6350:28.349523125);
    const rest=measurement[3];
    if(isFluid){const milliliters=quantity*29.5735;value=`${Number.isInteger(milliliters)?milliliters:Math.round(milliliters)} ml${rest}`}
    else if(grams>=1000)value=`${(grams/1000).toLocaleString("de-AT",{maximumFractionDigits:2})} kg${rest}`;
    else value=`${Math.max(1,Math.round(grams))} g${rest}`;
  }
  for(const [pattern,replacement] of measureWords)value=value.replace(pattern,replacement);
  value=value.replace(/\bpieces?\b/gi,"Stück").replace(/\bitems?\b/gi,"Stück").replace(/\bpcs?\b/gi,"Stück");
  return value;
}

export function normalizeRecipeShoppingQuantity(raw:string){
  const value=raw.trim().replace(/½/g," 1/2").replace(/¼/g," 1/4").replace(/¾/g," 3/4").replace(/\s+/g," ");
  const match=value.match(/^((?:\d+\s+)?\d+\/\d+|(?:\d+\s+)?\d+(?:[.,]\d+)?)\s*(.*)$/);
  if(!match)return "1 Stück";
  const numberParts=match[1].trim().split(/\s+/);const fraction=numberParts.pop()!;let amount:number;
  if(fraction.includes("/")){const [numerator,denominator]=fraction.split("/").map(Number);amount=(Number(numberParts[0])||0)+(denominator?numerator/denominator:0)}else amount=(Number(numberParts[0])||0)+Number(fraction.replace(",","."));
  if(!Number.isFinite(amount)||amount<=0)amount=1;
  const unit=match[2].trim().toLocaleLowerCase("de").replace(/[.]/g,"");
  const format=(number:number)=>new Intl.NumberFormat("de-AT",{maximumFractionDigits:3}).format(number);
  if(!unit||/^(?:x|stk|stück|stueck|piece|pieces|pc|pcs|item|items|clove|cloves|zehe|zehen|dose|dosen|can|cans|packet|packets|pck|päckchen|paeckchen)$/.test(unit))return `${format(amount)} Stück`;
  if(/^(?:g|gram|grams|gramm)$/.test(unit))return `${format(amount)} Gramm`;
  if(/^(?:kg|kilogram|kilograms|kilogramm)$/.test(unit))return `${format(amount)} Kilogramm`;
  if(/^(?:mg|milligram|milligrams)$/.test(unit))return `${format(amount/1000)} Gramm`;
  if(/^(?:l|liter|litre|litres|liters)$/.test(unit))return `${format(amount)} Liter`;
  if(/^(?:ml|milliliter|milliliters|millilitre|millilitres)$/.test(unit))return `${format(amount/1000)} Liter`;
  if(/^(?:tasse|tassen|cup|cups)$/.test(unit))return `${format(amount*.24)} Liter`;
  if(/^(?:el|tablespoon|tablespoons|tbsp|tbs)$/.test(unit))return `${format(amount*.015)} Liter`;
  if(/^(?:tl|teaspoon|teaspoons|tsp)$/.test(unit))return `${format(amount*.005)} Liter`;
  if(/^(?:oz|ounce|ounces)$/.test(unit))return `${format(amount*28.3495)} Gramm`;
  if(/^(?:lb|lbs|pound|pounds|pfund)$/.test(unit))return `${format(amount*.453592)} Kilogramm`;
  return `${format(amount)} ${match[2].trim()}`;
}

export function isKnownGermanRecipeIngredient(name:string){return Object.values(canonicalIngredients).some(value=>value.toLocaleLowerCase("de")===name.toLocaleLowerCase("de"))}
