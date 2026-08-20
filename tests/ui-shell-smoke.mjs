import fs from 'node:fs';
import assert from 'node:assert/strict';

const index=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('src/app.js','utf8');
const shell=fs.readFileSync('src/shell-v2.js','utf8');
const mobile=fs.readFileSync('src/mobile-shell.js','utf8');
const css=fs.readFileSync('game-shell-v2.css','utf8');
const viewer=fs.readFileSync('src/match-viewer.js','utf8');

assert.match(app,/bindCoreActions/,'simplified core action layer must be active');
assert.doesNotMatch(app,/actions-board|bindPlan2|bindPlan2Extras|bindQuickCenter|bindAccessibility|installCustomSelectUI/,'legacy runtime layers must not load in the core app');
for(const route of ['dashboard','squad','coach','calendar','market','contracts','inbox','notifications','settings'])assert.match(shell,new RegExp(`'${route}'`),`core route ${route} must stay in desktop navigation`);
for(const removed of ['finances','jobs','staff','facilities','world','scouting','standings'])assert.doesNotMatch(shell,new RegExp(`'${removed}'`),`${removed} must stay out of the simplified desktop navigation`);
for(const removed of ['finances','jobs','staff','facilities','world','scouting','standings'])assert.doesNotMatch(mobile,new RegExp(`'${removed}'`),`${removed} must stay out of the simplified mobile navigation`);
assert.match(css,/html,body\{[^}]*overflow:hidden!important/s,'browser page must stay locked');
assert.match(css,/\.content\{[^}]*overflow:auto!important/s,'game content must scroll inside the game');
assert.match(viewer,/match-viewer-v8/,'stable match viewer must be the active layer');
assert.doesNotMatch(index,/plan2\.css|match-plan2\.css|contract-plan2\.css|custom-select\.css/,'obsolete conflicting styles must not load');
const styles=(index.match(/rel="stylesheet"/g)||[]).length;
assert.ok(styles<=22,`stylesheet stack should stay compact, got ${styles}`);
console.log('simplified ui shell smoke tests passed');
