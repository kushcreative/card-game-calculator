import assert from 'node:assert/strict';
import {score,newGame,commitRound,cumulative} from '../app/scoring.ts';
for(const [bid,actual,expected] of [[1,4,5],[2,5,7],[4,1,-3],[5,2,-3],[2,2,4],[3,2,-1],[0,0,0]])assert.equal(score({bid:String(bid),actual:String(actual)}),expected);
for(const value of ['', '-1','NaN','Infinity','1.5','1000'])assert.equal(score({bid:value,actual:'4'}),0);
let game=newGame();assert.equal(game.length,5);assert.equal(cumulative(game,'a'),0);
assert.throws(()=>commitRound(game,1,['a'],{a:{bid:'1',actual:'4'}}));
assert.throws(()=>commitRound(game,0,['a'],{a:{bid:'',actual:'4'}}));
for(let i=0;i<5;i++)game=commitRound(game,i,['a'],{a:{bid:'1',actual:'4'}});
assert.equal(cumulative(game,'a'),25);assert.ok(game.every(r=>r.saved));
assert.throws(()=>commitRound(game,5,['a'],{a:{bid:'1',actual:'4'}}));
game=commitRound(game,0,['a'],{a:{bid:'4',actual:'1'}});assert.equal(cumulative(game,'a'),17);
assert.equal(cumulative(newGame(),'a'),0);
console.log('Passed: supplied scoring examples, invalid inputs, five-round limit, ordered saving, cumulative totals, round replacement, reset.');

