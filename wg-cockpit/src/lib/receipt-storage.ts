import {mkdir,readFile,unlink,writeFile} from "node:fs/promises";
import {randomUUID} from "node:crypto";
import path from "node:path";

const receiptDirectory=()=>path.join(process.env.WG_DATA_DIR||path.join(process.cwd(),".data"),"receipts");
const extensions:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
export async function saveReceipt(file:File){const extension=extensions[file.type];if(!extension)throw new Error("Nur JPG-, PNG- und WebP-Bilder werden unterstützt.");if(file.size>10*1024*1024)throw new Error("Der Beleg darf höchstens 10 MB groß sein.");const receiptId=randomUUID();const directory=receiptDirectory();await mkdir(directory,{recursive:true});await writeFile(path.join(directory,`${receiptId}.${extension}`),Buffer.from(await file.arrayBuffer()),{flag:"wx"});return{receiptId,receiptName:file.name.slice(0,180),receiptType:file.type}}
export async function readReceipt(receiptId:string){if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(receiptId))return null;const directory=receiptDirectory();for(const [extension,type] of Object.entries({jpg:"image/jpeg",png:"image/png",webp:"image/webp"})){try{return{data:await readFile(path.join(directory,`${receiptId}.${extension}`)),type}}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error}}return null}
export async function removeReceipt(receiptId:string){const found=await readReceipt(receiptId);if(!found)return false;const directory=receiptDirectory();for(const extension of ["jpg","png","webp"]){try{await unlink(path.join(directory,`${receiptId}.${extension}`));return true}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error}}return false}
