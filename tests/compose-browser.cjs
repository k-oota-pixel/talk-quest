const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
 const page=await browser.newPage();let requests=[];let release;
 await page.route('https://talk.test/**',route=>{
  const file=new URL(route.request().url()).pathname.slice(1)||'index.html';
  let body=fs.readFileSync(path.join(root,file),'utf8');
  if(file==='app.mjs')body=body.replace('initAuth();',"security={apiHeaders:async()=>({'Content-Type':'application/json',Authorization:'Bearer test-token','X-Firebase-AppCheck':'test-app-check'})};user={getIdToken:async()=> 'test-token'};");
  return route.fulfill({body,contentType:file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
 });
 await page.route('https://task-quest.onrender.com/api/talk-quest',async route=>{
  requests.push(route.request().postDataJSON());
  if(requests.at(-1).message==='pending')await new Promise(resolve=>{release=resolve;});
  await route.fulfill({json:{reply:'Hello!',translation:'こんにちは',hints:['How about you?']}});
 });
 await page.goto('https://talk.test/');await page.locator('.topic').first().click();
 const input=page.locator('#message');
 async function sent(text,action){const count=requests.length;await input.fill(text);await action();await page.waitForFunction(()=>!document.getElementById('send').disabled);await input.waitFor();await page.waitForFunction(()=>document.getElementById('message').value==='');assert.equal(requests.length,count+1);assert.equal(requests.at(-1).message,text.trim());}
 await sent('Hello',()=>input.press('Enter'));
 await sent('Button',()=>page.locator('#send').click());
 for(const modifier of ['Alt','Shift']){await input.fill('Hello world');await input.evaluate(el=>el.setSelectionRange(5,6));await input.press(modifier+'+Enter');assert.equal(await input.inputValue(),'Hello\nworld');}
 let count=requests.length;
 for(const properties of [{isComposing:true},{keyCode:229},{ctrlKey:true},{metaKey:true},{repeat:true}]){
  await input.fill('do not send');await input.dispatchEvent('keydown',{key:'Enter',...properties});assert.equal(requests.length,count);
 }
 await input.dispatchEvent('compositionstart');await input.dispatchEvent('keydown',{key:'Enter'});assert.equal(requests.length,count);await input.dispatchEvent('compositionend');
 await sent('変換確定後',()=>input.press('Enter'));
 count=requests.length;await input.fill('   ');await input.press('Enter');await input.fill('');await input.press('Enter');assert.equal(requests.length,count);
 await input.fill('pending');await input.press('Enter');await page.waitForFunction(()=>document.getElementById('send').disabled);await input.dispatchEvent('keydown',{key:'Enter'});assert.equal(requests.length,count+1);release();await page.waitForFunction(()=>!document.getElementById('send').disabled);
 await input.fill('a'.repeat(500));await input.press('Alt+Enter');assert.equal((await input.inputValue()).length,500);
 console.log('PASS: Enter/button submit, Alt/Shift newline and selection replacement, IME flags/composition, modifiers/repeat, empty input, pending guard, maxlength.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

