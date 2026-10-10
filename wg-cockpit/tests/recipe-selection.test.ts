import test from "node:test";
import assert from "node:assert/strict";
import {chooseRecipeSuggestions,recipeSelectionKey} from "../src/lib/recipe-selection.ts";
import {recipeCourse} from "../src/lib/recipe-course.ts";
test("refresh prioritizes unseen dishes and recognizes the same title across sources",()=>{
 const previous=Array.from({length:9},(_,i)=>({id:`old-${i}`,name:`Gemüsegericht ${i}`}));
 const fresh=Array.from({length:9},(_,i)=>({id:`new-${i}`,name:`Nudelgericht ${i}`}));
 const excluded=new Set(previous.map(recipeSelectionKey));
 const result=chooseRecipeSuggestions([...previous,...fresh],9,excluded);assert.equal(result.length,9);assert.ok(result.every(recipe=>!excluded.has(recipeSelectionKey(recipe))));
 assert.equal(recipeSelectionKey({id:"source-a",name:"Kürbissuppe Rezept"}),recipeSelectionKey({id:"source-b",name:"Kürbissuppe"}));
 assert.equal(chooseRecipeSuggestions([{id:"a",name:"Kürbissuppe"},{id:"b",name:"Kürbissuppe Rezept"}],9).length,1);
});
test("small pools fill available slots without duplicating dishes",()=>{
 const recipes=[{id:"a",name:"Suppe"},{id:"b",name:"Gulasch"}];assert.deepEqual(chooseRecipeSuggestions(recipes,9,new Set([recipeSelectionKey(recipes[0])])),[recipes[1],recipes[0]]);
});
test("desserts and cakes are separated while savory dishes stay in discover",()=>{
 for(const name of ["Apfelkuchen","Schokoladenmousse","Brownies","Kaiserschmarrn","Tiramisu","Vanillepudding","Milchreis","Zuckerguss Grundrezept","Marzipan","Quark-Auflauf mit Mandarinen Rezept","Erdbeerquark","Karamellisierter Kaiserschmarren","Himbeer-Clafoutis"]){assert.equal(recipeCourse({name}),"dessert",name)}
 for(const name of ["Flammkuchen","Zwiebelkuchen","Pfannkuchen mit Spinat","Crêpes mit Schinken","Hühnersuppe","Kartoffelgulasch","Süßkartoffel-Curry"]){assert.equal(recipeCourse({name}),"main",name)}
 assert.equal(recipeCourse({name:"Französische Crêpes"}),"dessert");
 assert.equal(recipeCourse({name:"Créme",category:"Dessert"}),"dessert");
});
