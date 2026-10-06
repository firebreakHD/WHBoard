import type {ChangeEvent,ClipboardEvent,FocusEvent} from "react";

export function parseMoneyAmount(value:string){
 const cleaned=value.trim().replace(/[^\d,.'’\-]/g,"").replace(/[’']/g,"");
 if(!cleaned)return 0;
 const comma=cleaned.lastIndexOf(",");const dot=cleaned.lastIndexOf(".");let normalized=cleaned;
 if(comma>=0&&dot>=0){const decimal=comma>dot?",":".";normalized=cleaned.replace(decimal===","?/\./g:/,/g,"").replace(decimal,".")}
 else if(comma>=0){const tail=cleaned.length-comma-1;normalized=tail===3?cleaned.replace(/,/g,""):cleaned.replace(/,/g,".")}
 else if(dot>=0){const tail=cleaned.length-dot-1;normalized=tail===3?cleaned.replace(/\./g,""):cleaned}
 const amount=Number(normalized);return Number.isFinite(amount)?Math.round(amount*100)/100:0;
}

export function formatMoneyInput(value:string){
 if(!value.trim())return"";
 const amount=parseMoneyAmount(value);
 return new Intl.NumberFormat("de-AT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(amount);
}

export function moneyInputProps(value:string,onChange:(value:string)=>void){
 return{
  type:"text" as const,inputMode:"decimal" as const,value,
  onChange:(event:ChangeEvent<HTMLInputElement>)=>onChange(event.currentTarget.value),
  onBlur:(event:FocusEvent<HTMLInputElement>)=>onChange(formatMoneyInput(event.currentTarget.value)),
  onPaste:(event:ClipboardEvent<HTMLInputElement>)=>{const pasted=event.clipboardData.getData("text").trim();if(!pasted)return;event.preventDefault();onChange(formatMoneyInput(pasted))},
 };
}
