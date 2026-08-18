const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const DAY=86400000;
function monthsUntil(date,from=new Date()){if(!date)return null;const end=new Date(`${String(date).slice(0,10)}T12:00:00Z`);if(Number.isNaN(end.getTime()))return null;return Math.max(0,Math.round((end-from)/2629800000))}
function monthsSince(date,from=new Date()){if(!date)return null;const d=new Date(`${String(date).slice(0,10)}T12:00:00Z`);if(Number.isNaN(d.getTime()))return null;return Math.max(0,Math.round((from-d)/2629800000))}
const round=v=>Math.max(100000,Math.round(v/100000)*100000);
export function transferPricingContext(player,basePrice=0){
 const market=Math.max(100000,Number(player?.marketValue)||0),lastFee=Math.max(0,Number(player?.lastTransferFee)||0),contractMonths=monthsUntil(player?.contractExpiration),sinceTransfer=monthsSince(player?.lastTransferDate),age=Number(player?.age??26),potential=Number(player?.potential||player?.overall||70),overall=Number(player?.overall||65);
 let multiplier=1.06;
 if(contractMonths!=null){if(contractMonths<=6)multiplier*=.68;else if(contractMonths<=12)multiplier*=.79;else if(contractMonths<=24)multiplier*=.98;else if(contractMonths>=48)multiplier*=1.24;else if(contractMonths>=36)multiplier*=1.14}
 if(age<=22&&potential>=overall+3)multiplier*=1.13;else if(age>=32)multiplier*=.9;if(overall>=86)multiplier*=1.09;
 let reference=market*multiplier;
 if(lastFee>0&&sinceTransfer!=null&&sinceTransfer<=30){const recentFloor=lastFee*(sinceTransfer<=12?1.03:.92);reference=Math.max(reference,recentFloor)}
 if(sinceTransfer!=null&&sinceTransfer<=6&&lastFee>0)reference*=1.035;
 const base=Math.max(0,Number(basePrice)||0);if(base)reference=reference*.72+base*.28;
 return{marketValue:market,lastTransferFee:lastFee,lastTransferDate:player?.lastTransferDate||'',contractUntil:player?.contractExpiration||'',contractMonths,sinceTransfer,askingPrice:round(clamp(reference,market*.55,market*2.05)),source:lastFee>0?'mercado + contrato + última transferência':'mercado + contrato'}
}
export function realisticAskingPrice(player,basePrice=0){return transferPricingContext(player,basePrice).askingPrice}
