import fs from 'node:fs';
import assert from 'node:assert/strict';

const shell=fs.readFileSync('src/shell.js','utf8');
const shellV2=fs.readFileSync('src/shell-v2.js','utf8');
const mobile=fs.readFileSync('src/mobile-shell.js','utf8');
const app=fs.readFileSync('src/app.js','utf8');
const contracts=fs.readFileSync('src/contracts-page.js','utf8');
const viewer=fs.readFileSync('src/match-viewer.js','utf8');

assert.doesNotMatch(shell,/\['finances'|\['jobs'|\['staff'|\['facilities'/,'secondary spreadsheet pages must not return to the main nav');
assert.doesNotMatch(shellV2,/\['jobs'|\['finances'|\['staff'|\['facilities'/,'secondary pages must stay out of the extra desktop nav');
assert.doesNotMatch(mobile,/\['finances'|\['staff'|\['facilities'|\['jobs'/,'secondary pages must stay out of the mobile menu');
assert.match(app,/removedPages/,'old saved routes must be redirected safely');
assert.match(app,/contracts:contractsPage/,'contracts must remain a core route');
assert.match(contracts,/NEGOCIAÇÃO DE CONTRATO/,'contract negotiation must be present');
assert.match(contracts,/Contraproposta/,'agent counteroffers must remain functional');
assert.match(viewer,/match-viewer-v10/,'the current match viewer must use the clearer key-event layer');
console.log('core focus regression tests passed');
