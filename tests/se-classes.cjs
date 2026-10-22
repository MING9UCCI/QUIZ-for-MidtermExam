const {chromium,webkit,devices}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=process.env.QUIZ_ENGINE||'chromium';
(async()=>{
 const {initialLesson,reduceLesson,WBS_TASKS}=await import('../lesson-engine.js');
 const replay=(id,actions)=>actions.reduce((s,[a,v])=>reduceLesson(id,s,a,v).state,initialLesson(id));
 const legacy={
  'se-cycle':{completed:true,state:replay('se-cycle',[0,1,2,3,4].map(i=>['stage',i]))},
  'se-wbs':{completed:true,state:replay('se-wbs',WBS_TASKS.flatMap(t=>[['task',t.id],['folder',t.group]]))},
  'se-check':{completed:true,state:replay('se-check',[['talk'],['spec'],['test'],['build'],['search','자료구조']])}
 };
 const bank=JSON.parse(fs.readFileSync('assets/questions.json','utf8'));
 const browser=await(engine==='webkit'?webkit:chromium).launch({...(engine==='chromium'&&process.env.QUIZ_BROWSER_PATH?{executablePath:process.env.QUIZ_BROWSER_PATH}:{}),headless:true});
 const context=await browser.newContext({...devices['iPhone 17 Pro'],reducedMotion:'reduce'});
 await context.addInitScript(legacy=>{if(!localStorage.getItem('midterm-quest-v1'))localStorage.setItem('midterm-quest-v1',JSON.stringify({version:1,xp:125,solved:['se-001'],wrong:{'se-002':{selected:'다시 볼 답',at:1}},records:[],settings:{timer:false,sound:false},session:null,lessons:legacy}));},legacy);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('midterm-quest-v1')));
 const fits=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
 const tap=async selector=>{await page.locator(selector).tap();await fits();};
 const op=async(a,v)=>tap(`[data-lab-action="${a}"]${v===undefined?'':`[data-lab-value="${v}"]`}`);
 const open=async id=>{await page.locator('.brand').tap();await tap('[data-action="learn"]');await tap('[data-learn-subject="se"]');await tap(`.lesson-card[data-lab="${id}"]`);};
 let newCount=0;
 async function finished(id){await page.locator('.lesson-complete').waitFor();newCount++;const s=await state();assert.equal(s.lessons[id].completed,true);assert.equal(s.xp,125+30*newCount+(newCount===7?100:0));assert.deepEqual(s.solved,['se-001']);assert.ok(s.wrong['se-002']);await page.setViewportSize({width:320,height:740});await fits();await page.setViewportSize(devices['iPhone 17 Pro'].viewport);}
 await page.goto(process.env.QUIZ_BASE_URL||'http://localhost:4173');await page.locator('[data-action="learn"]').waitFor();assert.equal((await state()).xp,125);
 await tap('[data-action="learn"]');await tap('[data-learn-subject="se"]');assert.equal(await page.locator('.lesson-card').count(),10);assert.equal(await page.locator('.class-route .done').count(),3);
 await open('se-waterfall');await op('early-review');for(let i=0;i<4;i++)await op('water-build');await op('late-change');await op('water-rework');await finished('se-waterfall');
 await open('se-prototype');await op('interview');await op('prototype-review');assert.equal((await state()).lessons['se-prototype'].state.step,1);await op('feature','search');await op('prototype-review');await op('feature','reserve');await op('prototype-review');await finished('se-prototype');
 await open('se-risk');await op('risk-plan');await op('risk-scan');await op('risk-develop');assert.notEqual((await state()).lessons['se-risk'].state.phase,'develop');await op('risk-test','api');await op('risk-develop');await op('risk-evaluate');await finished('se-risk');
 await open('se-scrum');await op('sprint-pick','search');await op('sprint-pick','reserve');await op('sprint-pick','theme');assert.equal((await state()).lessons['se-scrum'].state.selected.length,2);await op('sprint-start');await op('sprint-day');await op('sprint-request');await op('sprint-day');await op('sprint-day');await op('sprint-review');await op('sprint-retro');await finished('se-scrum');
 await open('se-refactor');await op('refactor-tests');await op('extract');await op('discount');await op('refactor-tests');assert.equal(await page.locator('.test-results .fail').count(),3);await op('restore-price');await op('refactor-tests');assert.equal(await page.locator('.test-results .pass').count(),3);await finished('se-refactor');
 await open('se-planning');await op('plan-start','B');await op('crew',2);await op('plan-start','A');for(let i=0;i<2;i++)await op('plan-day');await op('plan-start','B');await op('plan-start','C');for(let i=0;i<3;i++)await op('plan-day');await op('plan-start','D');await op('plan-day');await finished('se-planning');assert.equal((await state()).lessons['se-planning'].state.day,6);
 if(process.env.QUIZ_SCREENSHOTS){fs.mkdirSync(process.env.QUIZ_SCREENSHOTS,{recursive:true});await page.screenshot({path:`${process.env.QUIZ_SCREENSHOTS}/se-schedule-${engine}.png`,fullPage:true});}
 await open('se-change');await op('direct-patch');await op('release');assert.equal((await state()).lessons['se-change'].state.released,false);await op('change-request');await op('change-impact');await op('change-approve');for(const link of ['design','code','test'])await op('sync-link',link);await op('release');await finished('se-change');assert.equal((await state()).courseBadges.se,true);
 // Reopening already completed legacy classes must not erase progress or award again.
 for(const id of ['se-cycle','se-wbs','se-check']){await open(id);await page.locator('.lesson-complete').waitFor();assert.equal((await state()).xp,435);}
 await page.reload();await tap('[data-action="learn"]');await tap('[data-learn-subject="se"]');assert.equal(await page.locator('.class-route .done').count(),10);assert.ok((await page.locator('.guild-campaign').innerText()).includes('개발 길드 마스터'));assert.equal((await state()).xp,435);
 for(const name of ['iPhone 17 Pro','iPhone 17 Pro landscape']){await page.setViewportSize(devices[name].viewport);await fits();}await page.setViewportSize(devices['iPhone 17 Pro'].viewport);
 if(process.env.QUIZ_SCREENSHOTS)await page.screenshot({path:`${process.env.QUIZ_SCREENSHOTS}/se-campaign-${engine}.png`,fullPage:true});
 // Play every SE question once: all 60 new IDs must load and grade correctly.
 await page.locator('.brand').tap();await tap('[data-subject="se"]');await tap('[data-count="all"]');await tap('[data-action="start"]');assert.equal((await state()).session.queue.length,100);
 for(let i=0;i<100;i++){const s=(await state()).session,q=bank.find(q=>q.id===s.queue[s.index].id);if(q.type==='short'){await page.locator('#short-answer').fill(q.answer.split(' / ')[0]);await tap('[data-action="reveal"]');await tap('[data-self="correct"]');}else{const n=s.queue[s.index].options.indexOf(q.answer);await tap(`[data-option="${n}"]`);}assert.equal((await state()).session.responses.at(-1).correct,true);await tap('[data-action="next"]');}
 await page.locator('.result').waitFor();const end=await state();assert.equal(end.records[0].total,100);assert.equal(end.records[0].responses.filter(r=>r.correct).length,100);assert.equal(end.records[0].xp,1490);assert.equal(end.xp,1925);assert.equal(end.solved.filter(id=>id.startsWith('se-')).length,100);assert.equal(Object.keys(end.wrong).length,0);assert.deepEqual(errors,[]);
 console.log(`PASS ${engine}: SE 3→10 migration, 7 new simulations, one-time 100XP badge, iPhone touch/portrait/landscape/320px, 100 SE questions, results, persisted legacy progress, no page errors.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
