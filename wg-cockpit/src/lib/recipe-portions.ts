const fractionValues:Record<string,number>={"½":.5,"¼":.25,"¾":.75,"⅓":1/3,"⅔":2/3,"⅛":.125};
function numberValue(value:string){if(fractionValues[value]!==undefined)return fractionValues[value];const parts=value.trim().split(/\s+/);const last=parts.pop()!;const fraction=last.split("/");return (parts.length?Number(parts[0]):0)+(fraction.length===2?Number(fraction[0])/Number(fraction[1]):Number(last.replace(",",".")))}
function display(value:number){return Number(value.toFixed(2)).toLocaleString("de-AT",{maximumFractionDigits:2})}
const amountPattern="(?:\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d+(?:[.,]\\d+)?|[½¼¾⅓⅔⅛])";
export function scaleRecipeAmount(amount:string,factor:number){
 if(!Number.isFinite(factor)||factor<=0||factor===1)return amount;
 const match=amount.trim().match(new RegExp(`^(${amountPattern})(?:\\s*([–-]|bis)\\s*(${amountPattern}))?(\\s*)(.*)$`,"u"));
 if(!match)return amount;
 return `${display(numberValue(match[1])*factor)}${match[3]?` ${match[2]} ${display(numberValue(match[3])*factor)}`:""}${match[5]?` ${match[5]}`:""}`;
}
// Only ingredient quantities scale. Oven temperatures, durations, step numbers
// and dimensions remain the recipe's original cooking instructions.
export function scaleRecipeStep(step:string,factor:number){
 if(!Number.isFinite(factor)||factor<=0||factor===1)return step;
 const amount=amountPattern;
 const units="(?:Kilogramm|Gramm|Milliliter|Zentiliter|Liter|Esslöffel|Teelöffel|EL|TL|kg|mg|g|ml|cl|dl|l|Stück|Stk\\.?|Prisen?|Päckchen|Packungen?|Dosen?|Bund|Bünde|Zehen?|Scheiben?|Tassen?|Becher|Eier|Ei|Eigelb|Eiweiß|Zwiebeln?|Karotten?|Tomaten?|Kartoffeln?|Äpfel|Apfel|Zitronen?|Limetten?|Bananen?)";
 return step.replace(new RegExp(`(?<![\\p{L}\\d/.,])(${amount})(?:\\s*([–-]|bis)\\s*(${amount}))?\\s*(${units})(?![\\p{L}])`,"giu"),(_match,first:string,separator:string|undefined,last:string|undefined,unit:string)=>`${display(numberValue(first)*factor)}${last?` ${separator} ${display(numberValue(last)*factor)}`:""} ${unit}`);
}
