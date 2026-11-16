(()=>{'use strict';
const $=id=>document.getElementById(id),status=s=>{$('status').textContent=s};
let client=null,canonicalId=null,nickname='',channel=null,lastSent=0,submitting=false;
const settings=$('nickname-settings');
const adminTools=$('admin-tools');
$('nickname-link').addEventListener('click',()=>{settings.open=true});
function openLinkedPanel(){
 const panels={'#nickname-registration':settings,'#admin-tools':adminTools};
 const panel=panels[location.hash];
 if(panel){
  panel.open=true;
  requestAnimationFrame(()=>panel.scrollIntoView({block:'start'}));
 }
}
adminTools.addEventListener('toggle',()=>{
 const frame=$('admin-frame');
 if(adminTools.open&&!frame.hasAttribute('src')){
  frame.src='./admin.html?v=chat-only';
  frame.hidden=false;
 }
});
window.addEventListener('hashchange',openLinkedPanel);
openLinkedPanel();
function element(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n}
function draw(m){const box=element('div',undefined,'bubble'+(m.user_id===canonicalId?' mine':''));box.dataset.id=m.id;
 const meta=element('div',undefined,'meta');
 if(m.guild_title)meta.append(element('span',m.guild_title,'guild-title'));
 meta.append(m.nickname+' · '+new Date(m.created_at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}));
 box.append(meta,element('div',m.body));
 if(m.user_id===canonicalId){const b=element('button','삭제','danger');b.type='button';b.onclick=async()=>{if(!confirm(window.mindSearchCommunityText?.('이 메시지를 삭제할까요?') ?? '이 메시지를 삭제할까요?'))return;const r=await client.from('chat_messages').delete().eq('id',m.id).eq('user_id',canonicalId);if(r.error)status('삭제 실패: '+r.error.message);else box.remove()};box.append(b)}
 $('messages').append(box);$('messages').scrollTop=$('messages').scrollHeight;
}
async function refresh(){const r=await client.from('chat_messages').select('id,user_id,nickname,guild_title,body,created_at').order('created_at',{ascending:false}).limit(100);if(r.error)throw r.error;$('messages').replaceChildren();r.data.reverse().forEach(draw)}
async function subscribe(){if(channel)await client.removeChannel(channel);channel=client.channel('mind-search-chat').on('postgres_changes',{event:'*',schema:'public',table:'chat_messages'},async payload=>{
 if(payload.eventType==='DELETE'){try{await refresh()}catch(e){status('대화 목록 갱신 실패: '+e.message)}return}
 if(payload.eventType==='INSERT'&&!$('messages').querySelector('[data-id="'+payload.new.id+'"]'))draw(payload.new);
 }).subscribe(s=>{if(s==='SUBSCRIBED')status('실시간 채팅에 연결됐습니다.');if(s==='CHANNEL_ERROR'||s==='TIMED_OUT')status('실시간 연결이 불안정합니다. 새로고침해 주세요.')})}
window.addEventListener('mind-search-profile-ready',async event=>{
 ({client,canonicalId,nickname}=event.detail);
 $('join').hidden=true;
 $('room').classList.remove('hidden');
 status('고유 닉네임 '+nickname+'으로 입장했습니다.');
 try{await refresh();await subscribe()}
 catch(e){status('채팅방 연결 실패: '+e.message)}
},{once:true});
$('compose').onsubmit=async e=>{e.preventDefault();if(submitting||!client||!canonicalId)return;const body=$('message').value.trim();if(!body)return;if(Date.now()-lastSent<5000){status('메시지는 5초 간격으로 보내 주세요.');return}submitting=true;$('send').disabled=true;try{const r=await client.from('chat_messages').insert({user_id:canonicalId,nickname,body});if(r.error)throw r.error;lastSent=Date.now();$('message').value='';status('메시지를 보냈습니다.');await refresh()}catch(err){status('전송 실패: '+err.message)}finally{submitting=false;$('send').disabled=false}};
})();