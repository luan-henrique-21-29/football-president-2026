import assert from 'node:assert/strict';
import {assignPlayersToFormation,positionFit} from '../src/lineup-state.js';
import {exactCoachSelection} from '../src/exact-lineup.js';
import {applyRosterIntegrity} from '../src/roster-integrity.js';

const p=(id,name,sub,overall,extra={})=>({id:String(id),name,position:/back|defender/i.test(sub)?'Defender':/mid/i.test(sub)?'Midfield':/goal/i.test(sub)?'Goalkeeper':'Attack',subPosition:sub,overall,energy:95,form:75,...extra});
const players=[
 p('gk','GK','Goalkeeper',84),
 p('lb','Natural LB','Left-Back',78),p('rb','Natural RB','Right-Back',79),p('cb1','CB One','Centre-Back',91),p('cb2','CB Two','Centre-Back',89),p('cb3','CB Three','Centre-Back',88),
 p('cm1','CM One','Central Midfield',86),p('cm2','CM Two','Central Midfield',84),p('dm','DM','Defensive Midfield',83),p('am','AM','Attacking Midfield',82),
 p('lw','Raphinha','Left Winger',88),p('rw','Lamine Yamal','Right Winger',93,{starterPriority:70,realLifeStarter:true}),p('rw2','Reserve RW','Right Winger',84,{starterPriority:100,realLifeStarter:true}),p('st','CF','Centre-Forward',86),p('st2','CF2','Centre-Forward',80)
];
assert.ok(positionFit(players.find(x=>x.id==='lb'),'LB')>positionFit(players.find(x=>x.id==='rb'),'LB'),'left-back must fit LB better than a right-back');
assert.ok(positionFit(players.find(x=>x.id==='rw'),'RW')>positionFit(players.find(x=>x.id==='lw'),'RW'),'right winger must fit RW better than a left winger');
const assigned=assignPlayersToFormation(players,'4-3-3');
const map=Object.fromEntries(assigned.map(x=>[x.key,x.playerId]));
assert.equal(map.LB,'lb','natural left-back must start at LB even when spare centre-backs have higher OVR');
assert.equal(map.RB,'rb','natural right-back must start at RB even when spare centre-backs have higher OVR');
assert.equal(map.RW,'rw','highest-OVR natural right winger must start at RW even if a lower-OVR winger has stronger historical starter priority');
assert.equal(map.LW,'lw','left winger must stay on the left side');
const base={preferredFormation:'4-3-3',rotation:.35,reason:'Rodízio',starters:players.slice(0,11),coachProfile:{},setPieces:{captain:players[6]}};
const exact=exactCoachSelection(base,players,{fixture:{date:'2026-08-19'}});
assert.equal(exact.starters.length,11);assert.ok(exact.starters.some(x=>x.id==='rw'&&x.assignedSlot==='RW'),'Yamal-style elite RW must be in the XI at his natural side');
const lewa=p('38253','Robert Lewandowski','Centre-Forward',83,{currentClubId:'131',currentClubName:'FC Barcelona',contractExpiration:'2026-06-30'}),ferran=p('398184','Ferran Torres','Right Winger',84,{currentClubId:'583',currentClubName:'Paris Saint-Germain'}),rodri=p('357565','Rodri','Defensive Midfield',88,{currentClubId:'131',currentClubName:'FC Barcelona'});
applyRosterIntegrity([lewa,ferran,rodri]);
assert.equal(lewa.currentClubId,'FREE');assert.equal(ferran.currentClubId,'131');assert.equal(rodri.currentClubId,'281');
console.log('Exact lineup and roster integrity tests passed');
