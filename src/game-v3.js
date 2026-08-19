export * from './game-v13.js';
import {askingPrice as baseAskingPrice} from './game-v13.js';
import {realisticAskingPrice} from './transfer-pricing.js';
export function askingPrice(player){return realisticAskingPrice(player,baseAskingPrice(player))}
