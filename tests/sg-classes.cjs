const {chromium,webkit,devices}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=process.env.QUIZ_ENGINE||'chromium';
(async()=>{
 const bank=JSON.parse(fs.readFileSync('assets/questions.json','utf8'));
 const browser=await(engine==='webkit'?webkit:chromium).launch({...(engine==='chromium'&&process.env.QUIZ_BROWSER_PATH?{executablePath:process.env.QUIZ_BROWSER_PATH}:{}),headless:true});
 const context=await browser.newContext({...devices['iPhone 17 Pro'],reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('midterm-quest-v1')));
 const fits=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
 const tap=async selector=>{await page.locator(selector).tap();await fits();};
 const op=async(a,v)=>tap(`[data-lab-action="${a}"]${v===undefined?'':`[data-lab-value="${v}"]`}`);
 const shot=async name=>{if(process.env.QUIZ_SCREENSHOTS){fs.mkdirSync(process.env.QUIZ_SCREENSHOTS,{recursive:true});await page.screenshot({path:`${process.env.QUIZ_SCREENSHOTS}/${name}-${engine}.png`,fullPage:true});}};
 const open=async id=>{await page.locator('.brand').tap();await tap('[data-action="learn"]');await tap('[data-learn-subject="sg"]');await tap(`.lesson-card[data-lab="${id}"]`);};
 let completed=0;
 async function finished(id){await page.locator('.lesson-complete').waitFor();completed++;const s=await state();assert.equal(s.lessons[id].completed,true);assert.equal(s.xp,30*completed);for(const width of [320,402,768]){await page.setViewportSize({width,height:740});await fits();}await page.setViewportSize(devices['iPhone 17 Pro'].viewport);}
 await page.goto(process.env.QUIZ_BASE_URL||'http://localhost:4173');await page.locator('[data-subject="sg"]').waitFor();
 assert.equal(await page.locator('.world-card').count(),4);assert.ok((await page.locator('[data-subject="sg"]').innerText()).includes('100 QUESTIONS'));await shot('sg-home');
 await tap('[data-action="learn"]');await tap('[data-learn-subject="sg"]');assert.equal(await page.locator('.lesson-card').count(),4);
 await open('sg-gan');await op('gan-gen');await op('gan-gen');assert.equal((await state()).lessons['sg-gan'].state.g,1);assert.ok(await page.locator('.lab-feedback.hint').count());
 await op('gan-disc');for(let i=0;i<4;i++){await op('gan-gen');await op('gan-disc');}await shot('sg-gan');await finished('sg-gan');
 await open('sg-moore');await op('scale','log');for(let i=0;i<5;i++)await op('moore-step');assert.ok((await page.locator('.lab-readout').innerText()).includes('×32'));await shot('sg-moore');await op('scale','linear');await finished('sg-moore');
 await open('sg-diffusion');const ten=async()=>{for(let i=0;i<10;i++)await op('denoise');};
 await ten();await op('seed',1);await ten();await op('seed',2);await ten();await op('cfg','low');await ten();await shot('sg-diffusion');await op('cfg','high');await ten();await finished('sg-diffusion');
 assert.equal(await page.locator('.sg-pixels i').count(),100);
 await open('sg-memory');for(const t of ['sram','dram','nand'])await op('fetch',t);await op('transfer','dram');await op('transfer','hbm');await shot('sg-memory');await finished('sg-memory');
 for(const name of ['iPhone 17 Pro','iPhone 17 Pro landscape']){await page.setViewportSize(devices[name].viewport);await fits();}await page.setViewportSize(devices['iPhone 17 Pro'].viewport);
 // Reload keeps the stage progress, and reopening a finished stage pays no XP twice.
 await page.reload();await open('sg-memory');await page.locator('.lesson-complete').waitFor();assert.equal((await state()).xp,120);
 // Play every SG question once: all 100 IDs must load and grade correctly.
 await page.locator('.brand').tap();await tap('[data-subject="sg"]');assert.equal(await page.locator('#chapter option').count(),7);await tap('[data-count="all"]');await tap('[data-action="start"]');assert.equal((await state()).session.queue.length,100);
 for(let i=0;i<100;i++){const s=(await state()).session,q=bank.find(q=>q.id===s.queue[s.index].id);if(q.type==='short'){await page.locator('#short-answer').fill(q.answer.split(' / ')[0]);await tap('[data-action="reveal"]');await tap('[data-self="correct"]');}else{const n=s.queue[s.index].options.indexOf(q.answer);await tap(`[data-option="${n}"]`);}assert.equal((await state()).session.responses.at(-1).correct,true);if(i===3)await shot('sg-quiz');await tap('[data-action="next"]');}
 await page.locator('.result').waitFor();const end=await state();assert.equal(end.records[0].total,100);assert.equal(end.records[0].responses.filter(r=>r.correct).length,100);assert.equal(end.records[0].xp,1490);assert.equal(end.xp,1610);assert.equal(end.solved.filter(id=>id.startsWith('sg-')).length,100);assert.deepEqual(errors,[]);
 console.log(`PASS ${engine}: 4 worlds, 4 SG simulations with hints, one-time XP, reload, iPhone portrait/landscape/320–768px, all 100 SG questions graded, no page errors.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
