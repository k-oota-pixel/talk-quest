import {topics} from './topics.mjs';
import {createPersona} from './persona.mjs';
import {portraitDataUri} from './portraits.mjs';
const $=id=>document.getElementById(id);
let coinReady=Promise.resolve();
const endpoint='https://task-quest.onrender.com/api/talk-quest';
let user=null,authApi=null,persona,topic=null,category='すべて',history=[],turn=0,pending=false,controller=null,failedMessage=null;
function newPartner(){
  persona=createPersona(crypto.getRandomValues(new Uint32Array(1))[0]);
  $('name').textContent=persona.name;
  const portrait=document.createElement('img');
  portrait.src=portraitDataUri(persona.portraitId);
  portrait.alt=`${persona.name}の人物イラスト`;
  portrait.width=384;portrait.height=384;
  portrait.onerror=()=>{const fallback=document.createElement('span');fallback.textContent=persona.name.slice(0,1);fallback.setAttribute('aria-label',`${persona.name}（イラストを読み込めませんでした）`);$('avatar').replaceChildren(fallback);};
  $('avatar').replaceChildren(portrait);
  $('attributes').textContent=`${persona.gender} / ${persona.ageGroup==='ご老人'?'シニア':persona.ageGroup}（${persona.age}歳）`;
  $('personality').textContent=persona.personality;$('bio').textContent=`${persona.home}に暮らしています。好きなこと：${persona.hobby}`;$('intro').textContent=persona.intro;
}
function renderTopics(){const q=$('search').value.trim().toLowerCase();const list=topics.filter(t=>(category==='すべて'||t.category===category)&&`${t.id} ${t.en} ${t.ja}`.toLowerCase().includes(q));$('count').textContent=`${list.length} / 80 テーマ`;$('topics').replaceChildren();for(const t of list){const b=document.createElement('button');b.className='topic';const tag=document.createElement('small'),title=document.createElement('strong'),en=document.createElement('span');tag.textContent=`${String(t.id).padStart(2,'0')} / ${t.category}`;title.textContent=t.ja;en.textContent=t.en;en.lang='en';b.append(tag,title,en);b.onclick=()=>start(t);$('topics').append(b);}}
for(const c of ['すべて',...new Set(topics.map(t=>t.category))]){const b=document.createElement('button');b.textContent=c;b.setAttribute('aria-pressed',String(c===category));b.onclick=()=>{category=c;for(const x of $('filters').children)x.setAttribute('aria-pressed',String(x===b));renderTopics();};$('filters').append(b);}
function message(role,text,translation=''){const el=document.createElement('div');el.className=`bubble ${role}`;const name=document.createElement('small'),p=document.createElement('p');name.textContent=role==='user'?'YOU':persona.name;p.textContent=text;p.lang=role==='user'?'':'en';el.append(name,p);if(translation){const d=document.createElement('details'),s=document.createElement('summary'),j=document.createElement('p');s.textContent='日本語訳を見る';j.textContent=translation;d.append(s,j);el.append(d);}$('messages').append(el);$('messages').scrollTop=$('messages').scrollHeight;}
function hints(items){$('hints').replaceChildren();for(const text of items){const b=document.createElement('button');b.type='button';b.lang='en';b.textContent=text;b.onclick=()=>{$('message').value=text;$('message').focus();};$('hints').append(b);}}
function start(t){if(pending)return;topic=t;history=[];turn=0;failedMessage=null;$('messages').replaceChildren();$('error').textContent='';$('retry').hidden=true;$('message').value='';$('chooser').hidden=true;$('ending').hidden=true;$('chat').hidden=false;$('shuffle').disabled=true;$('chat-title').textContent=t.ja;$('chat-subtitle').textContent=t.en;$('invitation').textContent='まずは短いひとことで大丈夫。';message('assistant',t.en,t.ja);history.push({role:'assistant',text:t.en});hints(['I think...','I like...','How about you?']);$('chat').scrollIntoView({behavior:'smooth',block:'start'});$('message').focus();}
function setPending(value){pending=value;$('send').disabled=value;$('message').disabled=value;$('retry').disabled=value;$('send').textContent=value?'返事を考えています…':'送信する ↗';}
async function send(text){if(pending)return;if(!user){$('error').textContent='会話を続けるには、上の「Googleでログイン」からログインしてください。';return;}failedMessage=text;$('error').textContent='';$('retry').hidden=true;setPending(true);controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),45000);try{const token=await user.getIdToken();const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},signal:controller.signal,body:JSON.stringify({seed:persona.seed,topicId:topic.id,turn:turn+1,message:text,history:history.slice(-20)})});const data=await response.json();if(!response.ok)throw Error(data.error||'返事を取得できませんでした。');if(typeof data.reply!=='string'||!data.reply||!Array.isArray(data.hints))throw Error('返事を読み取れませんでした。');message('user',text);message('assistant',data.reply,data.translation);history.push({role:'user',text},{role:'assistant',text:data.reply});history=history.slice(-20);turn++;const rewardedTopic=topic.id;void coinReady.then(()=>window.EnglishPlayroomCoins?.awardTalk?.(rewardedTopic));$('message').value='';failedMessage=null;hints(data.hints);$('invitation').textContent=data.inviteQuestion?'今度はあなたから質問してみよう。ヒントも使えます。':'返事をしても、相手のことを聞いてもOK。';}catch(e){if(!$('chat').hidden){$('error').textContent=e.name==='AbortError'?'通信に時間がかかりました。入力は残っています。もう一度試せます。':e.message;$('retry').hidden=false;}}finally{clearTimeout(timeout);controller=null;setPending(false);if(!$('chat').hidden)$('message').focus();}}
// Keep IME confirmation separate from submission, including Safari's legacy keyCode.
let messageComposing=false;
$('message').addEventListener('compositionstart',()=>{messageComposing=true;});
$('message').addEventListener('compositionend',()=>{messageComposing=false;});
$('message').addEventListener('keydown',event=>{
  if(event.key!=='Enter'||event.isComposing||messageComposing||event.keyCode===229)return;
  if(event.shiftKey||event.altKey){
    // Alt+Enter does not insert a newline in every browser.
    event.preventDefault();
    const input=$('message');
    if(input.value.length-(input.selectionEnd-input.selectionStart)<input.maxLength){
      input.setRangeText('\n',input.selectionStart,input.selectionEnd,'end');
      input.dispatchEvent(new Event('input',{bubbles:true}));
    }
    return;
  }
  if(event.ctrlKey||event.metaKey)return;
  event.preventDefault();
  if(!event.repeat&&!pending)$('form').requestSubmit($('send'));
});
$('form').onsubmit=e=>{e.preventDefault();const text=$('message').value.trim();if(text)send(text);};$('retry').onclick=()=>{if(failedMessage)send(failedMessage);};
$('finish').onclick=()=>{if(pending)controller?.abort();$('chat').hidden=true;$('ending').hidden=false;$('summary').textContent=`${persona.name}と「${topic.ja}」について、${turn}回やり取りしました。`;$('again').focus();};
$('resume').onclick=()=>{$('ending').hidden=true;$('chat').hidden=false;$('message').focus();};
$('again').onclick=()=>{if(pending)return;history=[];topic=null;$('ending').hidden=true;$('chooser').hidden=false;$('shuffle').disabled=false;$('search').focus();};
$('shuffle').onclick=newPartner;$('search').oninput=renderTopics;$('random').onclick=()=>start(topics[Math.floor(Math.random()*topics.length)]);
$('login').onclick=async()=>{if(!authApi)return;try{if(user)await authApi.signOut(authApi.auth);else await authApi.signInWithPopup(authApi.auth,new authApi.GoogleAuthProvider());}catch{$('status').textContent='ログインできませんでした。ポップアップを許可して、もう一度お試しください。';}};
newPartner();renderTopics();$('status').textContent='テーマは自由に選べます。AIとの会話にはGoogleログインが必要です。';
async function initAuth(){try{const [{initializeApp},a]=await Promise.all([import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js')]);const app=initializeApp({apiKey:'AIzaSyAllLjPcGhygMSEIORXhKZOaDjYvpSJ4EQ',authDomain:'eiken-retry.firebaseapp.com',projectId:'eiken-retry',appId:'1:231308672297:web:5e8b8ede3a0246c2318b38'});coinReady=import('https://k-oota-pixel.github.io/english-playroom/coin-reward.js?v=20261020').catch(()=>null);const auth=a.getAuth(app);authApi={...a,auth};a.onAuthStateChanged(auth,u=>{user=u;$('login').textContent=u?'ログアウト':'Googleでログイン';$('status').textContent=u?'ログイン済み · 準備ができました。好きなテーマを選びましょう。':'テーマは自由に選べます。AIとの会話にはGoogleログインが必要です。';if(!u&&pending)controller?.abort();});}catch{$('status').textContent='ログイン機能に接続できませんでした。通信を確認して再読み込みしてください。';}}
initAuth();
