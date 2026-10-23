import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LESSONS} from '../lessons.js';
import {initialLesson,lessonGoals,reduceLesson} from '../lesson-engine.js';
import {SG_ORDER,TULIP,STAR,ganFake,ganVerdict,mooreAt,moorePoints,diffusionGrid,promptMatch,transferTicks,LINKS,TRANSFER_BLOCKS,initialSG} from '../sg-engine.js';
import {sgBoard} from '../sg-classes.js';
const bank=JSON.parse(readFileSync(new URL('../assets/questions.json',import.meta.url)));
const sg=bank.filter(q=>q.subject==='sg');
const step=(id,s,a,v)=>reduceLesson(id,s,a,v).state;
const run=(id,actions)=>actions.reduce((s,[a,v])=>step(id,s,a,v),initialLesson(id));
const done=(id,s)=>lessonGoals(id,s).every(g=>g[1]);

test('SG bank: 100 questions over six lecture weeks, all three types, real lecture sources',()=>{
 assert.equal(sg.length,100);
 const chapters=new Set(sg.map(q=>q.chapter));assert.equal(chapters.size,6);
 for(const c of chapters)assert.ok(sg.filter(q=>q.chapter===c).length>=15,c);
 for(const t of ['mc','ox','short'])assert.ok(sg.filter(q=>q.type===t).length>=15,t);
 for(const q of sg){assert.match(q.source,/^반도체와 생성형 AI 디자인_[2-7]주차 [1-3]차시\.pdf$/);assert.ok(!q.source.includes('1주차'));assert.equal(q.chapter.slice(0,1),q.source.match(/_(\d)주차/)[1]);}
 assert.equal(new Set(sg.map(q=>q.question)).size,100);
});

test('SG calculation answers are independently checked',()=>{
 const find=s=>sg.find(q=>q.question.includes(s));
 assert.equal(find('1초에 몇 개의 픽셀').aliases[0],String(1920*1080*60));
 assert.equal(find('시냅스(파라미터) 수').aliases[0],String(4*5+5*1));
 assert.equal(find('파라미터가 150B').aliases[0],'150');
});

test('SG stages are ordered by lecture week and render a board for every state',()=>{
 assert.deepEqual(LESSONS.filter(l=>l.subject==='sg').map(l=>l.id),SG_ORDER);
 const esc=s=>String(s),button=(a,v,label)=>`<button data-lab-action="${a}" data-lab-value="${v}">${label}</button>`;
 for(const l of LESSONS.filter(l=>l.subject==='sg')){assert.ok(l.source.endsWith('.pdf'));const html=sgBoard(l,initialSG(l.id),{button,esc});assert.ok(html.includes('data-lab-action'));}
 assert.equal(sgBoard({id:'db-query'},{}, {button,esc}),null);
});

test('GAN: generator learns only from being caught, discriminator only from being fooled',()=>{
 const id='sg-gan';let s=initialLesson(id);
 assert.equal(TULIP.length,49);assert.deepEqual(ganFake(5),TULIP);assert.notDeepEqual(ganFake(0),TULIP);
 s=step(id,s,'gan-gen');assert.equal(s.g,1);assert.equal(ganVerdict(s.g,s.d),'fooled');assert.ok(s.marks.fooled);
 const blocked=reduceLesson(id,s,'gan-gen');assert.equal(blocked.state.g,1);assert.equal(blocked.positive,false);
 s=step(id,s,'gan-disc');assert.equal(s.d,1);assert.ok(s.marks.caught);
 assert.equal(step(id,step(id,s,'gan-disc'),'gan-disc').d,2,'discriminator cannot race ahead by two');
 for(let i=0;i<4;i++){s=step(id,s,'gan-gen');s=step(id,s,'gan-disc');}
 assert.equal(s.g,5);assert.equal(s.d,5);assert.ok(done(id,s));
});

test('Moore: doubling every two years and both scales must be observed after ten years',()=>{
 assert.deepEqual(mooreAt(10),{doublings:5,count:32,price:1/32});assert.deepEqual(moorePoints(4).map(p=>p.count),[1,2,4]);
 const id='sg-moore';let s=run(id,[['scale','log']]);assert.equal(s.marks.log,undefined);
 for(let i=0;i<6;i++)s=step(id,s,'moore-step');assert.equal(s.years,10);
 assert.ok(s.marks.log);assert.equal(done(id,s),false);
 s=step(id,s,'scale','linear');assert.ok(done(id,s));
});

test('Diffusion: seed reproduces, different seed varies, CFG changes prompt match',()=>{
 assert.deepEqual(diffusionGrid(2,10,'mid'),diffusionGrid(2,10,'mid'));
 assert.notDeepEqual(diffusionGrid(1,10,'mid'),diffusionGrid(2,10,'mid'));
 assert.notDeepEqual(diffusionGrid(1,10,'high'),diffusionGrid(2,10,'high'));
 assert.ok(diffusionGrid(1,0,'mid').every(c=>c.startsWith('n')));assert.ok(!diffusionGrid(1,10,'mid').some(c=>c.startsWith('n')));
 for(const seed of [1,2,3])assert.ok(promptMatch(diffusionGrid(seed,10,'high'))>promptMatch(diffusionGrid(seed,10,'low')));
 assert.equal(STAR.length,100);
 const id='sg-diffusion',ten=s=>{for(let i=0;i<10;i++)s=step(id,s,'denoise');return s;};
 let s=ten(initialLesson(id));assert.ok(s.marks.complete);assert.equal(s.marks.reproduced,undefined);
 s=ten(step(id,s,'seed',1));assert.ok(s.marks.reproduced);
 s=ten(step(id,s,'seed',2));assert.ok(s.marks.varied);
 s=ten(step(id,s,'cfg','low'));s=ten(step(id,s,'cfg','high'));assert.ok(done(id,s));
 assert.equal(reduceLesson(id,s,'denoise').positive,false);
});

test('Memory: three tiers plus DRAM vs HBM transfer of the same data',()=>{
 assert.equal(transferTicks('dram'),TRANSFER_BLOCKS/(LINKS.dram.lanes*LINKS.dram.speed));assert.equal(transferTicks('hbm'),1);assert.ok(transferTicks('dram')>transferTicks('hbm'));
 const id='sg-memory';let s=run(id,[['fetch','sram'],['fetch','dram'],['fetch','nand'],['fetch','cloud']]);assert.deepEqual(s.fetched,['sram','dram','nand']);
 s=step(id,s,'transfer','dram');assert.equal(done(id,s),false);s=step(id,s,'transfer','hbm');assert.ok(done(id,s));
});
