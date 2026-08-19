import assert from 'node:assert/strict';
import {clubDisplayName,applyClubDisplayNames} from '../src/club-display-names.js';

assert.equal(clubDisplayName('Sport Club Corinthians Paulista'),'Corinthians');
assert.equal(clubDisplayName('Associação Chapecoense de Futebol'),'Chapecoense');
assert.equal(clubDisplayName('Atletico Paranaense'),'Athletico Paranaense');
assert.equal(clubDisplayName('Club Athletico Paranaense'),'Athletico Paranaense');
assert.equal(clubDisplayName('Clube de Regatas do Flamengo'),'Flamengo');
assert.equal(clubDisplayName('Sociedade Esportiva Palmeiras'),'Palmeiras');
assert.equal(clubDisplayName('São Paulo Futebol Clube'),'São Paulo');
assert.equal(clubDisplayName('Grêmio Foot-Ball Porto Alegrense'),'Grêmio');
assert.equal(clubDisplayName('Sport Club Internacional'),'Internacional');
assert.equal(clubDisplayName('Club de Regatas Vasco da Gama'),'Vasco da Gama');

const world={clubs:[{id:'199',name:'Sport Club Corinthians Paulista'},{id:'x',name:'Atletico Paranaense'}],players:[{id:'1',currentClubId:'199',currentClubName:'Sport Club Corinthians Paulista'},{id:'2',currentClubId:'x',currentClubName:'Atletico Paranaense'}]};
const save={clubName:'Sport Club Corinthians Paulista',clubSnapshot:{name:'Sport Club Corinthians Paulista'},calendar:[{opponentName:'Atletico Paranaense'}],matches:[{opponentName:'Associação Chapecoense de Futebol'}],news:[{title:'Corinthians x Club Athletico Paranaense',body:'Sport Club Corinthians Paulista enfrenta Club Athletico Paranaense.'}]};
applyClubDisplayNames({world,save});
assert.equal(world.clubs[0].name,'Corinthians');
assert.equal(world.clubs[1].name,'Athletico Paranaense');
assert.equal(world.players[0].currentClubName,'Corinthians');
assert.equal(world.players[1].currentClubName,'Athletico Paranaense');
assert.equal(save.clubName,'Corinthians');
assert.equal(save.calendar[0].opponentName,'Athletico Paranaense');
assert.equal(save.matches[0].opponentName,'Chapecoense');
assert.equal(save.news[0].body,'Corinthians enfrenta Athletico Paranaense.');
console.log('Club display name tests passed');
