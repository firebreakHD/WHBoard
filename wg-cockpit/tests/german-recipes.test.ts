import test from "node:test";
import assert from "node:assert/strict";
import {parseGermanRecipe} from "../src/lib/german-recipes.ts";
const source="https://www.gutekueche.at/gemuesesuppe-rezept-123";
const recipe={"@type":"Recipe",name:"Gemüsesuppe",image:["https://images.example/suppe.jpg"],description:"Eine einfache Suppe.",recipeIngredient:["2 EL Olivenöl","500 g Karotten","1 Prise Salz"],recipeInstructions:[{"@type":"HowToSection",itemListElement:[{text:"Die Karotten schälen."},{text:"Das Gemüse in Olivenöl anbraten."}]}],recipeYield:"4 Portionen"};
function html(value:unknown){return `<script type="application/ld+json">${JSON.stringify(value)}</script>`}
test("German sources retain real photos, amounts and nested preparation steps",()=>{
 const result=parseGermanRecipe(html({"@graph":[recipe]}),source);assert.ok(result);assert.equal(result.image,recipe.image[0]);assert.equal(result.area,"GuteKueche Österreich");assert.deepEqual(result.ingredients[0],{amount:"2 EL",name:"Olivenöl"});assert.equal(result.portions,4);assert.deepEqual(result.instructions,["Die Karotten schälen.","Das Gemüse in Olivenöl anbraten."]);assert.equal(result.detailsLoaded,true);
});
test("native suggestions reject seafood, untranslated English and missing photos",()=>{
 for(const changed of [{...recipe,recipeIngredient:["1 EL Fischsauce"]},{...recipe,image:[]},{...recipe,recipeInstructions:["Add the onions."]},{...recipe,recipeIngredient:[]}])assert.equal(parseGermanRecipe(html(changed),source),null);
 assert.equal(parseGermanRecipe(html(recipe),"https://untrusted.example/rezept"),null);
});
test("culinary English and template links are localized without a translation quota",()=>{
 const result=parseGermanRecipe(html({...recipe,name:"High Protein Bowl mit Dip",recipeInstructions:['{{ link("ATT", 123, "Karotten") }} im Airfryer garen.']}),source);assert.ok(result);assert.equal(result.name,"eiweißreich Schüsselgericht mit Sauce");assert.deepEqual(result.instructions,["Karotten im Heißluftfritteuse garen."]);
});
test("new sources support array text steps and nested image objects",()=>{
 const result=parseGermanRecipe(html({...recipe,image:[{"@type":"ImageObject",url:"https://images.example/cake.jpg"}],recipeInstructions:[{text:["Das Gemüse schneiden,","danach kochen."]}]}),"https://www.einfachkochen.de/rezepte/suppe");assert.ok(result);assert.equal(result.area,"Einfach Kochen");assert.deepEqual(result.instructions,["Das Gemüse schneiden, danach kochen."]);
 const emmi=parseGermanRecipe(html(recipe),"https://emmikochteinfach.de/suppe/");assert.equal(emmi?.area,"Emmi kocht einfach");
});
