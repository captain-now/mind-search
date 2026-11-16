/* Chat nickname and account settings. Requires Supabase JS v2 and public project config.
   Never use service_role keys in client-side code. */
(function(){
'use strict';
const cfg=window.MIND_SEARCH_BOARD_CONFIG;
if(!cfg || !/^https:\/\//.test(cfg.url||'') || !cfg.anonKey || !window.supabase){const root=document.getElementById('community');if(root){const p=document.createElement('p');p.setAttribute('role','alert');p.textContent='채팅방 연결을 준비 중입니다. 잠시 후 다시 시도해 주세요.';root.prepend(p)}return;}
const client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});
const root=document.getElementById('community');
if(!root)return;
const profile=document.getElementById('nickname-registration');
const profileStatus=document.getElementById('profile-status');
const chatStatus=document.getElementById('status');
function showNicknameRegistration(target){
 if(location.hash==='#nickname-registration')target.scrollIntoView({block:'start'});
}
function el(tag,txt){const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n}
function setStatus(msg,target=profileStatus){target.textContent=msg}
function enableCommunityChat(){
 window.dispatchEvent(new CustomEvent('mind-search-profile-ready',{detail:{client,canonicalId,nickname:registeredNickname}}));
}
let user=null,registeredNickname=null,canonicalId=null;
const turnstileSiteKey=cfg.turnstileSiteKey;
let captchaToken=null,widgetId=null;
function loadTurnstile(){
 if(window.turnstile)return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.onload=()=>window.turnstile?resolve():reject(Error('Turnstile 초기화 실패'));
  script.onerror=()=>reject(Error('Turnstile 스크립트를 불러오지 못했습니다.'));
  document.head.append(script);
 });
}
async function prepareCaptcha(){
 if(!turnstileSiteKey)throw Error('Turnstile 사이트 키가 설정되지 않았습니다.');
 await loadTurnstile();
 return new Promise((resolve,reject)=>{
  const holder=document.createElement('div');holder.id='boardCaptcha';profile.append(holder);
  widgetId=window.turnstile.render(holder,{
   sitekey:turnstileSiteKey,
   callback:token=>{captchaToken=token;resolve();},
   'expired-callback':()=>{captchaToken=null;setStatus('보안 인증이 만료되었습니다. 다시 인증해 주세요.');},
   'error-callback':()=>{captchaToken=null;setStatus('보안 인증에 실패했습니다. 다시 시도해 주세요.');}
  });
  setStatus('채팅방을 이용하려면 보안 인증을 완료해 주세요.');
  showNicknameRegistration(holder);
 });
}
async function ensureUser(){
 const current=await client.auth.getUser();
 if(current.data.user)return current.data.user;
 profile.closest('details').open=true;
 setStatus('닉네임을 등록하거나 연결해 주세요.',chatStatus);
 await prepareCaptcha();
 if(!captchaToken)throw Error('보안 인증 토큰이 없습니다.');
 const result=await client.auth.signInAnonymously({options:{captchaToken}});
 captchaToken=null;
 if(result.error){
  if(widgetId!==null && window.turnstile)window.turnstile.reset(widgetId);
  throw result.error;
 }
 if(widgetId!==null && window.turnstile)window.turnstile.remove(widgetId);
 document.getElementById('boardCaptcha')?.remove();
 return result.data.user;
}
async function setupLinkControls(){
 const panel=el('section');panel.className='board-nickname-register';
 panel.id='nickname-device-link';
 panel.setAttribute('aria-label','고유 닉네임 기기 연동');
 const title=el('strong','🔑 고유 닉네임 일회용 연동');
 const help=el('p',registeredNickname?'다른 브라우저에서 같은 닉네임을 사용하려면 이곳에서 코드를 발급하세요. 코드는 5분 동안 한 번만 사용할 수 있습니다.':'이미 다른 앱에서 고유 닉네임을 사용 중이라면 그 앱에서 발급한 연동 코드를 입력하세요.');
 panel.append(title,help);
 if(registeredNickname){
  const issue=el('button','일회용 연동 코드 발급');issue.type='button';
  const result=el('p');result.style.cssText='font-size:19px;font-weight:750;overflow-wrap:anywhere;user-select:all';
  issue.onclick=async()=>{issue.disabled=true;try{const r=await client.rpc('board_issue_link_code');if(r.error)throw r.error;result.textContent=r.data;setStatus('코드가 발급됐습니다. 다른 브라우저에서 5분 안에 입력하세요. 코드는 다른 사람에게 보여주지 마세요.')}catch(e){setStatus('코드 발급 실패: '+e.message)}finally{issue.disabled=false}};
  panel.append(issue,result);
 }else{
  const input=el('input');input.className='field';input.placeholder='24자리 연동 코드';input.maxLength=24;input.autocomplete='off';input.spellcheck=false;
  const redeem=el('button','기존 닉네임 연결');redeem.type='button';
  redeem.onclick=async()=>{redeem.disabled=true;try{const r=await client.rpc('board_redeem_link_code',{p_code:input.value.trim()});if(r.error)throw r.error;setStatus('연동이 완료됐습니다. 채팅방을 다시 불러옵니다.');location.reload()}catch(e){setStatus('연동 실패: '+e.message)}finally{redeem.disabled=false}};
  panel.append(input,redeem);
 }
 if(registeredNickname){
  const deletion=el('details');deletion.style.cssText='margin-top:16px;border-top:1px solid #cbd9cf;padding-top:12px';
  const summary=el('summary','고유 닉네임 / 계정 삭제');summary.style.cursor='pointer';deletion.append(summary);
  const description=el('p','닉네임만 삭제하면 기존 게시글·댓글·채팅은 남습니다. 삭제 후 새 이름을 등록하려면 관리자 승인이 필요합니다. 계정 전체 삭제는 관리자에게 신청하며, 관리자가 승인하면 게시글·댓글·채팅과 익명 계정까지 영구 삭제됩니다. 원래 닉네임을 만든 앱에서만 삭제할 수 있습니다.');
  deletion.append(description);
  const nickBtn=el('button','고유 닉네임만 삭제');nickBtn.type='button';
  nickBtn.onclick=async()=>{
   const typed=prompt((window.mindSearchCommunityText?.('닉네임만 삭제합니다. 게시글과 댓글은 유지됩니다. 확인하려면 현재 고유 닉네임을 입력하세요:') ?? '닉네임만 삭제합니다. 게시글과 댓글은 유지됩니다. 확인하려면 현재 고유 닉네임을 입력하세요:') + ' ' + registeredNickname);
   if(typed!==registeredNickname)return;
   if(!confirm(window.mindSearchCommunityText?.('고유 닉네임을 삭제하고 다른 기기와의 연결도 해제할까요?') ?? '고유 닉네임을 삭제하고 다른 기기와의 연결도 해제할까요?'))return;
   nickBtn.disabled=true;
   try{const r=await client.rpc('board_delete_nickname',{p_confirmation:typed});if(r.error)throw r.error;location.reload()}catch(e){setStatus('닉네임 삭제 실패: '+e.message);nickBtn.disabled=false}
  };
  const allBtn=el('button','관리자에게 계정 삭제 신청');allBtn.type='button';allBtn.style.cssText='margin-left:8px;background:#8d4d36;color:white';
  allBtn.onclick=async()=>{
   const expected='계정삭제 신청 '+registeredNickname;
   const typed=prompt((window.mindSearchCommunityText?.('관리자에게 계정 및 모든 기록 삭제를 신청합니다. 관리자가 승인하면 복구할 수 없습니다. 확인 문구:') ?? '관리자에게 계정 및 모든 기록 삭제를 신청합니다. 관리자가 승인하면 복구할 수 없습니다. 확인 문구:') + ' ' + expected);
   if(typed!==expected)return;
   if(!confirm(window.mindSearchCommunityText?.('계정 삭제 신청을 관리자에게 제출할까요? 제출 즉시 삭제되지는 않습니다.') ?? '계정 삭제 신청을 관리자에게 제출할까요? 제출 즉시 삭제되지는 않습니다.'))return;
   allBtn.disabled=true;
   try{const r=await client.rpc('board_request_account_deletion',{p_confirmation:typed});if(r.error)throw r.error;setStatus('계정 삭제 신청이 접수됐습니다. 관리자가 확인한 뒤 처리합니다.');allBtn.textContent='계정 삭제 신청 접수됨'}catch(e){setStatus('계정 삭제 신청 실패: '+e.message);allBtn.disabled=false}
  };
  deletion.append(nickBtn,allBtn);panel.append(deletion);
 }
 profile.append(panel);
}
function showNicknameChange(request, removedNickname){
 const panel=el('section');panel.className='board-nickname-register';
 const heading=el('h2','고유이름 변경 신청');
 heading.id='board-nickname-change-title';
 panel.setAttribute('aria-labelledby',heading.id);
 const message=el('p');message.setAttribute('role','status');
 const current=registeredNickname||removedNickname;
 const description=el('p',removedNickname?'이전 고유이름: '+current+' · 관리자 승인 후 새 이름을 사용할 수 있어요.':'현재 고유이름: '+current+' · 관리자 승인 후 새 이름으로 바뀝니다.');
 const changes=el('form');
 const label=el('label','새 고유이름 (2~30자)');label.htmlFor='board-new-nickname';
 const field=el('input');field.id=label.htmlFor;field.className='field';field.minLength=2;field.maxLength=30;field.required=true;
 const send=el('button','변경 신청');send.type='submit';
 changes.append(label,field,send);
 panel.append(heading,description,message,changes);
 profile.append(panel);
 if(removedNickname)showNicknameRegistration(panel);
 function display(result){
  const messages={
   pending:'승인 대기 중',
   approved:'승인 완료',
   rejected:'변경 신청이 거절됐어요'
  };
  message.textContent=result?messages[result.status]+' · '+result.new_nickname:'';
  changes.hidden=result?.status==='pending';
 }
 display(request);
 changes.onsubmit=async event=>{
  event.preventDefault();
  const nickname=field.value.trim();
  if(send.disabled||nickname.length<2||nickname.length>30)return;
  send.disabled=true;
  try{
   const response=await client.rpc('board_request_nickname_change',{p_nickname:nickname});
   if(response.error)throw response.error;
   display({status:'pending',new_nickname:nickname});
   changes.reset();
  }catch(error){
   message.textContent='변경 신청 실패: '+error.message;
  }finally{send.disabled=false}
 };
}

