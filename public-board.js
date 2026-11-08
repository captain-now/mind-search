/* Public board adapter. Requires Supabase JS v2 and explicit public project config.
   Never use service_role keys in client-side code. */
(function(){
'use strict';
const cfg=window.MIND_SEARCH_BOARD_CONFIG;
if(!cfg || !/^https:\/\//.test(cfg.url||'') || !cfg.anonKey || !window.supabase){const root=document.getElementById('community');if(root){const p=document.createElement('p');p.setAttribute('role','alert');p.textContent='공개 게시판 연결을 준비 중입니다. 잠시 후 다시 시도해 주세요.';root.prepend(p)}return;}
const client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});
const root=document.getElementById('community');
if(!root)return;
const status=document.createElement('p');status.setAttribute('role','status');status.className='muted';
root.prepend(status);
const postsEl=document.getElementById('boardPosts');
const form=document.getElementById('boardForm');
const nameInput=document.getElementById('boardName'),titleInput=document.getElementById('boardTitle'),bodyInput=document.getElementById('boardBody');
const localNotice=root.querySelector('.disclaimer');if(localNotice)localNotice.textContent='공개 게시판 · 별명은 공개되지만 작성자 삭제 권한은 익명 계정으로 확인합니다. 브라우저의 로그인 정보가 삭제되면 기존 글을 삭제하지 못할 수 있습니다.';
function el(tag,txt){const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n}
function setStatus(msg){status.textContent=msg}
let user=null,loading=false;
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
  const holder=document.createElement('div');holder.id='boardCaptcha';root.insertBefore(holder,form);
  widgetId=window.turnstile.render(holder,{
   sitekey:turnstileSiteKey,
   callback:token=>{captchaToken=token;resolve();},
   'expired-callback':()=>{captchaToken=null;setStatus('보안 인증이 만료되었습니다. 다시 인증해 주세요.');},
   'error-callback':()=>{captchaToken=null;setStatus('보안 인증에 실패했습니다. 다시 시도해 주세요.');}
  });
  setStatus('게시판 이용을 위해 보안 인증을 완료해 주세요.');
 });
}
async function ensureUser(){
 const current=await client.auth.getUser();
 if(current.data.user)return current.data.user;
 await prepareCaptcha();
 if(!captchaToken)throw Error('보안 인증 토큰이 없습니다.');
 const result=await client.auth.signInAnonymously({options:{captchaToken}});
 captchaToken=null;
 if(widgetId!==null && window.turnstile)window.turnstile.reset(widgetId);
 if(result.error)throw result.error;
 return result.data.user;
}
async function remove(table,id){if(!confirm('정말 삭제할까요?'))return;const result=await client.from(table).delete().eq('id',id).eq('author_id',user.id);if(result.error)throw result.error;await refresh()}
function addDelete(container,table,item){if(item.author_id!==user.id)return;const btn=el('button','내 글 삭제');btn.type='button';btn.onclick=async()=>{try{await remove(table,item.id)}catch(e){setStatus('삭제 실패: '+e.message)}};container.append(btn)}
async function refresh(){
 if(loading)return;loading=true;
 try{
 const posts=await client.from('board_posts').select('id,author_id,nickname,title,body,created_at').order('created_at',{ascending:false}).limit(50);
 if(posts.error)throw posts.error;
 const ids=posts.data.map(p=>p.id);
 const comments=ids.length?await client.from('board_comments').select('id,post_id,author_id,nickname,body,created_at').in('post_id',ids).order('created_at',{ascending:true}).limit(500):{data:[],error:null};
 if(comments.error)throw comments.error;
 postsEl.replaceChildren();
 for(const p of posts.data){
 const article=el('article');article.className='board-post';
 article.append(el('small',p.nickname+' · '+new Date(p.created_at).toLocaleString()),el('h3',p.title),el('p',p.body));
 addDelete(article,'board_posts',p);
 const replies=el('div');replies.className='board-comments';
 for(const c of comments.data.filter(c=>c.post_id===p.id)){
 const line=el('div');line.className='board-comment';
 line.append(el('small',c.nickname+' · '+new Date(c.created_at).toLocaleString()),el('p',c.body));
 addDelete(line,'board_comments',c);replies.append(line);
 }
 const reply=el('form');reply.className='board-comment-form';
 const input=el('input');input.className='field';input.required=true;input.maxLength=500;input.placeholder='댓글';
 const submit=el('button','댓글 달기');submit.type='submit';reply.append(input,submit);
 reply.onsubmit=async e=>{e.preventDefault();const body=input.value.trim();if(!body)return;submit.disabled=true;try{const r=await client.from('board_comments').insert({post_id:p.id,author_id:user.id,nickname:nameInput.value.trim()||'익명',body});if(r.error)throw r.error;await refresh()}catch(err){setStatus('댓글 작성 실패: '+err.message)}finally{submit.disabled=false}};
 replies.append(reply);article.append(replies);postsEl.append(article);
 }
 if(!posts.data.length)postsEl.append(el('p','아직 글이 없습니다.'));
 setStatus('공개 게시판 연결됨 · 최근 글 50개');
 }catch(e){setStatus('게시판 불러오기 실패: '+e.message)}finally{loading=false}
}
async function init(){
 try{user=await ensureUser();if(!user)throw Error('익명 인증에 실패했습니다.');
 // Enable posting only after remote authentication succeeds.
 form.hidden=false;
 form.onsubmit=async e=>{e.preventDefault();const nickname=nameInput.value.trim(),title=titleInput.value.trim(),body=bodyInput.value.trim();if(!nickname||!title||!body)return;const submit=form.querySelector('[type=submit]');submit.disabled=true;try{const r=await client.from('board_posts').insert({author_id:user.id,nickname,title,body});if(r.error)throw r.error;titleInput.value='';bodyInput.value='';await refresh()}catch(err){setStatus('글 작성 실패: '+err.message)}finally{submit.disabled=false}};
 await refresh();
 }catch(e){setStatus('공개 게시판 연결 실패: '+e.message+' · 새로고침 후 다시 시도해 주세요.')}
}
init();
})();