export const ROUND_COUNT=5;
export type Entry={bid:string,actual:string};
export type Round={entries:Record<string,Entry>,saved:boolean};
export const valid=(value:string)=>/^\d+$/.test(value)&&Number(value)<=999;
// Exact matches follow the supplied examples: 2 / 2 = +4.
export function score(entry?:Entry){if(!entry||!valid(entry.bid)||!valid(entry.actual))return 0;const bid=Number(entry.bid),actual=Number(entry.actual);return actual>=bid?bid+actual:actual-bid;}
export const blankRound=():Round=>({entries:{},saved:false});
export const newGame=()=>Array.from({length:ROUND_COUNT},blankRound);
export function commitRound(rounds:Round[],index:number,playerIds:string[],entries:Record<string,Entry>){if(!Number.isInteger(index)||index<0||index>=ROUND_COUNT)throw new Error('Invalid round.');if(!playerIds.length||playerIds.some(id=>!entries[id]||!valid(entries[id].bid)||!valid(entries[id].actual)))throw new Error('Enter a bid and actual result for every player (0–999).');if(rounds.slice(0,index).some(r=>!r.saved))throw new Error('Save the earlier rounds first.');return rounds.map((r,i)=>i===index?{entries:structuredClone(entries),saved:true}:r);}
export const cumulative=(rounds:Round[],id:string)=>rounds.reduce((total,round)=>total+(round.saved?score(round.entries[id]):0),0);
