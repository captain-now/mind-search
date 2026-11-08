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
  const result=await client.auth.signInWithPassword({email:byId('email').value.trim(),password:byId('password').value});
  if(result.error)throw result.error;
  byId('password').value='';await show();
 }catch(e){msg('로그인 실패: '+e.message)}finally{button.disabled=false}
};
byId('refresh').onclick=()=>refresh().catch(e=>msg('신고 조회 실패: '+e.message));
byId('logout').onclick=async()=>{await client.auth.signOut();reportsEl.replaceChildren();await show()};
show();
})();