async function setupNickname(){
 const [found,change]=await Promise.all([
  client.from('board_profiles').select('nickname').eq('user_id',canonicalId).maybeSingle(),
  client.rpc('board_nickname_change_status')
 ]);
 if(found.error)throw found.error;
 const request=change.data?.request;
 if(found.data){
  registeredNickname=found.data.nickname;
  showNicknameChange(request);
  await setupLinkControls();enableCommunityChat();return;
 }
 profile.closest('details').open=true;
 setStatus('닉네임을 등록하거나 연결해 주세요.',chatStatus);
 await setupLinkControls();
 if(change.data?.removed_nickname){showNicknameChange(request,change.data.removed_nickname);return;}
 const wrapper=el('div');wrapper.className='board-nickname-register';
 const label=el('label','고유 닉네임 등록 (2~30자)');label.htmlFor='board-register-nickname';
 const field=el('input');field.id='board-register-nickname';field.className='field';field.minLength=2;field.maxLength=30;field.required=true;field.placeholder='사용할 고유 닉네임';
 const register=el('button','닉네임 등록');register.type='submit';
 const registration=el('form');registration.append(label,field,register);wrapper.append(registration);profile.append(wrapper);
 const warning=el('p','가입 없는 익명 계정입니다. 브라우저 데이터를 삭제하거나 기기를 바꾸면 이 닉네임을 복구할 수 없습니다.');
 wrapper.append(warning);
 showNicknameRegistration(wrapper);
 registration.onsubmit=async e=>{
  e.preventDefault();const nickname=field.value.trim();if(register.disabled||nickname.length<2||nickname.length>30)return;
  register.disabled=true;
  try{
   const result=await client.from('board_profiles').insert({user_id:user.id,nickname});
   if(result.error)throw result.error;
   registeredNickname=nickname;
   wrapper.remove();
   const confirmation=el('p','고유 닉네임 등록 완료: '+nickname);
   confirmation.setAttribute('role','status');
   profile.append(confirmation);
   showNicknameChange(null);
   document.getElementById('nickname-device-link')?.remove();
   await setupLinkControls();
   enableCommunityChat();
  }catch(err){setStatus(err.code==='23505'?'이미 사용 중인 닉네임입니다. 다른 이름을 선택해 주세요.':'닉네임 등록 실패: '+err.message)}
  finally{register.disabled=false}
 };
}

