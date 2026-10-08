const canonicalIngredients: Record<string,string> = {
  "tomato":"Tomaten","tomatoes":"Tomaten","cherry tomatoes":"Kirschtomaten","potato":"Kartoffeln","potatoes":"Kartoffeln","onion":"Zwiebeln","onions":"Zwiebeln","red onion":"Rote Zwiebeln","spring onion":"Frühlingszwiebeln","green onion":"Frühlingszwiebeln","garlic":"Knoblauch","ginger":"Ingwer","carrot":"Karotten","carrots":"Karotten","celery":"Sellerie","cucumber":"Gurken","bell pepper":"Paprika","red pepper":"Paprika","green pepper":"Paprika","pepper":"Pfeffer","black pepper":"Pfeffer","white pepper":"Pfeffer","salt":"Salz","sugar":"Zucker","brown sugar":"Brauner Zucker","flour":"Mehl","plain flour":"Mehl","all purpose flour":"Mehl","self raising flour":"Selbsttreibendes Mehl","egg":"Eier","eggs":"Eier","milk":"Milch","butter":"Butter","unsalted butter":"Butter","cheese":"Käse","cheddar":"Cheddar","parmesan":"Parmesan","cream":"Schlagobers","double cream":"Schlagobers","heavy cream":"Schlagobers","whipping cream":"Schlagobers","sour cream":"Sauerrahm","cream cheese":"Frischkäse","yogurt":"Joghurt","plain yogurt":"Naturjoghurt","chicken":"Huhn","chicken breast":"Hühnerbrust","beef":"Rindfleisch","minced beef":"Faschiertes","ground beef":"Faschiertes","pork":"Schweinefleisch","pork shoulder":"Schweineschulter","pork loin":"Schweinskarree","bacon":"Speck","sausage":"Wurst","lard":"Schweineschmalz","fish":"Fisch","salmon":"Lachs","tuna":"Thunfisch","prawn":"Garnelen","prawns":"Garnelen","shrimp":"Garnelen","rice":"Reis","pasta":"Nudeln","spaghetti":"Spaghetti","noodles":"Nudeln","bread":"Brot","breadcrumbs":"Semmelbrösel","olive oil":"Olivenöl","vegetable oil":"Pflanzenöl","sunflower oil":"Sonnenblumenöl","water":"Wasser","hot water":"Wasser","cold water":"Wasser","warm water":"Wasser","black coffee":"Kaffee","white coffee":"Kaffee","coffee":"Kaffee","instant coffee":"Kaffee","espresso":"Kaffee","tea":"Tee","lemon":"Zitrone","lime":"Limette","orange":"Orange","apple":"Äpfel","banana":"Bananen","mushroom":"Champignons","mushrooms":"Champignons","broccoli":"Brokkoli","spinach":"Spinat","cabbage":"Kohl","lettuce":"Salat","peas":"Erbsen","green peas":"Erbsen","sweetcorn":"Mais","corn":"Mais","beans":"Bohnen","kidney beans":"Kidneybohnen","chickpeas":"Kichererbsen","lentils":"Linsen","parsley":"Petersilie","coriander":"Koriander","cilantro":"Koriander","basil":"Basilikum","oregano":"Oregano","thyme":"Thymian","rosemary":"Rosmarin","cumin":"Kreuzkümmel","cumin seeds":"Kreuzkümmelsamen","caraway seeds":"Kümmel","paprika":"Paprikapulver","chili powder":"Chilipulver","chilli powder":"Chilipulver","curry powder":"Currypulver","nutmeg":"Muskatnuss","cinnamon":"Zimt","vanilla":"Vanille","honey":"Honig","mustard":"Senf","ketchup":"Ketchup","mayonnaise":"Mayonnaise","soy sauce":"Sojasauce","vinegar":"Essig","balsamic vinegar":"Balsamico","stock":"Brühe","beef stock":"Rinderbrühe","chicken stock":"Hühnerbrühe","vegetable stock":"Gemüsebrühe","vegetable broth":"Gemüsebrühe","tomato paste":"Tomatenmark","coconut milk":"Kokosmilch","coconut":"Kokos","almonds":"Mandeln","walnuts":"Walnüsse","oats":"Haferflocken","rolled oats":"Haferflocken","chocolate":"Schokolade","dark chocolate":"Zartbitterschokolade","baking powder":"Backpulver","yeast":"Hefe","dried yeast":"Trockenhefe","potato starch":"Kartoffelstärke","cornstarch":"Speisestärke","bay leaf":"Lorbeerblatt","bay leaves":"Lorbeerblätter","avocado":"Avocado","courgette":"Zucchini","zucchini":"Zucchini","aubergine":"Aubergine","eggplant":"Aubergine","cauliflower":"Blumenkohl","sweet potato":"Süßkartoffeln","red wine":"Rotwein","white wine":"Weißwein","sauerkraut":"Sauerkraut"
};

const prepWords: [RegExp,string][] = [
  [/\bfinely chopped\b|\bchopped finely\b/gi,"fein gehackt"],[/\broughly chopped\b/gi,"grob gehackt"],[/\bchopped\b/gi,"gehackt"],[/\bdiced\b/gi,"gewürfelt"],[/\bminced\b/gi,"fein gehackt"],[/\bsliced\b/gi,"in Scheiben"],[/\bgrated\b/gi,"gerieben"],[/\bpeeled\b/gi,"geschält"],[/\bcrushed\b/gi,"zerdrückt"],[/\bmashed\b/gi,"zerstampft"],[/\bshredded\b/gi,"geraspelt"],[/\bbeaten\b/gi,"verquirlt"],[/\bdrained\b/gi,"abgetropft"],[/\bfresh\b/gi,"frisch"],[/\bdried\b/gi,"getrocknet"],[/\bground\b/gi,"gemahlen"],[/\bblack\b/gi,"schwarz"],[/\bwhite\b/gi,"weiß"],[/\bripe\b/gi,"reif"]
];

function keyOf(value:string){return value.toLocaleLowerCase("en").replace(/[’']/g," ").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ")}

export function localizeRecipeIngredient(raw:string){
  const source=raw.trim().replace(/\s*\([^)]*\)\s*/g," ").replace(/\s+/g," ");
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

export function localizeRecipeAmount(raw:string){let value=raw.trim().replace(/\s+/g," ");for(const [pattern,replacement] of measureWords)value=value.replace(pattern,replacement);return value;}

export function normalizeRecipeShoppingQuantity(raw:string){
  const value=raw.trim().replace(/½/g," 1/2").replace(/¼/g," 1/4").replace(/¾/g," 3/4").replace(/\s+/g," ");
  const match=value.match(/^((?:\d+\s+)?\d+\/\d+|(?:\d+\s+)?\d+(?:[.,]\d+)?)\s*(.*)$/);
  if(!match)return "1 Stück";
  const numberParts=match[1].trim().split(/\s+/);const fraction=numberParts.pop()!;let amount:number;
  if(fraction.includes("/")){const [numerator,denominator]=fraction.split("/").map(Number);amount=(Number(numberParts[0])||0)+(denominator?numerator/denominator:0)}else amount=(Number(numberParts[0])||0)+Number(fraction.replace(",","."));
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
