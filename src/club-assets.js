const fold=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const SPORTING_2026='https://upload.wikimedia.org/wikipedia/commons/e/e7/Sporting_Clube_de_Portugal_2026.svg';
export function clubCrestUrl(club){
 const id=String(typeof club==='object'?(club?.id??''):(club??'')),name=fold(typeof club==='object'?club?.name:''),country=fold(typeof club==='object'?club?.country:'');
 const sporting=id==='336'||((name==='sporting'||name.includes('sporting cp')||name.includes('sporting clube de portugal'))&&(country==='portugal'||!country));
 if(sporting)return SPORTING_2026;
 return id?`https://tmssl.akamaized.net/images/wappen/head/${id}.png`:'';
}
export const crestDataVersion='2026-07-01';
