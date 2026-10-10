import test from "node:test";
import assert from "node:assert/strict";
import {containsSeafood,hasEnglishRecipeWords} from "../src/lib/recipe-policy.ts";
import {translateRecipeText,translationChunks} from "../src/lib/recipe-translation.ts";

test("fish and seafood are excluded even when hidden in sauce or preparation",()=>{
 for(const ingredient of ["Salmon","Fischsauce","Anchovies","Worcestershire Sauce","Dashi","Garnelen","Muscheln","Thunfisch","Shrimp paste","scallops","Katsuobushi","sardines","sea bass"]){
  assert.equal(containsSeafood({name:"Nudelgericht",ingredients:[{name:ingredient}]}),true,ingredient);
 }
 assert.equal(containsSeafood({name:"Pasta",instructions:["Zum Schluss die Sardellen unterrühren."]}),true);
 for(const name of ["Hähnchen mit Reis","Kartoffelgulasch","Zucchini mit Kichererbsen","Vanillekipferl"]){assert.equal(containsSeafood({name}),false,name)}
});
test("mixed English words are caught in German recipes",()=>{
 assert.equal(hasEnglishRecipeWords("Die Zwiebeln finely chopped dazugeben."),true);
 assert.equal(hasEnglishRecipeWords("Die Zwiebeln fein hacken und anbraten."),false);
});
test("long translations stay below the UTF-8 request limit without losing words",()=>{
 const text=Array.from({length:250},()=>"Hähnchenstückchen").join(" ");const chunks=translationChunks(text);
 assert.ok(chunks.length>1);assert.ok(chunks.every(chunk=>Buffer.byteLength(chunk)<=480));assert.equal(chunks.join(" "),text);
});
test("translation never falls back to English, retries errors and caches success",async()=>{
 const original=globalThis.fetch;const oldEndpoint=process.env.RECIPE_TRANSLATION_URL;delete process.env.RECIPE_TRANSLATION_URL;
 try{
  globalThis.fetch=async()=>new Response(JSON.stringify({responseStatus:429,responseData:{translatedText:"MYMEMORY WARNING"}}));
  await assert.rejects(translateRecipeText("Add the onions to the pan."),/deutsche Übersetzung/);
  globalThis.fetch=async()=>new Response(JSON.stringify({responseStatus:200,responseData:{translatedText:"Add the onions to the pan."}}));
  await assert.rejects(translateRecipeText("Add the onions to the pan."),/deutsche Übersetzung/);
  let calls=0;globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({responseStatus:200,responseData:{translatedText:"Die Zwiebeln in die Pfanne geben."}}))};
  assert.equal(await translateRecipeText("Add the onions to the pan."),"Die Zwiebeln in die Pfanne geben.");
  await translateRecipeText("Add the onions to the pan.");assert.equal(calls,1);
  globalThis.fetch=async()=>{throw new Error("connection failed")};
  await assert.rejects(translateRecipeText("Bake the potatoes for ten minutes."),/deutsche Übersetzung/);
 }finally{globalThis.fetch=original;if(oldEndpoint===undefined)delete process.env.RECIPE_TRANSLATION_URL;else process.env.RECIPE_TRANSLATION_URL=oldEndpoint}
});
test("configured LibreTranslate uses automatic language detection and a server-side key",async()=>{
 const original=globalThis.fetch;const oldEndpoint=process.env.RECIPE_TRANSLATION_URL;const oldKey=process.env.RECIPE_TRANSLATION_KEY;
 process.env.RECIPE_TRANSLATION_URL="https://translation.example/";process.env.RECIPE_TRANSLATION_KEY="fixture-key";
 try{
  globalThis.fetch=async(input,options)=>{assert.equal(String(input),"https://translation.example/translate");const body=JSON.parse(String(options?.body));assert.equal(body.source,"auto");assert.equal(body.target,"de");assert.equal(body.api_key,"fixture-key");return new Response(JSON.stringify({translatedText:"Die Kartoffeln schälen."}))};
  assert.equal(await translateRecipeText("Peel the potatoes."),"Die Kartoffeln schälen.");
 }finally{globalThis.fetch=original;if(oldEndpoint===undefined)delete process.env.RECIPE_TRANSLATION_URL;else process.env.RECIPE_TRANSLATION_URL=oldEndpoint;if(oldKey===undefined)delete process.env.RECIPE_TRANSLATION_KEY;else process.env.RECIPE_TRANSLATION_KEY=oldKey}
});
