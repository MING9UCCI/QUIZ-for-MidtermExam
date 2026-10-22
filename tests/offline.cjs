const {chromium,webkit,devices}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const engine=process.env.QUIZ_ENGINE||'chromium';
(async()=>{
 let disconnected=false;
 const root=process.cwd();
 const server=http.createServer(async(req,res)=>{
   if(disconnected){req.socket.destroy();return;}
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const filename=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
   if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   try{const body=await fs.readFile(filename);const ext=path.extname(filename);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[ext]||'application/octet-stream');res.end(body);}catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await(engine==='webkit'?webkit:chromium).launch({...(engine==='chromium'&&process.env.QUIZ_BROWSER_PATH?{executablePath:process.env.QUIZ_BROWSER_PATH}:{}),headless:true});
 const context=await browser.newContext({...devices['iPhone 17 Pro'],acceptDownloads:true});const page=await context.newPage();
 await page.goto(url);await page.locator('.world-card').first().waitFor();
 await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 disconnected=true;await page.reload();await page.locator('[data-action="learn"]').tap();await page.locator('[data-lab="ai-knn"]').tap();await page.locator('[data-lab-action="k"][data-lab-value="3"]').tap();
 assert.ok((await page.locator('.lab-readout').innerText()).includes('예측: B'));
 await page.locator('#settings-open').tap();const downloadPromise=page.waitForEvent('download');await page.locator('#export').tap();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'midterm-quest-records.json');const exported=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.ok(exported.lessons['ai-knn'].state.marks[3]);await page.getByRole('button',{name:'설정 닫기'}).tap();
 await page.locator('.brand').tap();await page.locator('[data-action="learn"]').tap();await page.locator('.lesson-card[data-lab="se-risk"]').tap();for(const a of ['risk-plan','risk-scan'])await page.locator(`[data-lab-action="${a}"]`).tap();await page.locator('[data-lab-action="risk-test"][data-lab-value="api"]').tap();assert.ok((await page.locator('.lab-readout').innerText()).includes('1.4'));
 await page.locator('.brand').tap();await page.locator('[data-subject="db"]').tap();await page.locator('[data-action="start"]').tap();await page.locator('.q-panel h1').waitFor();
 console.log(`PASS ${engine}: network-outage reload, cached SE class, concept modules and quiz bank, touch controls, JSON record download.`);await browser.close();await new Promise(resolve=>server.close(resolve));
})().catch(e=>{console.error(e);process.exit(1)});
