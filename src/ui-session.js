const KEY='club-dynasty-26-ui-session-v2';

export function readUISession(){
  try{
    const raw=sessionStorage.getItem(KEY);
    if(!raw)return null;
    const data=JSON.parse(raw);
    if(!data||typeof data!=='object')return null;
    return data;
  }catch{return null;}
}

export function applyUISession(state,data,hasSave){
  if(!data)return;
  if(hasSave){
    state.screen=data.screen==='cover'?'cover':'game';
    if(typeof data.page==='string'&&data.page)state.page=data.page;
    if(data.selectedSquadPlayerId!=null)state.selectedSquadPlayerId=String(data.selectedSquadPlayerId);
    if(data.selectedMarketPlayerId!=null)state.selectedMarketPlayerId=String(data.selectedMarketPlayerId);
    if(Number.isFinite(Number(data.marketPageIndex)))state.marketPageIndex=Math.max(0,Number(data.marketPageIndex));
  }else{
    if(data.screen==='setup')state.screen='setup';
    if(data.selectedClubId!=null)state.selectedClubId=String(data.selectedClubId);
    if(data.setupFilters&&typeof data.setupFilters==='object')state.setupFilters={...state.setupFilters,...data.setupFilters};
  }
}

export function writeUISession(state,nav={top:0,left:0}){
  try{
    sessionStorage.setItem(KEY,JSON.stringify({
      screen:state.screen,
      page:state.page,
      selectedClubId:state.selectedClubId,
      selectedMarketPlayerId:state.selectedMarketPlayerId,
      selectedSquadPlayerId:state.selectedSquadPlayerId,
      marketPageIndex:state.marketPageIndex,
      setupFilters:state.setupFilters,
      nav:{top:Number(nav?.top)||0,left:Number(nav?.left)||0},
      at:Date.now()
    }));
  }catch{}
}
