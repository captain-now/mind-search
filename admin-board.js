(function(){
'use strict';
const config={url:'https://iqohtsakhfnwtlbarjut.supabase.co',anonKey:'sb_publishable_MZU5P4iF3BmY27FSee2ntw_mVO9Lf5w'};
const client=window.supabase.createClient(config.url,config.anonKey,{auth:{storageKey:'mind-search-admin-auth',persistSession:true,autoRefreshToken:true}});
const byId=id=>document.getElementById(id),login=byId('login'),dashboard=byId('dashboard'),status=byId('status'),reportsEl=byId('reports');
function msg(value){status.textContent=value}
function el(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n}
async function authorized(){
 const {data,error}=await client.auth.getUser();
 if(error||!data.user)return false;
 const r=await client.rpc('board_admin_code_authorized');
 if(r.error)throw r.error;
 return r.data===true;
}
const turnstileSiteKey='0x4AAAAAAF4XQ_wl1XONk2be';
let captchaToken=null,captchaWidget=null;
function loadCaptcha(){
 const start=()=>{
  if(!window.turnstile)return;
  captchaWidget=window.turnstile.render('#adminCaptcha',{
   sitekey:turnstileSiteKey,
   callback:token=>{captchaToken=token;},
   'expired-callback':()=>{captchaToken=null;},
   'error-callback':()=>{captchaToken=null;msg('보안 인증을 완료해 주세요.')}
  });
 };
 if(window.turnstile){start();return}
 const script=document.createElement('script');
 script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
 script.onload=start;
 script.onerror=()=>msg('보안 인증 화면을 불러오지 못했습니다. 새로고침해 주세요.');
 document.head.append(script);
}
function resetCaptcha(){
 captchaToken=null;
 if(window.turnstile&&captchaWidget!==null)window.turnstile.reset(captchaWidget);
}
async function ensureSession(){
 const {data}=await client.auth.getUser();
 if(data?.user)return;
 if(!captchaToken)throw Error('먼저 보안 인증을 완료해 주세요.');
 const r=await client.auth.signInAnonymously({options:{captchaToken}});
 resetCaptcha();
 if(r.error)throw r.error;
}
async function refresh(){
 const r=await client.from('board_reports').select('id,post_id,comment_id,reason,details,created_at,status').order('created_at',{ascending:false}).limit(100);
 if(r.error)throw r.error;
 reportsEl.replaceChildren();
 if(!r.data.length){reportsEl.append(el('p','접수된 신고가 없습니다.'));return}
 for(const item of r.data){
  const article=el('article'),targetTable=item.post_id?'board_posts':'board_comments',targetId=item.post_id||item.comment_id;
  const reason={spam:'스팸/광고',harassment:'괴롭힘/욕설',privacy:'개인정보 침해',other:'기타'}[item.reason]||item.reason;
  article.append(el('strong',reason+' · '+item.status),el('small','접수 '+new Date(item.created_at).toLocaleString()),el('small','대상 '+(item.post_id?'게시글':'댓글')+' · '+targetId));
  if(item.details)article.append(el('p',item.details));
  const target=await client.from(targetTable).select(item.post_id?'title,body':'body').eq('id',targetId).maybeSingle();
  if(!target.error&&target.data)article.append(el('p',(target.data.title?target.data.title+' — ':'')+target.data.body));
  else article.append(el('p','대상 내용이 삭제되었거나 조회할 수 없습니다.'));
  if(item.status==='pending'){
   for(const [state,label] of [['resolved','처리 완료'],['dismissed','기각']]){
    const b=el('button',label);b.onclick=async()=>{b.disabled=true;try{
     const result=await client.from('board_reports').update({status:state,reviewed_at:new Date().toISOString()}).eq('id',item.id);
     if(result.error)throw result.error;await refresh();msg('신고 상태를 변경했습니다.');
    }catch(e){msg('처리 실패: '+e.message)}finally{b.disabled=false}};article.append(b);
   }
  }
  if(item.status==='dismissed'){
   const rejected=el('button','기각됨');rejected.disabled=true;rejected.title='이미 기각 처리된 신고입니다.';article.append(rejected);
  }
  if(item.status==='resolved'){
   const resolved=el('button','처리 완료됨');resolved.disabled=true;article.append(resolved);
  }
  if(target.data){
   const del=el('button','대상 삭제');del.className='danger';del.onclick=async()=>{if(!confirm('신고된 콘텐츠를 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.'))return;del.disabled=true;try{
    const result=await client.from(targetTable).delete().eq('id',targetId);
    if(result.error)throw result.error;await refresh();msg('대상 콘텐츠 삭제 요청을 처리했습니다.');
   }catch(e){msg('삭제 실패: '+e.message)}finally{del.disabled=false}};article.append(del);
  }
  if(item.status==='dismissed'||item.status==='resolved'){
   const removeReport=el('button','신고 내역 삭제');
   removeReport.className='danger';
   removeReport.onclick=async()=>{
    if(!confirm('이 신고 내역만 삭제할까요? 원본 게시글이나 댓글은 삭제되지 않습니다.'))return;
    removeReport.disabled=true;
    try{
     const result=await client.from('board_reports').delete().eq('id',item.id).in('status',['dismissed','resolved']).select('id');
     if(result.error)throw result.error;
     if(!result.data?.length)throw Error('삭제할 수 있는 완료된 신고 내역이 없습니다.');
     await refresh();msg('신고 내역만 삭제했습니다. 원본 콘텐츠는 유지됩니다.');
    }catch(e){msg('신고 내역 삭제 실패: '+e.message);removeReport.disabled=false}
   };
   article.append(removeReport);
  }
  reportsEl.append(article);
 }
}
async function refreshDeletions(){
 const holder=byId('deletionRequests');
 const r=await client.rpc('board_admin_list_deletion_requests');
 if(r.error)throw r.error;
 holder.replaceChildren();
 if(!r.data.length){holder.append(el('p','대기 중인 계정 삭제 신청이 없습니다.'));return}
 for(const item of r.data){
  const article=el('article');
  article.append(el('strong',item.nickname),el('small','신청일: '+new Date(item.created_at).toLocaleString('ko-KR')),el('small','계정 ID: '+item.user_id));
  const approve=el('button','계정 및 기록 삭제 승인');approve.className='danger';
  const reject=el('button','신청 거절');
  const review=async yes=>{
   if(yes){
    const typed=prompt('이 계정과 게시글·댓글·채팅이 영구 삭제됩니다. 확인하려면 고유 닉네임을 입력하세요: '+item.nickname);
    if(typed!==item.nickname)return;
    if(!confirm('최종 확인: 해당 계정과 모든 기록을 영구 삭제할까요?'))return;
   }else if(!confirm('계정 삭제 신청을 거절할까요?'))return;
   approve.disabled=true;reject.disabled=true;
   try{const x=await client.rpc('board_admin_review_deletion_request',{p_id:item.id,p_approve:yes});if(x.error)throw x.error;msg(yes?'계정 삭제 승인 및 처리 완료':'삭제 신청을 거절했습니다.');await refreshDeletions()}
   catch(e){msg('계정 삭제 처리 실패: '+e.message);approve.disabled=false;reject.disabled=false}
  };
  approve.onclick=()=>review(true);reject.onclick=()=>review(false);
  article.append(approve,reject);holder.append(article);
 }
}
async function refreshNicknameRequests(){
 const holder=byId('nicknameChangeRequests');
 try{
  const result=await client.rpc('board_admin_nickname_change_requests');
  if(result.error)throw result.error;
  holder.replaceChildren();
  if(!result.data.length){holder.append(el('p','대기 중인 고유이름 변경 신청이 없습니다.'));return}
  for(const item of result.data){
   const article=el('article');
   article.append(el('strong',item.old_nickname+' → '+item.new_nickname),
    el('small','신청일: '+new Date(item.created_at).toLocaleString('ko-KR')));
   const approve=el('button','변경 승인');
   const reject=el('button','신청 거절');
   const review=async accepted=>{
    if(!confirm(accepted?item.old_nickname+' 님의 고유이름을 '+item.new_nickname+'(으)로 변경할까요?':'이 고유이름 변경 신청을 거절할까요?'))return;
    approve.disabled=true;reject.disabled=true;
    try{
     const response=await client.rpc('board_admin_review_nickname_change',{p_id:item.id,p_approve:accepted});
     if(response.error)throw response.error;
     msg(accepted?'고유이름을 변경했습니다.':'고유이름 변경 신청을 거절했습니다.');
     await refreshNicknameRequests();
    }catch(error){
     msg('고유이름 변경 처리 실패: '+error.message);
     approve.disabled=false;reject.disabled=false;
    }
   };
   approve.onclick=()=>review(true);reject.onclick=()=>review(false);
   article.append(approve,reject);holder.append(article);
  }
 }catch(error){
  holder.replaceChildren(el('p','고유이름 변경 신청을 불러오지 못했습니다. '+error.message));
 }
}

const guildMode=location.hash==='#guild-management';
const guildForm=byId('guildManageForm'), guildMember=byId('guildMember'), guildPosition=byId('guildPosition');
const guildStatus=byId('guildManageStatus'), guildAssign=byId('guildAssign'), guildRemove=byId('guildRemove');
const guildRefresh=byId('guildRefresh');
const titles=[
 '길드장','부길드장 1','부길드장 2','장로 1','장로 2','장로 3',
 '청룡','백호','주작','현무','지혜제일','신통제일','두타제일','천안제일',
 '해공제일','설법제일','논의제일','지계제일','밀행제일','다문제일',
 '진광대왕','초강대왕','송제대왕','오관대왕','염라대왕',
 '변성대왕','태산대왕','평등대왕','도시대왕','오도전륜대왕'
];
let guildMembers=[],guildBusy=false;
const selectedGuildMember=()=>guildMembers.find(member=>member.id===guildMember.value);
const guildRank=slot=>slot===null?'7단계 길드원':titles[slot-1];
function guildOption(value,label){
 const option=el('option',label);
 option.value=value;
 return option;
}
function renderGuildPositions(){
 const member=selectedGuildMember();
 if(!member)return;
 byId('guildCurrentRank').textContent='현재 직책 · '+guildRank(member.slot);
 const occupied=new Map(guildMembers.filter(item=>item.slot!==null).map(item=>[item.slot,item]));
 guildPosition.replaceChildren(guildOption('','7단계 길드원'));
 titles.forEach((title,index)=>{
  const slot=index+1, holder=occupied.get(slot);
  const isOccupied=holder&&holder.id!==member.id;
  const option=guildOption(String(slot),isOccupied?title+' · '+holder.nickname:title);
  option.disabled=Boolean(isOccupied);
  guildPosition.append(option);
 });
 guildPosition.value=member.slot===null?'':String(member.slot);
}
function setGuildBusy(busy){
 guildBusy=busy;
 guildMember.disabled=busy;
 guildPosition.disabled=busy;
 guildAssign.disabled=busy;
 guildRemove.disabled=busy;
 guildRefresh.disabled=busy;
}
async function loadGuildMembers(keepId=guildMember.value){
 const result=await client.rpc('now_guild_admin_members');
 if(result.error)throw result.error;
 guildMembers=result.data;
 guildMember.replaceChildren(...guildMembers.map(member=>guildOption(member.id,member.nickname+' · '+guildRank(member.slot))));
 if(guildMembers.some(member=>member.id===keepId))guildMember.value=keepId;
 guildForm.hidden=!guildMembers.length;
 renderGuildPositions();
}
async function refreshGuild(){
 if(guildBusy)return;
 setGuildBusy(true);
 guildStatus.textContent='길드원 명단을 불러오는 중이에요.';
 try{
  await loadGuildMembers();
  guildStatus.textContent=guildMembers.length?'길드원 '+guildMembers.length+'명':'아직 가입한 길드원이 없어요.';
 }catch(err){
  guildForm.hidden=true;
  guildStatus.textContent='명단 조회 실패: '+err.message;
 }finally{setGuildBusy(false)}
}
async function saveGuildMember(remove){
 if(guildBusy)return;
 const member=selectedGuildMember();
 if(!member)return;
 const slot=guildPosition.value===''?null:Number(guildPosition.value);
 if(!remove&&slot===member.slot){guildStatus.textContent='변경할 직책을 선택해 주세요.';return}
 if(remove&&!confirm(member.nickname+' 님을 길드에서 탈퇴 처리할까요? 게시판 닉네임과 게시글은 유지됩니다.'))return;
 setGuildBusy(true);
 let saved=false;
 try{
  const result=await client.rpc('now_guild_manage_member',{
   p_member_id:member.id,p_joined_at:member.joined_at,p_expected_slot:member.slot,
   p_new_slot:remove?null:slot,p_remove:remove
  });
  if(result.error)throw result.error;
  saved=true;
  const outcome=remove?member.nickname+' 님을 탈퇴 처리했어요.':member.nickname+' 님의 직책을 '+guildRank(slot)+'(으)로 변경했어요.';
  await loadGuildMembers(member.id);
  guildStatus.textContent=outcome;
 }catch(err){
  if(saved){
   guildForm.hidden=true;
   guildStatus.textContent='변경했어요. 최신 명단을 보려면 명단 새로고침을 눌러 주세요.';
  }else{
   guildStatus.textContent=err.code==='23505'?'이미 임명된 자리예요. 명단을 새로고침해 주세요.':'처리 실패: '+err.message;
  }
 }finally{setGuildBusy(false)}
}
if(guildMode){
 document.title='NOW길드 | 길드원 관리';
 byId('adminReturn').href='./now-guild.html?v=guild-seven-tiers';
 byId('adminReturn').textContent='← 길드 구성표 돌아가기';
 byId('adminTitle').textContent='NOW길드 관리실';
 byId('adminIntro').textContent='운영자 코드 인증 후 길드원의 직책과 가입 상태를 관리할 수 있어요.';
 byId('guild-management').hidden=false;
 byId('board-admin-tools').hidden=true;
 guildMember.onchange=renderGuildPositions;
 guildRefresh.onclick=refreshGuild;
 guildForm.onsubmit=event=>{event.preventDefault();void saveGuildMember(false)};
 guildRemove.onclick=()=>saveGuildMember(true);
}

async function show(){
 try{const ok=await authorized();login.hidden=ok;dashboard.hidden=!ok;
 if(ok){msg('운영자 인증 완료');if(guildMode)await refreshGuild();else{await Promise.all([refresh(),refreshDeletions(),refreshNicknameRequests()])}}
 else{msg('운영자 권한이 있는 계정으로 로그인해야 합니다.')}
 }catch(e){login.hidden=false;dashboard.hidden=true;msg('접근 확인 실패: '+e.message)}
}
byId('loginForm').onsubmit=async event=>{
 event.preventDefault();const button=event.currentTarget.querySelector('button');button.disabled=true;
 try{
  await ensureSession();
  const code=byId('adminCode').value;
  if(code.length!==12||!/[A-Za-z]/.test(code)||!/[0-9]/.test(code)||! /[^A-Za-z0-9]/.test(code))throw Error('영문·숫자·특수문자를 혼합한 12자리 코드를 입력하세요.');
  const result=await client.rpc('board_admin_code_login',{p_code:code});
  if(result.error)throw result.error;
  if(result.data!==true)throw Error('코드가 틀렸거나 입력 제한에 걸렸습니다. 15분 후 다시 시도할 수 있습니다.');
  byId('adminCode').value='';await show();
 }catch(e){msg('로그인 실패: '+e.message);if(captchaToken)resetCaptcha()}finally{button.disabled=false}
};
byId('changeCodeForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const notice=byId('changeCodeStatus');
 const showResult=text=>{notice.textContent=text;msg(text)};
 notice.textContent='';
 const form=e.currentTarget,button=form.querySelector('button');
 const current=byId('currentAdminCode').value,next=byId('newAdminCode').value;
 if(next!==byId('confirmAdminCode').value){showResult('새 코드 확인이 일치하지 않습니다.');return}
 if(next.length!==12||!/[A-Za-z]/.test(next)||!/[0-9]/.test(next)||!/[^A-Za-z0-9]/.test(next)){showResult('새 코드는 영문, 숫자, 특수문자를 포함한 12자리여야 합니다.');return}
 button.disabled=true;
 try{
  const r=await client.rpc('board_admin_change_access_code',{p_current:current,p_new:next});
  if(r.error)throw r.error;
  if(r.data!==true)throw Error('변경 결과를 확인할 수 없습니다.');
  form.reset();showResult('✓ 운영자 비밀번호 변경 성공! 다음 로그인부터 새 코드를 사용하세요.');
 }catch(err){showResult('비밀번호 변경 실패: '+err.message)}
 finally{button.disabled=false}
});
byId('refresh').onclick=async()=>{try{await Promise.all([refresh(),refreshDeletions(),refreshNicknameRequests()])}catch(e){msg('목록 조회 실패: '+e.message)}};
byId('logout').onclick=async()=>{await client.rpc('board_admin_code_logout');await client.auth.signOut();reportsEl.replaceChildren();byId('nicknameChangeRequests').replaceChildren();guildMembers=[];guildMember.replaceChildren();guildForm.hidden=true;await show()};
show();loadCaptcha();
})();