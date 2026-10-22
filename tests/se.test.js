import test from 'node:test';
import assert from 'node:assert/strict';
import {initialSE,reduceSE,seGoals,SE_ORDER,riskScore,sprintEffort,refactorTests} from '../se-engine.js';
import {LESSONS} from '../lessons.js';
const step=(id,s,a,v)=>reduceSE(id,s,a,v).state;
const run=(id,actions)=>actions.reduce((s,[a,v])=>step(id,s,a,v),initialSE(id));
const done=(id,s)=>seGoals(id,s).every(g=>g[1]);
test('SE curriculum has 10 distinct ordered classes and preserves original IDs',()=>{
 assert.deepEqual(LESSONS.filter(l=>l.subject==='se').map(l=>l.id),SE_ORDER);for(const id of ['se-cycle','se-wbs','se-check'])assert.ok(SE_ORDER.includes(id));assert.equal(new Set(SE_ORDER).size,10);
});
test('waterfall compares assumed early correction with four dependent rework outputs',()=>{
 const id='se-waterfall';assert.equal(run(id,[['late-change']]).pending,false);const s=run(id,[['early-review'],...Array.from({length:4},()=>['water-build']),['late-change'],['water-rework']]);assert.equal(s.rework,4);assert.equal(s.effort,8);assert.ok(done(id,s));
});
test('prototype reveals a second need after the first working example and rejects missing functions',()=>{
 const id='se-prototype';let s=run(id,[['prototype-review']]);assert.equal(s.step,0);s=run(id,[['interview'],['prototype-review']]);assert.equal(s.step,1);s=step(id,s,'feature','search');s=step(id,s,'prototype-review');assert.equal(s.step,2);assert.equal(step(id,s,'prototype-review').step,2);s=step(id,s,'feature','reserve');s=step(id,s,'prototype-review');assert.ok(done(id,s));
});
test('spiral risk gate prevents premature engineering and computes reduced risk',()=>{
 const id='se-risk';let s=run(id,[['risk-plan'],['risk-scan']]);assert.ok(Math.abs(riskScore(s)-6.4)<1e-9);assert.notEqual(step(id,s,'risk-develop').phase,'develop');s=step(id,s,'risk-test','api');assert.ok(Math.abs(riskScore(s)-1.4)<1e-9);s=step(id,s,'risk-develop');s=step(id,s,'risk-evaluate');assert.ok(done(id,s));
});
test('sprint limits selected effort; new request stays outside current work; review and retrospective are distinct',()=>{
 const id='se-scrum';let s=run(id,[['sprint-pick','search'],['sprint-pick','reserve'],['sprint-pick','theme']]);assert.equal(sprintEffort(s),5);assert.equal(s.selected.length,2);s=step(id,s,'sprint-start');s=step(id,s,'sprint-day');s=step(id,s,'sprint-request');assert.equal(s.remaining,3);assert.deepEqual(s.selected,['search','reserve']);s=step(id,s,'sprint-day');s=step(id,s,'sprint-day');assert.deepEqual(s.history,[5,3,1,0]);assert.equal(step(id,s,'sprint-retro').retro,false);s=step(id,s,'sprint-review');s=step(id,s,'sprint-retro');assert.ok(done(id,s));
});
test('refactoring preserves real numeric results while discount fails the original test contract',()=>{
 const id='se-refactor';assert.equal(run(id,[['extract']]).extracted,false);let s=run(id,[['refactor-tests'],['extract']]);assert.ok(refactorTests(s).every(r=>r.expected===r.actual));s=step(id,s,'discount');s=step(id,s,'refactor-tests');assert.ok(s.results.every(r=>r.expected!==r.actual));s=step(id,s,'restore-price');s=step(id,s,'refactor-tests');assert.ok(done(id,s));
});
test('schedule enforces dependencies, resource capacity, and six-day parallel critical path',()=>{
 const id='se-planning';let s=initialSE(id);assert.equal(step(id,s,'plan-start','B').running.length,0);s=step(id,s,'crew',2);s=step(id,s,'plan-start','A');for(let i=0;i<2;i++)s=step(id,s,'plan-day');s=step(id,s,'plan-start','B');s=step(id,s,'plan-start','C');for(let i=0;i<3;i++)s=step(id,s,'plan-day');s=step(id,s,'plan-start','D');s=step(id,s,'plan-day');assert.equal(s.day,6);assert.equal(s.finished.length,4);assert.ok(done(id,s));
 let slow=initialSE(id);for(const [task,n]of[['A',2],['B',3],['C',2],['D',1]]){slow=step(id,slow,'plan-start',task);for(let i=0;i<n;i++)slow=step(id,slow,'plan-day');}assert.equal(slow.day,8);assert.equal(done(id,slow),false);
});
test('change release requires approval and all four trace links; impacts cannot be skipped',()=>{
 const id='se-change';assert.equal(run(id,[['release']]).released,false);assert.equal(run(id,[['change-approve']]).approved,false);let s=run(id,[['direct-patch'],['change-request'],['change-impact'],['change-approve']]);assert.equal(step(id,s,'sync-link','test').links.length,1);for(const link of ['design','code','test'])s=step(id,s,'sync-link',link);s=step(id,s,'release');assert.ok(done(id,s));
 const normal=run(id,[['change-request'],['change-impact'],['change-approve'],['sync-link','design'],['sync-link','code'],['sync-link','test'],['release']]);assert.ok(done(id,normal));
});
