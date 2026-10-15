const { chromium,webkit,devices }=require('playwright');
const engine=process.env.QUIZ_ENGINE||'chromium';
const fs=require('fs');
const assert=require('node:assert/strict');
const bank=JSON.parse(fs.readFileSync(process.cwd()+'/assets/questions.json','utf8'));
const byId=id=>bank.find(q=>q.id===id);
(async()=>{
 const browser=await(engine==='webkit'?webkit:chromium).launch({...(engine==='chromium'&&process.env.QUIZ_BROWSER_PATH?{executablePath:process.env.QUIZ_BROWSER_PATH}:{}),headless:true});
 const context=await browser.newContext({...devices['iPhone 17 Pro']});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('midterm-quest-v1')));
 async function noOverflow(){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');}
 async function choose(subject,type='mixed',count='10'){await page.locator(`[data-subject="${subject}"]`).click();await page.locator('#question-type').selectOption(type);await page.locator(`[data-count="${count}"]`).click();await page.locator('[data-action="start"]').click();}
 async function solve(correct=true){let s=(await state()).session;let q=byId(s.queue[s.index].id);if(q.type==='short'){await page.locator('#short-answer').fill(correct?q.answer.split(' / ')[0]:'잘 모르겠어요');await page.locator('[data-action="reveal"]').click();assert.equal((await state()).session.responses.length,s.index);await page.keyboard.press('Enter');assert.equal((await state()).session.index,s.index);await page.locator(`[data-self="${correct?'correct':'wrong'}"]`).click();}else{const options=s.queue[s.index].options;const i=options.findIndex(o=>correct?o===q.answer:o!==q.answer);await page.locator(`[data-option="${i}"]`).click();}const after=(await state()).session;assert.equal(after.responses.at(-1).correct,correct);assert.equal(after.responses.length,s.index+1);await noOverflow();await page.locator('[data-action="next"]').click();}
 await page.goto(process.env.QUIZ_BASE_URL||'http://localhost:4173');await page.locator('.world-card').first().waitFor();
 for(const width of [320,360,390,768,1280]){await page.setViewportSize({width,height:844});await noOverflow();}
 await page.setViewportSize({width:390,height:844});
 await choose('db','mc');await solve(false);await solve(true);await page.reload();await page.locator('[data-action="resume"]').click();assert.equal((await state()).session.index,2);for(let i=2;i<10;i++)await solve(true);
 await page.locator('.result').waitFor();assert.equal((await state()).records[0].responses.filter(r=>r.correct).length,9);assert.equal((await state()).records[0].xp,125);assert.equal(Object.keys((await state()).wrong).length,1);
 await page.locator('[data-retry-record]').click();await solve(true);await page.locator('.result').waitFor();assert.equal(Object.keys((await state()).wrong).length,0);
 await page.locator('[data-action="home"]').last().click();await choose('ai','short');for(let i=0;i<10;i++)await solve(i!==0);await page.locator('.result').waitFor();await page.locator('[data-action="home"]').last().click();
 await choose('se','ox');for(let i=0;i<9;i++)await solve(true);await page.locator('.result').waitFor();await page.locator('[data-action="home"]').last().click();
 // Timer expiry: set a valid one-question pending run with an expired deadline.
 await page.clock.install();await page.locator('#settings-open').click();await page.locator('#timer-setting').check();await page.getByRole('button',{name:'설정 닫기'}).click();await choose('db','mc');await page.clock.fastForward(31000);await page.locator('.feedback.bad').waitFor();assert.equal((await state()).session.responses[0].timedOut,true);await page.locator('[data-action="leave"]').click();await page.locator('#settings-open').click();await page.locator('#timer-setting').uncheck();await page.getByRole('button',{name:'설정 닫기'}).click();
 // All questions and every option remain readable in narrow mobile layout.
 await page.setViewportSize({width:320,height:740});await page.locator('[data-subject="db"]').click();await page.locator('[data-count="all"]').click();await page.locator('[data-action="start"]').click();await page.locator('#confirm-yes').click();for(let i=0;i<40;i++)await solve(true);await page.locator('.result').waitFor();
 assert.deepEqual(errors,[]);console.log('PASS: 320–1280px; 71 answered questions; 3 subjects; mixed/MC/OX/short; shuffle grading; self-grade gate; results; wrong retry; resume; XP; timer expiry; zero page errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
