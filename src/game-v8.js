import * as core from './game-v7.js';
import {enrichPossessionDetails} from './match-possession.js';
export * from './game-v7.js';
export function simulateFixture(args){return enrichPossessionDetails(core.simulateFixture(args),args)}
