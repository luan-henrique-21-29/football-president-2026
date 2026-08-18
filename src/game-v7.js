import * as core from './game-v6.js';
import {enrichMatchResult} from './match-model.js';
export * from './game-v6.js';
export function simulateFixture(args){return enrichMatchResult(core.simulateFixture(args),args)}
