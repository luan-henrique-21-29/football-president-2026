import fs from 'node:fs';
import assert from 'node:assert/strict';

const app=fs.readFileSync('src/app.js','utf8');
const shell=fs.readFileSync('src/shell-v2.js','utf8');
const mobile=fs.readFileSync('src/mobile-shell.js','utf8');
const core=fs.readFileSync('src/core-actions.js','utf8');
const market=fs.readFileSync('src/market-v4.js','utf8');
const contracts=fs.readFileSync('src/contracts-page.js','utf8');
const viewer=fs.readFileSync('src/match-viewer.js','utf8');

assert.match(app,/bindCoreActions/,'core actions must drive the career');
assert.doesNotMatch(app,/actions-master|actions-board|bindPlan2|bindPlan2Extras|quick-center|accessibility-layer|custom-select/,'removed legacy layers must not return to app startup');
assert.match(shell,/Contratos/);assert.match(shell,/Propostas/);assert.match(shell,/Notificações/);
assert.doesNotMatch(shell,/Mercado Mundial|Olheiros|Empregos|Finanças|Diretoria/);
assert.doesNotMatch(mobile,/Mercado Mundial|Olheiros|Empregos|Finanças|Diretoria/);
assert.match(core,/async function playNext/,'match start must stay functional');
assert.match(core,/function completeMatch/,'match completion must stay functional');
assert.match(core,/function bindCoach/,'coach management must stay functional');
assert.match(core,/function bindInbox/,'incoming offers must stay functional');
assert.match(core,/p2RenewPlayer/,'squad renewal button must route to contracts');
assert.match(market,/evaluateOffer/,'club transfer negotiation must evaluate offers');
assert.match(market,/evaluateContractTerms/,'player contract must be evaluated in transfer negotiation');
assert.match(market,/completeSigning/,'successful transfers must update the career');
assert.match(contracts,/NEGOCIAÇÃO DE CONTRATO/,'renewal negotiation must remain available');
assert.match(contracts,/Contraproposta/,'agent counteroffers must remain functional');
assert.match(viewer,/match-viewer-v8/,'stable viewer layer must stay active');
console.log('core focus regression tests passed');