async function updateAdminReportBadge(){
 const link=document.getElementById('admin-entry');
 if(!link)return;
 let badge=link.querySelector('.admin-report-badge');
 try{
  const r=await client.rpc('board_pending_report_count');
  if(r.error)throw r.error;
  const count=Number(r.data)||0;
  if(!badge){badge=el('span');badge.className='admin-report-badge';badge.style.cssText='display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 6px;margin-left:5px;border-radius:12px;background:#c72e40;color:#fff;font-size:12px;font-weight:800;vertical-align:middle';link.append(badge)}
  badge.textContent=count>99?'99+':String(count);
  badge.hidden=count===0;
  link.setAttribute('aria-label','운영자 관리실, 대기 중인 신고 '+count+'건');
 }catch(e){if(badge)badge.hidden=true}
}
async function init(){
 try{user=await ensureUser();if(!user)throw Error('익명 인증에 실패했습니다.');
 const canonical=await client.rpc('board_canonical_user_id');if(canonical.error)throw canonical.error;canonicalId=canonical.data;
 await setupNickname();
 void updateAdminReportBadge();
 setInterval(()=>{if(!document.hidden)updateAdminReportBadge()},30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateAdminReportBadge()});
 }catch(e){
 const message='채팅방 연결 실패: '+e.message+' · 새로고침 후 다시 시도해 주세요.';
 setStatus(message,chatStatus);
 setStatus(message);
 }
}
init();
})();