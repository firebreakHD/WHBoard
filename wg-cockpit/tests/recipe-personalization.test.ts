import test from "node:test";
import assert from "node:assert/strict";
import {scaleRecipeAmount,scaleRecipeStep} from "../src/lib/recipe-portions.ts";
import {recommendationTerms,recommendationScore} from "../src/lib/recipe-recommendations.ts";
import {localizeRecipeAmount} from "../src/lib/recipe-localization.ts";
test("step amounts scale for portions while temperatures, times and dimensions stay unchanged",()=>{
 const step="40g Butter mit 1 1/2 EL Mehl, ½ Liter Milch und 2 Eier mischen. Bei 180 °C 20 Minuten in einer 24 cm Form backen.";
 assert.equal(scaleRecipeStep(step,2),"80 g Butter mit 3 EL Mehl, 1 Liter Milch und 4 Eier mischen. Bei 180 °C 20 Minuten in einer 24 cm Form backen.");
 assert.equal(scaleRecipeStep("40 g Butter und 0,5 l Milch",.5),"20 g Butter und 0,25 l Milch");
 assert.equal(scaleRecipeStep("100–150 g Mehl und 1 bis 2 TL Salz",2),"200 – 300 g Mehl und 2 bis 4 TL Salz");
 assert.equal(scaleRecipeStep("Schritt 2: 10 Minuten ruhen lassen.",2),"Schritt 2: 10 Minuten ruhen lassen.");
 assert.equal(scaleRecipeStep("40 g Butter",1),"40 g Butter");
 assert.equal(scaleRecipeAmount("½ Liter",2),"1 Liter");assert.equal(scaleRecipeAmount("100-150 g",.5),"50 - 75 g");assert.equal(scaleRecipeAmount("2",2),"4");
 assert.equal(localizeRecipeAmount(scaleRecipeAmount("5 Stück",.5)),"2,5 Stück");assert.equal(localizeRecipeAmount("2 Stück"),"2 Stück");assert.match(localizeRecipeAmount("1 st"),/kg/);
 assert.equal(localizeRecipeAmount("12,7 kgück"),"2 Stück");assert.equal(localizeRecipeAmount(scaleRecipeAmount("31,75 kgück",.5)),"2,5 Stück");
});
test("recommendations combine listed products, remembered additions and recent purchases without household supplies",()=>{
 const terms=recommendationTerms([{name:"Bio Zucchini"},{name:"Spülmittel"}],[{id:"old",name:"Kartoffeln",addedAt:100},{id:"new",name:"Tomaten",addedAt:200}],[{id:200,purchase:{items:[{name:"Hähnchenbrust"}]}},{id:100,purchase:{items:[{name:"Paprika"}]}}]);
 assert.ok(terms.includes("Zucchini"));assert.ok(terms.includes("Tomaten"));assert.ok(terms.includes("Kartoffeln"));assert.ok(terms.includes("Hähnchen"));assert.ok(!terms.includes("Spülmittel"));
 assert.ok(recommendationScore({name:"Zucchini-Hähnchen-Pfanne",ingredients:[{name:"Tomaten"}]},terms)>recommendationScore({name:"Vanillekuchen",ingredients:[{name:"Mehl"}]},terms));
 assert.deepEqual(recommendationTerms([],[],[]),[]);
});
test("only the latest five purchases influence recommendations",()=>{
 const purchases=Array.from({length:6},(_,index)=>({id:6-index,purchase:{items:[{name:index===5?"Spargel":"Tomaten"}]}}));
 assert.deepEqual(recommendationTerms([],[],purchases),["Tomaten"]);
});
