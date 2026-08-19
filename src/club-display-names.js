const fold=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

const ALIASES=new Map([
 ['sport club corinthians paulista','Corinthians'],
 ['sc corinthians paulista','Corinthians'],
 ['corinthians paulista','Corinthians'],
 ['associacao chapecoense de futebol','Chapecoense'],
 ['associação chapecoense de futebol','Chapecoense'],
 ['chapecoense sc','Chapecoense'],
 ['club athletico paranaense','Athletico Paranaense'],
 ['athletico paranaense pr','Athletico Paranaense'],
 ['athletico pr','Athletico Paranaense'],
 ['atletico paranaense','Athletico Paranaense'],
 ['clube atletico paranaense','Athletico Paranaense'],
 ['clube atlético paranaense','Athletico Paranaense'],
 ['clube de regatas do flamengo','Flamengo'],
 ['sociedade esportiva palmeiras','Palmeiras'],
 ['sao paulo futebol clube','São Paulo'],
 ['são paulo futebol clube','São Paulo'],
 ['santos futebol clube','Santos'],
 ['gremio foot ball porto alegrense','Grêmio'],
 ['grêmio foot ball porto alegrense','Grêmio'],
 ['sport club internacional','Internacional'],
 ['fluminense football club','Fluminense'],
 ['botafogo de futebol e regatas','Botafogo'],
 ['club de regatas vasco da gama','Vasco da Gama'],
 ['clube de regatas vasco da gama','Vasco da Gama'],
 ['cruzeiro esporte clube','Cruzeiro'],
 ['clube atletico mineiro','Atlético Mineiro'],
 ['clube atlético mineiro','Atlético Mineiro'],
 ['america futebol clube mg','América-MG'],
 ['américa futebol clube mg','América-MG'],
 ['america mineiro','América-MG'],
 ['esporte clube bahia','Bahia'],
 ['fortaleza esporte clube','Fortaleza'],
 ['ceara sporting club','Ceará'],
 ['ceará sporting club','Ceará'],
 ['sport club do recife','Sport'],
 ['sport recife','Sport'],
 ['coritiba foot ball club','Coritiba'],
 ['esporte clube vitoria','Vitória'],
 ['esporte clube vitória','Vitória'],
 ['goias esporte clube','Goiás'],
 ['goiás esporte clube','Goiás'],
 ['cuiaba esporte clube','Cuiabá'],
 ['cuiabá esporte clube','Cuiabá'],
 ['esporte clube juventude','Juventude'],
 ['juventude rs','Juventude'],
 ['mirassol futebol clube','Mirassol'],
 ['red bull bragantino sp','Red Bull Bragantino'],
 ['clube do remo','Remo'],
 ['paysandu sport club','Paysandu'],
 ['avai futebol clube sc','Avaí'],
 ['avai futebol clube','Avaí'],
 ['avaí futebol clube','Avaí'],
 ['figueirense futebol clube','Figueirense'],
 ['associacao atletica ponte preta','Ponte Preta'],
 ['associação atlética ponte preta','Ponte Preta'],
 ['guarani futebol clube sp','Guarani'],
 ['guarani futebol clube','Guarani'],
 ['vila nova futebol clube','Vila Nova'],
 ['criciuma esporte clube','Criciúma'],
 ['criciúma esporte clube','Criciúma'],
 ['gremio novorizontino','Novorizontino'],
 ['grêmio novorizontino','Novorizontino'],
 ['operario ferroviario esporte clube','Operário-PR'],
 ['operário ferroviário esporte clube','Operário-PR'],
 ['athletic club mg','Athletic-MG'],
 ['amazonas futebol clube','Amazonas'],
 ['botafogo futebol clube sp','Botafogo-SP'],
 ['botafogo sp','Botafogo-SP'],
 ['associacao ferroviaria de esportes','Ferroviária'],
 ['associação ferroviária de esportes','Ferroviária'],
 ['club de futebol america rn','América-RN'],
 ['clube nautico capibaribe','Náutico'],
 ['clube náutico capibaribe','Náutico'],
 ['santa cruz futebol clube','Santa Cruz'],
 ['centro sportivo alagoano','CSA'],
 ['clube de regatas brasil','CRB'],
 ['associacao atletica portuguesa','Portuguesa'],
 ['associação atlética portuguesa','Portuguesa'],
 ['associacao portuguesa de desportos','Portuguesa'],
 ['associação portuguesa de desportos','Portuguesa']
].map(([name,label])=>[fold(name),label]));

