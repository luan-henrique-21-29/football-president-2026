import assert from 'node:assert/strict';
import {recalculateClubMetricsFromPlayers} from '../src/club-metrics.js';
const clubs=[{id:'1',name:'A',teamOverall:70},{id:'2',name:'B',teamOverall:70}];
const players=[];for(let i=0;i<18;i++)players.push({id:`a${i}`,currentClubId:'1',overall:i<11?88:82,marketValue:10_000_000});for(let i=0;i<18;i++)players.push({id:`b${i}`,currentClubId:'2',overall:i<11?74:69,marketValue:2_000_000});
const world={clubs,players};const changed=recalculateClubMetricsFromPlayers(world);assert.equal(changed,2);assert.ok(clubs[0].teamOverall>clubs[1].teamOverall);assert.ok(clubs[0].teamOverall>=86);assert.equal(world.playerMetricVersion,'gcp-calibrated-v2');console.log('club-rating: ok',clubs.map(c=>[c.name,c.teamOverall]));
