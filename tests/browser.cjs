const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;const file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',file.endsWith('.webp')?'image/webp':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try{
const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/english-playroom/firebase-security.js',r=>r.fulfill({contentType:'text/javascript',body:"export const enableAppCheck=()=>null,apiHeaders=async()=>({'Content-Type':'application/json',Authorization:'Bearer mock-id-token','X-Firebase-AppCheck':'mock-app-check'});"}));
await page.route('**/english-playroom/coin-reward.js*',r=>r.fulfill({contentType:'text/javascript',body:"window.coinClaims=[];window.EnglishPlayroomCoins={awardTalk:async id=>window.coinClaims.push(id)};"}));
await page.route('**/firebase-app.js',r=>r.fulfill({contentType:'text/javascript',body:'export const initializeApp=()=>({});'}));
await page.route('**/firebase-auth.js',r=>r.fulfill({contentType:'text/javascript',body:`let callback;const user={getIdToken:async()=> 'mock-id-token'};export const getAuth=()=>({});export class GoogleAuthProvider{};export const onAuthStateChanged=(a,cb)=>{callback=cb;cb(null)};export const signInWithPopup=async()=>callback(user);export const signOut=async()=>callback(null);`}));
let requests=[],mode='ok';
await page.route('**/api/talk-quest',async r=>{assert.equal(r.request().headers().authorization,'Bearer mock-id-token');assert.equal(r.request().headers()['x-firebase-appcheck'],'mock-app-check');requests.push(r.request().postDataJSON());if(mode==='error')return r.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'通信を確認してください。'})});if(mode==='slow')await new Promise(r=>setTimeout(r,800));const b=r.request().postDataJSON();await r.fulfill({contentType:'application/json',body:JSON.stringify({reply:'I like hiking. My sister likes it too.',translation:'ハイキングが好きです。姉も好きです。',hints:['Where do you hike?','How about your sister?','Do you like mountains?'],inviteQuestion:b.turn%3===0})});});
await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Google'));
assert.equal(await page.locator('.topic').count(),80);assert.ok(await page.locator('#name').textContent());
await page.waitForFunction(()=>document.querySelector('#avatar img')?.naturalWidth>0);
assert.doesNotMatch(await page.locator('#attributes').textContent(),/白人|アジア人|アフリカンアメリカン/);
const portraitBefore=await page.locator('#avatar img').getAttribute('src');
for(const id of ['young-woman','young-man','adult-woman','adult-man','senior-woman','senior-man']){
  assert.equal(await page.evaluate(async id=>{const image=new Image();image.src=`assets/portraits/${id}.webp`;await image.decode();return image.naturalWidth;},id),384);
}
await page.locator('#search').fill('富士山');assert.equal(await page.locator('.topic').count(),1);await page.locator('.topic').click();
await page.locator('#message').fill('Yes!');await page.locator('#send').click();await page.waitForFunction(()=>document.querySelector('#error').textContent.includes('ログイン'));assert.equal(requests.length,0);
await page.locator('#login').click();await page.locator('#send').click();await page.waitForFunction(()=>document.querySelectorAll('.bubble').length===3);assert.equal(requests[0].message,'Yes!');
for(let i=0;i<2;i++){await page.locator('#message').fill('How about you?');await page.locator('#send').click();await page.waitForFunction(n=>document.querySelectorAll('.bubble').length===n,5+i*2);}
assert.equal(requests[2].turn,3);assert.equal(requests[0].seed,requests[2].seed);assert.match(await page.locator('#invitation').textContent(),/あなたから質問/);
assert.equal(await page.locator('#avatar img').getAttribute('src'),portraitBefore);
await page.locator('#help summary').click();await page.locator('#hints button').first().click();assert.equal(await page.locator('#message').inputValue(),'Where do you hike?');
await page.locator('.bubble details summary').first().click();assert.ok(await page.locator('.bubble details').first().getAttribute('open')!==null);
mode='error';await page.locator('#send').click();await page.locator('#retry').waitFor({state:'visible'});assert.equal(await page.locator('#message').inputValue(),'Where do you hike?');assert.equal(await page.locator('.bubble.user').count(),3);
mode='ok';await page.locator('#retry').click();await page.waitForFunction(()=>document.querySelectorAll('.bubble.user').length===4);
await page.locator('#finish').click();assert.match(await page.locator('#summary').textContent(),/4回/);await page.locator('#resume').click();assert.equal(await page.locator('.bubble.user').count(),4);
await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results/chat-mobile.png'),fullPage:true});
mode='slow';await page.locator('#message').fill('Goodbye');await page.locator('#send').click();await page.locator('#finish').click();await page.waitForTimeout(1000);assert.equal(await page.locator('#ending').isVisible(),true);assert.match(await page.locator('#summary').textContent(),/4回/);
await page.locator('#again').click();assert.equal(await page.locator('#chooser').isVisible(),true);assert.equal(await page.locator('#shuffle').isEnabled(),true);await page.locator('#search').fill('');
await page.setViewportSize({width:1280,height:900});await page.screenshot({path:path.join(root,'test-results/topics-desktop.png'),fullPage:true});
assert.equal(await page.evaluate(()=>window.coinClaims.length),4);
assert.equal(await page.evaluate(()=>new Set(window.coinClaims).size),1);
assert.deepEqual(errors,[]);console.log('Browser checks passed: 80 themes, persona, login, history, question turns, hints, translations, retry, free ending/resume, cancellation, mobile overflow.');
}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