const TEXT_ALIASES=[
 ['Sport Club Corinthians Paulista','Corinthians'],
 ['SC Corinthians Paulista','Corinthians'],
 ['Associação Chapecoense de Futebol','Chapecoense'],
 ['Associacao Chapecoense de Futebol','Chapecoense'],
 ['Club Athletico Paranaense','Athletico Paranaense'],
 ['Clube Atlético Paranaense','Athletico Paranaense'],
 ['Clube Atletico Paranaense','Athletico Paranaense'],
 ['Atletico Paranaense','Athletico Paranaense'],
 ['Clube de Regatas do Flamengo','Flamengo'],
 ['Sociedade Esportiva Palmeiras','Palmeiras'],
 ['São Paulo Futebol Clube','São Paulo'],
 ['Sao Paulo Futebol Clube','São Paulo'],
 ['Santos Futebol Clube','Santos'],
 ['Grêmio Foot-Ball Porto Alegrense','Grêmio'],
 ['Gremio Foot-Ball Porto Alegrense','Grêmio'],
 ['Sport Club Internacional','Internacional'],
 ['Fluminense Football Club','Fluminense'],
 ['Botafogo de Futebol e Regatas','Botafogo'],
 ['Club de Regatas Vasco da Gama','Vasco da Gama'],
 ['Clube de Regatas Vasco da Gama','Vasco da Gama'],
 ['Cruzeiro Esporte Clube','Cruzeiro'],
 ['Clube Atlético Mineiro','Atlético Mineiro'],
 ['Clube Atletico Mineiro','Atlético Mineiro'],
 ['Esporte Clube Bahia','Bahia'],
 ['Fortaleza Esporte Clube','Fortaleza'],
 ['Ceará Sporting Club','Ceará'],
 ['Ceara Sporting Club','Ceará'],
 ['Sport Club do Recife','Sport'],
 ['Coritiba Foot Ball Club','Coritiba'],
 ['Esporte Clube Vitória','Vitória'],
 ['Esporte Clube Vitoria','Vitória'],
 ['Goiás Esporte Clube','Goiás'],
 ['Goias Esporte Clube','Goiás'],
 ['Cuiabá Esporte Clube','Cuiabá'],
 ['Cuiaba Esporte Clube','Cuiabá']
];

export function clubDisplayName(name){
 const raw=String(name??'').trim();
 if(!raw)return raw;
 return ALIASES.get(fold(raw))||raw;
}

export function replaceClubNamesInText(text){
 let out=String(text??'');
 for(const [from,to] of TEXT_ALIASES)out=out.split(from).join(to);
 return out;
}

function renameClub(club){if(club?.name)club.name=clubDisplayName(club.name);return club}
function renameNews(list){for(const item of list||[]){if(item?.title)item.title=replaceClubNamesInText(item.title);if(item?.body)item.body=replaceClubNamesInText(item.body)}}

export function applyClubDisplayNames({world=null,starter=null,save=null}={}){
 for(const club of starter?.clubs||[])renameClub(club);
 for(const club of world?.clubs||[])renameClub(club);
 const byId=new Map((world?.clubs||starter?.clubs||[]).map(c=>[String(c.id),c.name]));
 for(const p of world?.players||[]){const known=byId.get(String(p.currentClubId));if(known)p.currentClubName=known;else if(p.currentClubName)p.currentClubName=clubDisplayName(p.currentClubName)}
 if(!save)return;
 if(save.clubName)save.clubName=clubDisplayName(save.clubName);
 if(save.clubSnapshot?.name)save.clubSnapshot.name=clubDisplayName(save.clubSnapshot.name);
 if(save.clubOverride?.name)save.clubOverride.name=clubDisplayName(save.clubOverride.name);
 for(const f of save.calendar||[])if(f?.opponentName)f.opponentName=clubDisplayName(f.opponentName);
 for(const m of save.matches||[])if(m?.opponentName)m.opponentName=clubDisplayName(m.opponentName);
 for(const o of save.transferInbox||[]){if(o?.buyerName)o.buyerName=clubDisplayName(o.buyerName);if(o?.sellerName)o.sellerName=clubDisplayName(o.sellerName)}
 for(const l of save.loans||[]){if(l?.buyerName)l.buyerName=clubDisplayName(l.buyerName);if(l?.clubName)l.clubName=clubDisplayName(l.clubName)}
 for(const move of Object.values(save.worldPlayerMoves||{})){if(move?.clubName)move.clubName=clubDisplayName(move.clubName);if(move?.fromClub)move.fromClub=clubDisplayName(move.fromClub);if(move?.fromClubName)move.fromClubName=clubDisplayName(move.fromClubName)}
 const market=save.worldTransferMarket||{};
 for(const deal of [...(market.negotiations||[]),...(market.completed||[]),...(market.failed||[])]){if(deal?.fromClub)deal.fromClub=clubDisplayName(deal.fromClub);if(deal?.toClub)deal.toClub=clubDisplayName(deal.toClub)}
 renameNews(save.news);renameNews(save.worldNews);
}

export const clubNameAliases=ALIASES;
