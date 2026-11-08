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
async function show(){
 try{const ok=await authorized();login.hidden=ok;dashboard.hidden=!ok;
 if(ok){msg('운영자 인증 완료');await refresh();await refreshDeletions()}
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
 const form=e.currentTarget,button=form.querySelector('button');
 const current=byId('currentAdminCode').value,next=byId('newAdminCode').value;
 if(next!==byId('confirmAdminCode').value){msg('새 코드 확인이 일치하지 않습니다.');return}
 if(next.length!==12||!/[A-Za-z]/.test(next)||!/[0-9]/.test(next)||!/[^A-Za-z0-9]/.test(next)){msg('새 코드는 영문, 숫자, 특수문자를 포함한 12자리여야 합니다.');return}
 button.disabled=true;
 try{
  const r=await client.rpc('board_admin_change_access_code',{p_current:current,p_new:next});
  if(r.error)throw r.error;
  form.reset();msg('운영자 코드가 변경되었습니다.');
 }catch(err){msg('변경 실패: '+err.message)}
 finally{button.disabled=false}
});
byId('refresh').onclick=async()=>{try{await refresh();await refreshDeletions()}catch(e){msg('목록 조회 실패: '+e.message)}};
byId('logout').onclick=async()=>{await client.rpc('board_admin_code_logout');await client.auth.signOut();reportsEl.replaceChildren();await show()};
show();loadCaptcha();
})();