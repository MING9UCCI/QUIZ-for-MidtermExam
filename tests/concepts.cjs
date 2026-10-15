const {chromium,webkit,devices}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=process.env.QUIZ_ENGINE||'chromium';
(async()=>{
 const browser=await(engine==='webkit'?webkit:chromium).launch({...(engine==='chromium'&&process.env.QUIZ_BROWSER_PATH?{executablePath:process.env.QUIZ_BROWSER_PATH}:{}),headless:true});
 const context=await browser.newContext({...devices['iPhone 17 Pro'],reducedMotion:'reduce'});
 // Verify migration from the previous quiz-only release without erasing progress.
 await context.addInitScript(()=>{if(!localStorage.getItem('midterm-quest-v1'))localStorage.setItem('midterm-quest-v1',JSON.stringify({version:1,xp:125,solved:['db-001'],wrong:{},records:[],settings:{timer:false,sound:false},session:null}));});
 const page=await context.newPage(), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('midterm-quest-v1')));
 async function fits(){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal page overflow');}
 async function tap(selector){await page.locator(selector).tap();await fits();}
 async function op(action,value){await tap(`[data-lab-action="${action}"]${value===undefined?'':`[data-lab-value="${value}"]`}`);}
 async function open(id){await page.locator('.brand').tap();await tap('[data-action="learn"]');await tap(`[data-lab="${id}"]`);}
 let completed=0;
 async function finish(id){await page.locator('.lesson-complete').waitFor();const s=await state();assert.ok(s.lessons[id].completed);completed++;assert.equal(s.xp,125+completed*30);assert.deepEqual(s.solved,['db-001']);await fits();}
 await page.goto(process.env.QUIZ_BASE_URL||'http://localhost:4173');await page.locator('.world-card').first().waitFor();assert.equal((await state()).xp,125);
 await tap('[data-subject="db"]');await page.locator('#question-type').selectOption('mc');await tap('[data-action="start"]');const quizQueue=(await state()).session.queue;await tap('[data-action="leave"]');
 await open('db-query');await page.locator('[data-lab-change="dept"]').selectOption('컴퓨터');await op('column','id');await op('column','dept');assert.equal(await page.locator('.lab-table tbody tr').count(),2);assert.equal(await page.locator('.lab-table thead th').count(),1);await page.reload();await tap('[data-lab="db-query"]');assert.equal(await page.locator('.lab-table thead th').count(),1);await page.locator('[data-lab-change="dept"]').selectOption('all');await op('column','id');await op('column','dept');await finish('db-query');
 await open('db-key');for(const example of ['duplicate','empty','new']){await tap(`[data-fill-key="${example}"]`);await tap('#lab-register button[type="submit"]');}await finish('db-key');assert.equal((await state()).lessons['db-key'].state.rows.length,5);
 await open('db-join');await page.locator('#join-key').selectOption('name');await op('connect');assert.equal(await page.locator('.lab-table').last().locator('tbody tr').count(),1);await page.locator('#join-key').selectOption('id');await op('connect');assert.equal(await page.locator('.lab-table').last().locator('tbody tr').count(),3);await op('join-kind','left');await finish('db-join');assert.equal(await page.locator('.null-value').count(),2);
 await open('ai-knn');for(const k of [1,3,5])await op('k',k);await finish('ai-knn');
 await open('ai-kmeans');await op('assign');await op('move');await op('assign');await finish('ai-kmeans');
 await open('ai-regression');await op('a',1);await op('a',1);await op('b',1);await finish('ai-regression');assert.ok((await page.locator('.lab-readout').innerText()).includes('MSE 0.00'));
 await open('se-cycle');await op('stage',2);assert.equal((await state()).lessons['se-cycle'].state.order.length,0);for(let i=0;i<5;i++)await op('stage',i);await finish('se-cycle');
 await open('se-wbs');await op('task','interview');await op('folder','design');assert.equal(Object.keys((await state()).lessons['se-wbs'].state.placed).length,0);for(const [task,folder] of [['interview','requirements'],['screen','design'],['cases','test'],['needs','requirements'],['database','design'],['report','test']]){await op('task',task);await op('folder',folder);}await finish('se-wbs');
 await open('se-check');for(const action of ['talk','spec','test','build'])await op(action);await page.locator('#book-query').fill('자료구조');await tap('#lab-search button');await finish('se-check');assert.equal(await page.locator('.book-demo li').count(),1);
 // Reward is one-time even after restarting and completing a stage again.
 await open('ai-knn');await tap('[data-restart-lesson="ai-knn"]');for(const k of [1,3,5])await op('k',k);assert.equal((await state()).xp,395);
 await page.locator('.brand').tap();assert.deepEqual((await state()).session.queue,quizQueue);await tap('[data-action="resume"]');await page.locator('.q-panel').waitFor();await tap('[data-action="leave"]');await tap('[data-action="learn"]');
 for(const name of ['iPhone 17 Pro','iPhone 17 Pro landscape']){await page.setViewportSize(devices[name].viewport);await fits();await open('ai-kmeans');await fits();}
 await page.setViewportSize(devices['iPhone 17 Pro'].viewport);
 await open('db-query');for(const width of [320,360,390,402,768,1280]){await page.setViewportSize({width,height:740});await fits();}
 await page.setViewportSize(devices['iPhone 17 Pro'].viewport);
 if(process.env.QUIZ_SCREENSHOTS){fs.mkdirSync(process.env.QUIZ_SCREENSHOTS,{recursive:true});await open('ai-kmeans');await page.screenshot({path:`${process.env.QUIZ_SCREENSHOTS}/concept-${engine}.png`,fullPage:true});await page.locator('.brand').tap();await tap('[data-action="learn"]');await page.screenshot({path:`${process.env.QUIZ_SCREENSHOTS}/map-${engine}.png`,fullPage:true});}
 assert.deepEqual(errors,[]);
 console.log(`PASS ${engine}: iPhone 17 Pro touch/portrait/landscape, 9 complete simulations, wrong-action hints, migration, independent quiz resume, one-time XP, reload, 320–1280px, no page errors.`);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
