import {WorldDatabase} from './world.js';
const FLAG=Symbol.for('gcp-roster-integrity-v1');
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const SNAPSHOT='2026-08-19';
const corrections=[
 {name:'Robert Lewandowski',whenClub:'131',clubId:'FREE',club:'Livre',status:'DEPARTED_CONFIRMED',contractExpiration:'2026-06-30',source:'FC Barcelona official departure, 2026-05-16'},
 {name:'Ferran Torres',clubId:'131',club:'FC Barcelona',subPosition:'Centre-Forward',position:'Attack',starterPriority:24,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Rodri',clubId:'281',club:'Manchester City',subPosition:'Defensive Midfield',position:'Midfield',starterPriority:38,source:'Manchester City official 2026/27 squad'},
 {name:'Lamine Yamal',clubId:'131',club:'FC Barcelona',subPosition:'Right Winger',position:'Attack',starterPriority:70,realLifeStarter:true,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Raphinha',clubId:'131',club:'FC Barcelona',subPosition:'Left Winger',position:'Attack',starterPriority:45,realLifeStarter:true,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Pedri',clubId:'131',club:'FC Barcelona',subPosition:'Central Midfield',position:'Midfield',starterPriority:50,realLifeStarter:true,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Pau Cubarsí',clubId:'131',club:'FC Barcelona',subPosition:'Centre-Back',position:'Defender',starterPriority:42,realLifeStarter:true,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Jules Koundé',clubId:'131',club:'FC Barcelona',subPosition:'Right-Back',position:'Defender',starterPriority:42,realLifeStarter:true,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Alejandro Balde',clubId:'131',club:'FC Barcelona',subPosition:'Left-Back',position:'Defender',starterPriority:38,realLifeStarter:true,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Frenkie de Jong',clubId:'131',club:'FC Barcelona',subPosition:'Central Midfield',position:'Midfield',starterPriority:34,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Gavi',clubId:'131',club:'FC Barcelona',subPosition:'Central Midfield',position:'Midfield',starterPriority:30,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Dani Olmo',clubId:'131',club:'FC Barcelona',subPosition:'Attacking Midfield',position:'Midfield',starterPriority:30,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Fermín López',clubId:'131',club:'FC Barcelona',subPosition:'Attacking Midfield',position:'Midfield',starterPriority:32,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Marc Casadó',clubId:'131',club:'FC Barcelona',subPosition:'Defensive Midfield',position:'Midfield',starterPriority:18,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Marc Bernal',clubId:'131',club:'FC Barcelona',subPosition:'Defensive Midfield',position:'Midfield',starterPriority:18,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Ronald Araujo',clubId:'131',club:'FC Barcelona',subPosition:'Centre-Back',position:'Defender',starterPriority:28,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Eric García',clubId:'131',club:'FC Barcelona',subPosition:'Centre-Back',position:'Defender',starterPriority:18,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Gerard Martín',clubId:'131',club:'FC Barcelona',subPosition:'Left-Back',position:'Defender',starterPriority:10,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Héctor Fort',clubId:'131',club:'FC Barcelona',subPosition:'Right-Back',position:'Defender',starterPriority:10,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Roony Bardghji',clubId:'131',club:'FC Barcelona',subPosition:'Right Winger',position:'Attack',starterPriority:10,source:'FC Barcelona official first-team squad, Aug 2026'},
 {name:'Anthony Gordon',clubId:'131',club:'FC Barcelona',subPosition:'Left Winger',position:'Attack',starterPriority:20,source:'FC Barcelona official first-team squad, Aug 2026'}
];
function find(players,row){const key=fold(row.name);return (players||[]).find(p=>fold(p.name)===key)}
export function applyRosterIntegrity(players){const applied=[];for(const row of corrections){const p=find(players,row);if(!p)continue;if(row.whenClub&&String(p.currentClubId)!==String(row.whenClub))continue;if(row.clubId){p.currentClubId=String(row.clubId);p.currentClubName=row.club||p.currentClubName}if(row.position)p.position=row.position;if(row.subPosition)p.subPosition=row.subPosition;if(row.contractExpiration)p.contractExpiration=row.contractExpiration;if(row.status)p.dataStatus=row.status;if(Number(row.starterPriority))p.starterPriority=Number(row.starterPriority);if(row.realLifeStarter)p.realLifeStarter=true;p.rosterIntegritySource=row.source;p.rosterIntegritySnapshot=SNAPSHOT;applied.push(row.name)}return applied}
if(!WorldDatabase.prototype[FLAG]){WorldDatabase.prototype[FLAG]=true;const original=WorldDatabase.prototype.ensurePlayers;WorldDatabase.prototype.ensurePlayers=async function(...args){const players=await original.apply(this,args);const applied=applyRosterIntegrity(players||[]);this.dataMeta={...(this.dataMeta||{}),rosterIntegritySnapshot:SNAPSHOT,rosterIntegrityCorrections:applied.length};return players}}
