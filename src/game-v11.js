import * as core from './game-v10.js';
import {state as appState} from './state.js';
import {enrichMatchManagement} from './match-management.js';
import {exactCoachSelection} from './exact-lineup.js';
export * from './game-v10.js';
function realOpponentSquad(args){if(args?.opponentSquad?.length>=11)return args.opponentSquad;const id=String(args?.fixture?.opponentId||args?.opponentClub?.id||'');if(!id)return[];return (appState?.world?.players||[]).filter(p=>String(p.currentClubId)===id)}
export function simulateFixture(args={}){const opponentSquad=realOpponentSquad(args),result=core.simulateFixture({...args,opponentSquad});if(opponentSquad.length>=11&&result?.opponentPlan){result.opponentPlan=exactCoachSelection(result.opponentPlan,opponentSquad,{fixture:{...(args.fixture||{}),home:!args?.fixture?.home},save:null});result.opponentPlan.selectionSource='EXACT_NATURAL_POSITION'}result.opponentSquadSource=opponentSquad.length>=11?'REAL_DATABASE':'SYNTHETIC_FALLBACK';result.opponentSquadCount=opponentSquad.length;return enrichMatchManagement(result,args)}
