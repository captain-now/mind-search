(()=>{'use strict';
const config={url:'https://iqohtsakhfnwtlbarjut.supabase.co',key:'sb_publishable_MZU5P4iF3BmY27FSee2ntw_mVO9Lf5w',siteKey:'0x4AAAAAAF4XQ_wl1XONk2be'};
const $=id=>document.getElementById(id),status=s=>{$('status').textContent=s};
const client=window.supabase.createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true}});
let user=null,nickname='',channel=null,lastSent=0,submitting=false;
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
async function start(){try{
 const session=await client.auth.getUser();
 if(!session.data.user){status('먼저 게시판에서 고유 닉네임을 등록해 주세요.');$('join').innerHTML='<p>게시판에서 고유 닉네임을 등록하면 채팅방에서도 같은 이름을 사용합니다.</p><a href="./board.html">게시판에서 닉네임 등록하기</a>';return}
 user=session.data.user;
 const profile=await client.from('board_profiles').select('nickname').eq('user_id',user.id).maybeSingle();
 if(profile.error)throw profile.error;
 if(!profile.data){status('게시판 닉네임 등록이 필요합니다.');$('join').innerHTML='<p>게시판에서 고유 닉네임을 등록해 주세요.</p><a href="./board.html">게시판으로 이동</a>';return}
 nickname=profile.data.nickname;
 $('join').classList.add('hidden');$('room').classList.remove('hidden');
 await refresh();await subscribe();status('게시판 닉네임 '+nickname+'으로 입장했습니다.');
 }catch(e){status('채팅방 연결 실패: '+e.message)}}
start();
$('compose').onsubmit=async e=>{e.preventDefault();if(submitting)return;const body=$('message').value.trim();if(!body)return;if(Date.now()-lastSent<5000){status('메시지는 5초 간격으로 보내 주세요.');return}submitting=true;$('send').disabled=true;try{const r=await client.from('chat_messages').insert({user_id:user.id,nickname,body});if(r.error)throw r.error;lastSent=Date.now();$('message').value='';status('메시지를 보냈습니다.');await refresh()}catch(err){status('전송 실패: '+err.message)}finally{submitting=false;$('send').disabled=false}};
start();
})();