import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const require=createRequire(path.join(appRoot,"package.json"));
const configPath=path.join(appRoot,"config.yaml");
const versionPath=path.join(appRoot,"src/lib/app-version.ts");
const previousConfig=readFileSync(configPath,"utf8");
const previousModule=readFileSync(versionPath,"utf8");
const match=previousConfig.match(/^version:\s*["']?(\d+)\.(\d+)\.(\d+)["']?\s*$/m);
if(!match)throw new Error("Die Add-on-Version in config.yaml fehlt oder ist ungültig.");
const nextVersion=`${match[1]}.${match[2]}.${Number(match[3])+1}`;
const prismaCli=path.join(path.dirname(require.resolve("prisma/package.json")),"build/index.js");
const nextCli=require.resolve("next/dist/bin/next");
let completed=false;
try {
 writeFileSync(configPath,previousConfig.replace(/^version:.*$/m,`version: ${nextVersion}`),"utf8");
 writeFileSync(versionPath,`export const APP_VERSION = "${nextVersion}";\n`,"utf8");
 console.log(`WG Cockpit: neue Add-on-Version ${nextVersion}`);
 for(const [cli,args] of [[prismaCli,["generate"]],[nextCli,["build"]]]){
  const result=spawnSync(process.execPath,[cli,...args],{cwd:appRoot,stdio:"inherit"});
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(`Build fehlgeschlagen (${result.signal||result.status}).`);
 }
 completed=true;
 console.log(`Build erfolgreich. Version ${nextVersion} ist bereit für Commit und Push.`);
} finally {
 if(!completed){writeFileSync(configPath,previousConfig,"utf8");writeFileSync(versionPath,previousModule,"utf8");console.error("Build fehlgeschlagen; die bisherige Add-on-Version wurde wiederhergestellt.");}
}
