(function(){
'use strict';
const config={url:'https://iqohtsakhfnwtlbarjut.supabase.co',anonKey:'sb_publishable_MZU5P4iF3BmY27FSee2ntw_mVO9Lf5w'};
const client=window.supabase.createClient(config.url,config.anonKey,{auth:{storageKey:'mind-search-admin-auth',persistSession:true,autoRefreshToken:true}});
const byId=id=>document.getElementById(id),login=byId('login'),dashboard=byId('dashboard'),status=byId('status'),reportsEl=byId('reports');
function msg(value){status.textContent=value}
function loginErrorMessage(error){
 const code=error&&error.code;
 const statusCode=error&&(error.status||error.statusCode);
 if(code==='over_email_send_rate_limit'||statusCode===429||/email rate limit exceeded/i.test(error.message||''))return '이메일 발송 한도에 도달했습니다. 잠시 후 다시 시도해 주세요. 반복되면 운영자에게 이메일 발송 설정(SMTP) 확인이 필요합니다.';
 if(code==='email_address_not_authorized')return '현재 이메일 발송 설정에서 이 주소로 전송할 수 없습니다. 운영자에게 SMTP 또는 Supabase 팀 이메일 설정 확인을 요청해 주세요.';
 if(code==='captcha_failed')return '보안 인증이 확인되지 않았습니다. 인증을 다시 완료한 뒤 요청해 주세요.';
 if(code==='over_request_rate_limit')return '로그인 요청이 너무 많습니다. 잠시 기다렸다가 다시 시도해 주세요.';
 return '로그인 링크 요청 실패: '+(error.message||'알 수 없는 오류');
}
function el(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n}
const turnstileSiteKey='0x4AAAAAAF4XQ_wl1XONk2be';
let captchaToken=null,widgetId=null;
function setupCaptcha(){
 return new Promise((resolve,reject)=>{
  if(!window.turnstile){
   const script=document.createElement('script');
   script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
   script.onload=()=>resolve();
   script.onerror=()=>reject(Error('보안 인증을 불러오지 못했습니다.'));
   document.head.append(script);
  }else resolve();
 }).then(()=>{
  widgetId=window.turnstile.render(byId('captcha'),{
   sitekey:turnstileSiteKey,
   callback:token=>{captchaToken=token;msg('보안 인증 완료. 로그인 링크를 요청할 수 있습니다.');},
   'expired-callback':()=>{captchaToken=null;msg('보안 인증이 만료되었습니다. 다시 확인해 주세요.');},
   'error-callback':()=>{captchaToken=null;msg('보안 인증 오류. 새로고침 후 다시 시도해 주세요.')}
  });
 });
}
async function authorized(){
 const {data,error}=await client.auth.getUser();
 if(error||!data.user)return false;
 // Membership is controlled by the database, not a nickname or editable user metadata.
 const r=await client.from('board_admins').select('user_id').eq('user_id',data.user.id).maybeSingle();
 if(r.error)throw r.error;
 return Boolean(r.data);
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
  if(target.data){
   const del=el('button','대상 삭제');del.className='danger';del.onclick=async()=>{if(!confirm('신고된 콘텐츠를 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.'))return;del.disabled=true;try{
    const result=await client.from(targetTable).delete().eq('id',targetId);
    if(result.error)throw result.error;await refresh();msg('대상 콘텐츠 삭제 요청을 처리했습니다.');
   }catch(e){msg('삭제 실패: '+e.message)}finally{del.disabled=false}};article.append(del);
  }
  reportsEl.append(article);
 }
}
async function show(){
 try{const ok=await authorized();login.hidden=ok;dashboard.hidden=!ok;
 if(ok){msg('운영자 인증 완료');await refresh()}
 else{msg('운영자 권한이 있는 계정으로 로그인해야 합니다.')}
 }catch(e){login.hidden=false;dashboard.hidden=true;msg('접근 확인 실패: '+e.message)}
}
byId('loginForm').onsubmit=async event=>{
 event.preventDefault();const button=event.currentTarget.querySelector('button');button.disabled=true;
 try{
  if(!captchaToken)throw Error('먼저 보안 인증을 완료해 주세요.');
  const result=await client.auth.signInWithOtp({
   email:byId('email').value.trim(),
   options:{emailRedirectTo:'https://captain-now.github.io/mind-search/admin.html',shouldCreateUser:false,captchaToken}
  });
  if(result.error)throw result.error;
  msg('로그인 이메일 요청이 접수되었습니다. 메일함과 스팸함을 확인해 주세요. 수신되지 않으면 발송 설정 확인이 필요합니다.');
 }catch(e){msg(loginErrorMessage(e))}
 finally{button.disabled=false;captchaToken=null;if(widgetId!==null&&window.turnstile)window.turnstile.reset(widgetId)}
};
byId('refresh').onclick=()=>refresh().catch(e=>msg('신고 조회 실패: '+e.message));
byId('logout').onclick=async()=>{await client.auth.signOut();reportsEl.replaceChildren();await show()};
show();setupCaptcha().catch(e=>msg(e.message));
})();