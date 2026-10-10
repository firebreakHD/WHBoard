import test from "node:test";
import assert from "node:assert/strict";
import {NextRequest} from "next/server";
import {GET} from "../src/app/api/recipes/route";

test("provider details translate every visible field and reject hidden seafood",async()=>{
 const original=globalThis.fetch;
 const german:Record<string,string>={"Chicken soup":"Hühnersuppe","Chicken":"Hühnergerichte","British":"Britisch","Add the onions.":"Die Zwiebeln dazugeben.","Then cook for five minutes.":"Danach fünf Minuten kochen.","2 for garnish":"2 zum Garnieren"};
 const meal={idMeal:"123",strMeal:"Chicken soup",strCategory:"Chicken",strArea:"British",strInstructions:"Add the onions. Then cook for five minutes.",strIngredient1:"Onions",strMeasure1:"2 for garnish"};
 let seafood=false;let failed=false;
 try{
  globalThis.fetch=async(input)=>{
   const url=new URL(String(input));
   if(url.hostname==="www.themealdb.com")return Response.json({meals:[{...meal,...(seafood?{strIngredient2:"Fish Sauce",strMeasure2:"1 tbsp"}:{})}]});
   if(url.hostname==="api.mymemory.translated.net"){
    if(failed)return Response.json({responseStatus:429});
    const q=url.searchParams.get("q")!;assert.ok(german[q],`Unexpected translation: ${q}`);
    return Response.json({responseStatus:200,responseData:{translatedText:german[q]}});
   }
   throw new Error(`Unexpected host ${url.hostname}`);
  };
  const response=await GET(new NextRequest("http://localhost/api/recipes?id=mealdb-123"));assert.equal(response.status,200);
  const {recipe}=await response.json();assert.equal(recipe.name,"Hühnersuppe");assert.equal(recipe.category,"Hühnergerichte");assert.equal(recipe.area,"Britisch");assert.deepEqual(recipe.instructions,["Die Zwiebeln dazugeben.","Danach fünf Minuten kochen."]);assert.equal(recipe.ingredients[0].name,"Zwiebeln");assert.equal(recipe.ingredients[0].amount,"2 zum Garnieren");assert.equal(recipe.detailsLoaded,true);assert.equal(recipe.policyVersion,1);
  seafood=true;const excluded=await GET(new NextRequest("http://localhost/api/recipes?id=mealdb-123"));assert.equal(excluded.status,502);assert.match((await excluded.json()).error,/Fisch/);
  seafood=false;failed=true;
  globalThis.fetch=async input=>new URL(String(input)).hostname==="www.themealdb.com"?Response.json({meals:[{...meal,strMeal:"Vegetable stew"}]}):Response.json({responseStatus:429});
  const unavailable=await GET(new NextRequest("http://localhost/api/recipes?id=mealdb-124"));assert.equal(unavailable.status,502);const body=await unavailable.json();assert.match(body.error,/deutsche Übersetzung/);assert.equal(body.recipe,undefined);
 }finally{globalThis.fetch=original}
});

test("search checks Cooklang ingredients before suggesting a seemingly vegetarian card",async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async input=>{
   const url=new URL(String(input));
   if(url.pathname.endsWith("search.php"))return Response.json({meals:[]});
   if(url.pathname==="/api/search")return Response.json({results:[{id:1,title:"Gemüsesuppe",locale:"de"},{id:2,title:"Gemüsesuppe ohne Meerestiere",locale:"de"},{id:3,title:"Gemüsesuppe mit Karotten",locale:"de"}]});
   if(url.pathname==="/api/recipes/1")return Response.json({id:1,title:"Gemüsesuppe",locale:"de",ingredients:[{name:"Fish Sauce"}],content:"Alles verrühren."});
   if(url.pathname==="/api/recipes/3")return Response.json({id:3,title:"Gemüsesuppe mit Karotten",locale:"de",ingredients:[{name:"Karotten",quantity:2,unit:"g"}],content:"Die Karotten kochen."});
   throw new Error(`Unexpected request: ${url}`);
  };
  const response=await GET(new NextRequest("http://localhost/api/recipes?q=Gemüsesuppe&fresh=1"));assert.equal(response.status,200);
  const {recipes}=await response.json();assert.deepEqual(recipes.map((recipe:{id:string})=>recipe.id),["cooklang-3"]);assert.equal(recipes[0].policyVersion,1);
 }finally{globalThis.fetch=original}
});
