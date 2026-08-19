export * from './game-v10.js';
import {askingPrice as baseAskingPrice} from './game-v10.js';
import {realisticAskingPrice} from './transfer-pricing.js';
export function askingPrice(player){return realisticAskingPrice(player,baseAskingPrice(player))}
