export * from './game-v9.js';
import {askingPrice as baseAskingPrice} from './game-v9.js';
import {realisticAskingPrice} from './transfer-pricing.js';
export function askingPrice(player){return realisticAskingPrice(player,baseAskingPrice(player))}
