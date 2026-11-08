(()=>{'use strict';
const config={url:'https://iqohtsakhfnwtlbarjut.supabase.co',key:'sb_publishable_MZU5P4iF3BmY27FSee2ntw_mVO9Lf5w',siteKey:'0x4AAAAAAF4XQ_wl1XONk2be'};
const $=id=>document.getElementById(id),status=s=>{$('status').textContent=s};
const client=window.supabase.createClient(config.url,config.key,{auth:{storageKey:'mind-search-chat-auth',persistSession:true,autoRefreshToken:true}});
let user=null,nickname='',channel=null,captchaToken='',widget=null,lastSent=0,submitting=false;
function element(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n}
function draw(m){const box=element('div',undefined,'bubble'+(user&&m.user_id===user.id?' mine':''));box.dataset.id=m.id;
 const meta=element('div',m.nickname+' · '+new Date(m.created_at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}),'meta');box.append(meta,element('div',m.body));
 if(user&&m.user_id===user.id){const b=element('button','삭제','danger');b.type='button';b.onclick=async()=>{if(!confirm('이 메시지를 삭제할까요?'))return;const r=await client.from('chat_messages').delete().eq('id',m.id).eq('user_id',user.id);if(r.error)status('삭제 실패: '+r.error.message);else box.remove()};box.append(b)}
 $('messages').append(box);$('messages').scrollTop=$('messages').scrollHeight;
}
async function refresh(){const r=await client.from('chat_messages').select('id,user_id,nickname,body,created_at').order('created_at',{ascending:false}).limit(100);if(r.error)throw r.error;$('messages').replaceChildren();r.data.reverse().forEach(draw)}
async function subscribe(){if(channel)await client.removeChannel(channel);channel=client.channel('mind-search-chat').on('postgres_changes',{event:'*',schema:'public',table:'chat_messages'},async payload=>{
 if(payload.eventType==='DELETE'){try{await refresh()}catch(e){status('대화 목록 갱신 실패: '+e.message)}return}
 if(payload.eventType==='INSERT'&&!$('messages').querySelector('[data-id="'+payload.new.id+'"]'))draw(payload.new);
 }).subscribe(s=>{if(s==='SUBSCRIBED')status('실시간 채팅에 연결됐습니다.');if(s==='CHANNEL_ERROR'||s==='TIMED_OUT')status('실시간 연결이 불안정합니다. 새로고침해 주세요.')})}
function captcha(){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.onload=()=>resolve();s.onerror=()=>reject(Error('보안 인증을 불러오지 못했습니다.'));document.head.append(s)})}
async function start(){try{const session=await client.auth.getUser();if(session.data.user)user=session.data.user;await captcha();widget=window.turnstile.render('#captcha',{sitekey:config.siteKey,callback:t=>{captchaToken=t},'expired-callback':()=>{captchaToken=''},'error-callback':()=>{captchaToken='';status('보안 인증에 실패했습니다.')}});status('닉네임과 보안 인증을 완료해 주세요.')}catch(e){status(e.message)}}
$('joinButton').onclick=async()=>{if(submitting)return;nickname=$('nickname').value.trim();if(nickname.length<2||nickname.length>24){status('닉네임은 2~24자로 입력해 주세요.');return}if(/^(운영자|관리자|admin|administrator|moderator|mind\s*search)$/i.test(nickname)){status('이 닉네임은 사용할 수 없습니다.');return}submitting=true;$('joinButton').disabled=true;try{
 if(!user){if(!captchaToken)throw Error('보안 인증을 완료해 주세요.');const r=await client.auth.signInAnonymously({options:{captchaToken}});if(r.error)throw r.error;user=r.data.user}
 $('join').classList.add('hidden');$('room').classList.remove('hidden');await refresh();await subscribe();status('채팅방에 입장했습니다.')
 }catch(e){$('join').classList.remove('hidden');$('room').classList.add('hidden');status('입장 실패: '+e.message)}finally{submitting=false;$('joinButton').disabled=false;if(widget!==null&&window.turnstile)window.turnstile.reset(widget);captchaToken=''}};
$('compose').onsubmit=async e=>{e.preventDefault();if(submitting)return;const body=$('message').value.trim();if(!body)return;if(Date.now()-lastSent<5000){status('메시지는 5초 간격으로 보내 주세요.');return}submitting=true;$('send').disabled=true;try{const r=await client.from('chat_messages').insert({user_id:user.id,nickname,body});if(r.error)throw r.error;lastSent=Date.now();$('message').value='';status('메시지를 보냈습니다.');await refresh()}catch(err){status('전송 실패: '+err.message)}finally{submitting=false;$('send').disabled=false}};
start();
})();