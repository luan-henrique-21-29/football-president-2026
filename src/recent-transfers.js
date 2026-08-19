// Manual transfer overrides are intentionally empty.
// The game uses the refreshed datapack plus separately verified roster integrity corrections.
// Never add speculative transfers here: an incorrect override corrupts both club squads and market logic.
export const RECENT_CONFIRMED_TRANSFERS=[];

export function applyRecentTransfers(){return[]}
export function seedRecentTransfers(save){
 save.worldTransferMarket??={negotiations:[],completed:[],failed:[]};
 save.worldTransferMarket.negotiations??=[];save.worldTransferMarket.completed??=[];save.worldTransferMarket.failed??=[];
 return save.worldTransferMarket;
}
