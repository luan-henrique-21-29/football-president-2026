import assert from 'node:assert/strict';

const shell=await import('../src/shell-v2.js');
const market=await import('../src/market-v4.js');
const contracts=await import('../src/contracts-page.js');
const core=await import('../src/core-actions.js');
const viewer=await import('../src/match-viewer.js');

assert.equal(typeof shell.frame,'function');
assert.equal(typeof market.marketPage,'function');
assert.equal(typeof market.bindMarketV4,'function');
assert.equal(typeof contracts.contractsPage,'function');
assert.equal(typeof contracts.bindContractsPage,'function');
assert.equal(typeof core.bindCoreActions,'function');
assert.equal(typeof viewer.showMatchViewer,'function');
console.log('core module imports passed');
