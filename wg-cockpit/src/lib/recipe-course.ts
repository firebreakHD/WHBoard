type RecipeCourseInput={name:string;category?:string;course?:"main"|"dessert"};
export function recipeCourse(recipe:RecipeCourseInput):"main"|"dessert"{
 if(recipe.course)return recipe.course;
 const title=recipe.name.toLocaleLowerCase("de");
 if(/flammkuchen|zwiebelkuchen|herzhaft|(?:pfannkuchen|crêpes?|crepes?|tarte).*(?:spinat|fleisch|käse|kaese|gemüse|schinken|tomaten)|(?:käse|schinken).*hörnchen/.test(title))return "main";
 if(/(?:quark|topfen|grieß|griess|reis|nudel)[- ]?auflauf.*(?:mandarin|apfel|äpfel|beere|kirsch|vanille)|(?:erdbeer|himbeer|vanille)[- ]?quark|kaiserschmarren|clafoutis|windbeutel|rote grütze|süßer auflauf|süsser auflauf|crêpes?|crepes?/.test(title))return "dessert";
 const text=`${title} ${recipe.category??""}`;
 return /dessert|kuchen|torte|tarte|brownie|muffin|cupcake|cookie|keks|plätzchen|plaetzchen|pudding|süßspeise|suessspeise|süßigkeit|suessigkeit|nachtisch|nachspeise|sorbet|eiscreme|eisbecher|tiramisu|parfait|mousse|crumble|streuseldessert|waffel|pfannkuchen|pancake|palatschink|kaiserschmarrn|topfenknödel|topfenknoedel|milchreis|grießbrei|griessbrei|soufflé|creme brulee|crème brûlée|apfelstrudel|marillenknödel|biskuit|schokolade|schokoladen|chocolate|cheesecake|zuckerguss|glasur|frosting|marzipan|baiser|praline|konfekt/i.test(text)?"dessert":"main";
}
