import * as core from './game-v10.js';
import {state as appState} from './state.js';
import {enrichMatchManagement} from './match-management.js';
export * from './game-v10.js';
function realOpponentSquad(args){if(args?.opponentSquad?.length>=11)return args.opponentSquad;const id=String(args?.fixture?.opponentId||args?.opponentClub?.id||'');if(!id)return[];return (appState?.world?.players||[]).filter(p=>String(p.currentClubId)===id)}
export function simulateFixture(args={}){const opponentSquad=realOpponentSquad(args),result=core.simulateFixture({...args,opponentSquad});result.opponentSquadSource=opponentSquad.length>=11?'REAL_DATABASE':'SYNTHETIC_FALLBACK';result.opponentSquadCount=opponentSquad.length;return enrichMatchManagement(result,args)}
