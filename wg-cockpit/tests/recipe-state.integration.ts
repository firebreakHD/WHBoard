import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {GET,PUT} from "../src/app/api/state/route";
test("adopted recipes persist independently of grocery items until explicitly completed",async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),"whboard-recipe-state-"));const previous=process.env.WG_DATA_DIR;process.env.WG_DATA_DIR=directory;
 const write=async(key:string,value:unknown)=>{const response=await PUT(new Request("http://localhost/api/state",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({key,value})}));assert.equal(response.status,200,`${key} must be accepted`)};
 try{
  const recipe={id:"fixture-recipe",name:"Gemüsesuppe",image:"https://images.example/suppe.jpg",ingredients:[{name:"Karotten",amount:"2 Stück"}],instructions:["Die Karotten kochen."]};
  await write("recipeLibrary",[recipe]);await write("addedRecipeIds",[recipe.id]);await write("recipeFavorites",[recipe.id]);await write("recipeUseCounts",{[recipe.id]:1});await write("myRecipes",[]);await write("shoppingDiscoverTab","recipes");
  await write("shoppingItems",[{id:"carrots",name:"Karotten"}]);await write("shoppingItems",[]);
  const state=await(await GET()).json();assert.deepEqual(state.addedRecipeIds,[recipe.id]);assert.deepEqual(state.recipeLibrary,[recipe]);
  await write("addedRecipeIds",[]);const done=await(await GET()).json();assert.deepEqual(done.addedRecipeIds,[]);assert.deepEqual(done.recipeLibrary,[recipe]);assert.deepEqual(done.recipeFavorites,[recipe.id]);
 }finally{if(previous===undefined)delete process.env.WG_DATA_DIR;else process.env.WG_DATA_DIR=previous;await rm(directory,{recursive:true,force:true})}
});
