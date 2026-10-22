import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shuffle,normalize,makeQueue,gradeChoice} from '../engine.js';
const bank=JSON.parse(readFileSync(new URL('../assets/questions.json',import.meta.url)));
test('180 unique questions; DB/AI 40 and SE 100; valid sources and answers',()=>{
 assert.equal(bank.length,180);assert.equal(new Set(bank.map(q=>q.id)).size,180);
 for(const s of ['db','ai','se'])assert.equal(bank.filter(q=>q.subject===s).length,s==='se'?100:40);
 for(const q of bank){assert.ok(q.page>0);assert.ok(q.source.endsWith('.pdf'));assert.ok(q.explanation.length>15);assert.ok(!q.source.includes('Chapter 7'));if(q.type==='mc'){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.answer));}if(q.type==='ox')assert.ok(['O','X'].includes(q.answer));if(q.type==='short')assert.ok(q.aliases.length);}
});
test('shuffle preserves every answer and correct grading across 100 shuffled rounds',()=>{
 for(let i=0;i<100;i++)for(const q of bank.filter(q=>q.type!=='short')){const shuffled=shuffle(q.options);assert.deepEqual([...shuffled].sort(),[...q.options].sort());for(const o of shuffled)assert.equal(gradeChoice(q,o),o===q.answer);}
});
test('sessions have no repeated questions, respect size, and never mutate source bank',()=>{
 const before=JSON.stringify(bank);assert.equal(makeQueue(bank,10).length,10);assert.equal(makeQueue(bank,'all').length,180);assert.equal(makeQueue(bank.slice(0,3),20).length,3);const q=makeQueue(bank,'all');assert.equal(new Set(q.map(x=>x.id)).size,180);assert.equal(JSON.stringify(bank),before);assert.deepEqual(makeQueue([],10),[]);
});
test('short-answer comparison normalizes whitespace, case, and Unicode',()=>{assert.equal(normalize(' ＤＢＭＳ '),'dbms');assert.equal(normalize('작업 패키지'),normalize('작업패키지'));});
test('calculation answers are independently checked',()=>{
 const find=s=>bank.find(q=>q.question.includes(s));assert.equal(find('오차가 1, -5').answer.split(' / ')[0],String([1,-5,3,3].reduce((s,v)=>s+v*v,0)/4));assert.equal(find('다음 상태 최대 Q값').answer.split(' / ')[0],String(2+.9*10));assert.equal(find('두 클래스의 비율').answer.split(' / ')[0],String(1-(.5**2+.5**2)));assert.equal(find('이 경로의 확률').answer.split(' / ')[0],(.2*.7).toFixed(2));
});
