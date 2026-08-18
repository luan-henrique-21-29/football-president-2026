import * as base from './plan2-engine.js';
import {processPlayerPromises} from './player-promises.js';
export const ensurePlan2=base.ensurePlan2;
export const scoutTiers=base.scoutTiers;
export const hireScout=base.hireScout;
export const fireScout=base.fireScout;
export const startScoutAssignment=base.startScoutAssignment;
export const processScouting=base.processScouting;
export const toggleShortlist=base.toggleShortlist;
export const toggleList=base.toggleList;
export const generateIncomingOffer=base.generateIncomingOffer;
export function tickPlan2(save,world,currentClub,date){const result=base.tickPlan2(save,world,currentClub,date),promises=processPlayerPromises(save,date);return{...result,promises,changed:result.changed||promises.length>0}}
