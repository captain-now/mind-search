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
let user=null,loading=false,registeredNickname=null;
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
async function setupNickname(){
 const found=await client.from('board_profiles').select('nickname').eq('user_id',user.id).maybeSingle();
 if(found.error)throw found.error;
 if(found.data){registeredNickname=found.data.nickname;nameInput.value=registeredNickname;nameInput.readOnly=true;return;}
 form.hidden=true;
 const wrapper=el('div');wrapper.className='board-nickname-register';
 const label=el('label','고유 닉네임 등록 (2~30자 · 변경 및 복구 불가)');
 const field=el('input');field.className='field';field.minLength=2;field.maxLength=30;field.required=true;field.placeholder='사용할 고유 닉네임';
 const register=el('button','닉네임 등록');register.type='submit';
 const registration=el('form');registration.append(label,field,register);wrapper.append(registration);root.insertBefore(wrapper,form);
 const warning=el('p','가입 없는 익명 계정입니다. 브라우저 데이터를 삭제하거나 기기를 바꾸면 이 닉네임을 복구할 수 없습니다. 기존 게시글의 별명과는 별개로 새로 등록됩니다.');
 wrapper.append(warning);
 registration.onsubmit=async e=>{
  e.preventDefault();const nickname=field.value.trim();if(nickname.length<2||nickname.length>30)return;
  register.disabled=true;
  try{
   const result=await client.from('board_profiles').insert({user_id:user.id,nickname});
   if(result.error)throw result.error;
   registeredNickname=nickname;nameInput.value=nickname;nameInput.readOnly=true;wrapper.remove();form.hidden=false;setStatus('고유 닉네임 등록 완료: '+nickname);await refresh();
  }catch(err){setStatus(err.code==='23505'?'이미 사용 중인 닉네임입니다. 다른 이름을 선택해 주세요.':'닉네임 등록 실패: '+err.message)}
  finally{register.disabled=false}
 };
}

function accountAccess(){
 const panel=el('section');panel.className='card';panel.style.cssText='margin:16px 0;padding:14px;border:1px solid #8aa99a;border-radius:12px';
 panel.append(el('h3','🔐 앱 · 브라우저 계정 연동'));
 const description=el('p','기존 닉네임을 유지하려면 앱에서 이메일을 연결한 다음, 인터넷 브라우저에서 같은 이메일로 로그인하세요. 닉네임을 새로 등록하지 마세요.');
 panel.append(description);
 const note=el('p');note.setAttribute('role','status');note.style.cssText='font-size:13px;white-space:pre-wrap';
 const email=el('input');email.type='email';email.className='field';email.placeholder='본인 이메일';email.autocomplete='email';email.required=true;
 const password=el('input');password.type='password';password.className='field';password.placeholder='비밀번호 (8자 이상)';password.autocomplete='new-password';password.minLength=8;password.required=true;
 const emailForm=el('form');const emailBtn=el('button','① 기존 계정에 이메일 연결');emailBtn.type='submit';emailForm.append(email,emailBtn);
 const passwordForm=el('form');const passwordBtn=el('button','② 이메일 인증 후 비밀번호 설정');passwordBtn.type='submit';passwordForm.append(password,passwordBtn);
 const loginForm=el('form');const loginEmail=el('input');loginEmail.type='email';loginEmail.className='field';loginEmail.placeholder='연결한 이메일';loginEmail.autocomplete='email';loginEmail.required=true;
 const loginPassword=el('input');loginPassword.type='password';loginPassword.className='field';loginPassword.placeholder='설정한 비밀번호';loginPassword.autocomplete='current-password';loginPassword.required=true;
 const loginBtn=el('button','기존 계정으로 로그인');loginBtn.type='submit';loginForm.append(loginEmail,loginPassword,loginBtn);
 const existing=!!registeredNickname;
 if(existing){
  panel.append(el('p','현재 닉네임: '+registeredNickname+' · 반드시 이 닉네임이 표시되는 앱에서 연결하세요.'));
  panel.append(emailForm,passwordForm);
 }else{
  panel.append(el('p','이미 앱에 닉네임이 있다면 여기서 새 닉네임을 만들지 말고, 앱에서 이메일 연결을 먼저 완료하세요.'));
  panel.append(loginForm);
 }
 panel.append(note);root.insertBefore(panel,form);
 emailForm.onsubmit=async e=>{e.preventDefault();emailBtn.disabled=true;try{
  const current=await client.auth.getUser();if(current.error)throw current.error;
  if(!current.data.user||current.data.user.id!==user.id||!registeredNickname)throw Error('기존 닉네임 소유자 계정에서만 연결할 수 있습니다.');
  if(current.data.user.email)throw Error('이미 이메일이 연결돼 있습니다. 인증 후 비밀번호를 설정하세요.');
  const result=await client.auth.updateUser({email:email.value.trim()});if(result.error)throw result.error;
  note.textContent='인증 메일을 보냈습니다. 이메일 인증을 완료한 뒤 이 앱으로 돌아와 ② 비밀번호 설정을 진행하세요.';
 }catch(err){note.textContent='이메일 연결 실패: '+err.message}finally{emailBtn.disabled=false}};
 passwordForm.onsubmit=async e=>{e.preventDefault();passwordBtn.disabled=true;try{
  const current=await client.auth.getUser();if(current.error)throw current.error;
  if(!current.data.user?.email_confirmed_at)throw Error('먼저 이메일 인증을 완료해 주세요.');
  if(current.data.user.id!==user.id)throw Error('계정이 변경되었습니다. 진행을 중단합니다.');
  const result=await client.auth.updateUser({password:password.value});if(result.error)throw result.error;
  password.value='';note.textContent='연결 완료! 이제 인터넷 브라우저의 게시판에서 같은 이메일과 비밀번호로 로그인하세요.';
 }catch(err){note.textContent='비밀번호 설정 실패: '+err.message}finally{passwordBtn.disabled=false}};
 loginForm.onsubmit=async e=>{e.preventDefault();loginBtn.disabled=true;try{
  const result=await client.auth.signInWithPassword({email:loginEmail.value.trim(),password:loginPassword.value});if(result.error)throw result.error;
  const profile=await client.from('board_profiles').select('nickname').eq('user_id',result.data.user.id).maybeSingle();
  if(profile.error)throw profile.error;
  if(!profile.data){await client.auth.signOut();throw Error('이 계정에는 기존 닉네임이 없습니다. 앱에서 연결한 이메일인지 확인해 주세요.')}
  location.reload();
 }catch(err){note.textContent='로그인 실패: '+err.message}finally{loginBtn.disabled=false}};
}

async function remove(table,id){if(!confirm('정말 삭제할까요?'))return;const result=await client.from(table).delete().eq('id',id).eq('author_id',user.id);if(result.error)throw result.error;await refresh()}
function addDelete(container,table,item){if(item.author_id!==user.id)return;const btn=el('button','내 글 삭제');btn.type='button';btn.onclick=async()=>{try{await remove(table,item.id)}catch(e){setStatus('삭제 실패: '+e.message)}};container.append(btn)}
let activeReportDialog=null;
function reportItem(table,item,button){
 if(activeReportDialog){activeReportDialog.remove();activeReportDialog=null}
 const backdrop=el('div');
 backdrop.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
 const panel=el('section');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','게시판 신고');
 panel.style.cssText='background:#fff;color:#203b32;border-radius:16px;padding:20px;width:100%;max-width:420px;max-height:90vh;overflow-y:auto;box-sizing:border-box';
 const heading=el('h2',table==='board_posts'?'게시글 신고':'댓글 신고');
 const description=el('p','신고 사유를 선택하세요.');
 const form=el('form');
 const choices=[['spam','스팸 및 광고'],['harassment','욕설 및 괴롭힘'],['privacy','개인정보 침해'],['other','기타']];
 const group=el('fieldset');group.style.cssText='border:0;padding:0;margin:12px 0';
 const legend=el('legend','신고 사유');group.append(legend);
 for(const [value,label] of choices){
  const row=el('label');row.style.cssText='display:flex;align-items:center;gap:10px;padding:9px 0;cursor:pointer';
  const radio=el('input');radio.type='radio';radio.name='report-reason';radio.value=value;radio.checked=value==='spam';
  row.append(radio,el('span',label));group.append(row);
 }
 const detailLabel=el('label','상세 설명 (선택, 최대 500자)');
 const detail=el('textarea');detail.className='field';detail.maxLength=500;detail.rows=3;detail.style.width='100%';detail.style.boxSizing='border-box';
 detailLabel.append(detail);
 const actions=el('div');actions.style.cssText='display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap';
 const cancel=el('button','취소');cancel.type='button';
 const submit=el('button','신고 접수');submit.type='submit';
 actions.append(cancel,submit);form.append(group,detailLabel,actions);panel.append(heading,description,form);backdrop.append(panel);
 const previousFocus=document.activeElement;
 const close=()=>{backdrop.remove();if(activeReportDialog===backdrop)activeReportDialog=null;if(previousFocus&&previousFocus.focus)previousFocus.focus()};
 cancel.onclick=close;
 backdrop.onclick=e=>{if(e.target===backdrop)close()};
 backdrop.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();close()}};
 form.onsubmit=async e=>{
  e.preventDefault();const selected=form.querySelector('input[name="report-reason"]:checked');if(!selected)return;
  submit.disabled=true;cancel.disabled=true;button.disabled=true;
  try{
   const payload={reporter_id:user.id,reason:selected.value,details:detail.value.trim()};
   payload[table==='board_posts'?'post_id':'comment_id']=item.id;
   const result=await client.from('board_reports').insert(payload);
   if(result.error)throw result.error;
   close();setStatus('신고가 접수되었습니다. 운영자가 확인할 수 있도록 저장되었습니다.');
  }catch(err){setStatus(err.code==='23505'?'이미 신고한 항목입니다.':'신고 실패: '+err.message);submit.disabled=false;cancel.disabled=false}
  finally{button.disabled=false}
 };
 document.body.append(backdrop);activeReportDialog=backdrop;const first=group.querySelector('input');if(first)first.focus();
}
function addReport(container,table,item){
 if(item.author_id===user.id)return;
 const button=el('button','신고');button.type='button';
 button.setAttribute('aria-label','이 '+(table==='board_posts'?'게시글':'댓글')+' 신고');
 button.onclick=()=>reportItem(table,item,button);
 container.append(button);
}
const POSTS_PER_PAGE=50;
let currentPage=0;
function pageControls(hasMore){
 const nav=el('nav');nav.setAttribute('aria-label','게시글 페이지 이동');nav.style.cssText='display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;margin:24px 0';
 const prev=el('button','← 최신 글');prev.type='button';prev.disabled=currentPage===0;
 const label=el('span',(currentPage+1)+'페이지');label.setAttribute('aria-live','polite');
 const next=el('button','이전 글 보기 →');next.type='button';next.disabled=!hasMore;
 prev.onclick=()=>{if(currentPage>0){currentPage--;refresh()}};
 next.onclick=()=>{if(hasMore){currentPage++;refresh()}};
 nav.append(prev,label,next);return nav;
}
async function refresh(){
 if(loading)return;loading=true;
 try{
 const posts=await client.from('board_posts').select('id,author_id,nickname,title,body,created_at').order('created_at',{ascending:false}).order('id',{ascending:false}).range(currentPage*POSTS_PER_PAGE,(currentPage+1)*POSTS_PER_PAGE);
 if(posts.error)throw posts.error;
 const profileResult=await client.from('board_profiles').select('user_id,nickname');
 if(profileResult.error)throw profileResult.error;
 const verifiedNames=new Map(profileResult.data.map(p=>[p.user_id,p.nickname]));
 const displayName=item=>verifiedNames.get(item.author_id)===item.nickname?item.nickname+' · 고유 닉네임':item.nickname+' · 이전 기록(미인증)';
 const hasMore=posts.data.length>POSTS_PER_PAGE;
 const pagePosts=posts.data.slice(0,POSTS_PER_PAGE);
 const ids=pagePosts.map(p=>p.id);
 const comments={data:[]};
 if(ids.length){
  const COMMENT_BATCH=500;
  for(let offset=0;;offset+=COMMENT_BATCH){
   const batch=await client.from('board_comments').select('id,post_id,author_id,nickname,body,created_at').in('post_id',ids).order('created_at',{ascending:true}).order('id',{ascending:true}).range(offset,offset+COMMENT_BATCH-1);
   if(batch.error)throw batch.error;
   comments.data.push(...batch.data);
   if(batch.data.length<COMMENT_BATCH)break;
  }
 }
 const commentsByPost=new Map();
 for(const comment of comments.data){
  if(!commentsByPost.has(comment.post_id))commentsByPost.set(comment.post_id,[]);
  commentsByPost.get(comment.post_id).push(comment);
 }
 postsEl.replaceChildren();
 for(const p of pagePosts){
 const article=el('article');article.className='board-post';
 article.append(el('small',displayName(p)+' · '+new Date(p.created_at).toLocaleString()),el('h3',p.title),el('p',p.body));
 addDelete(article,'board_posts',p);addReport(article,'board_posts',p);
 const replies=el('div');replies.className='board-comments';
 for(const c of commentsByPost.get(p.id)||[]){
 const line=el('div');line.className='board-comment';
 line.append(el('small',displayName(c)+' · '+new Date(c.created_at).toLocaleString()),el('p',c.body));
 addDelete(line,'board_comments',c);addReport(line,'board_comments',c);replies.append(line);
 }
 const reply=el('form');reply.className='board-comment-form';
 const input=el('input');input.className='field';input.required=true;input.maxLength=500;input.placeholder='댓글';
 const submit=el('button','댓글 달기');submit.type='submit';reply.append(input,submit);
 reply.onsubmit=async e=>{e.preventDefault();const body=input.value.trim();if(!body)return;submit.disabled=true;try{const r=await client.from('board_comments').insert({post_id:p.id,author_id:user.id,nickname:registeredNickname,body});if(r.error)throw r.error;await refresh()}catch(err){setStatus('댓글 작성 실패: '+err.message)}finally{submit.disabled=false}};
 replies.append(reply);article.append(replies);postsEl.append(article);
 }
 if(!pagePosts.length)postsEl.append(el('p',currentPage?'이 페이지에는 글이 없습니다. 최신 글로 돌아가 주세요.':'아직 글이 없습니다.'));
 postsEl.append(pageControls(hasMore));
 setStatus('공개 게시판 연결됨 · '+(currentPage+1)+'페이지 · 페이지당 최대 50개');
 }catch(e){setStatus('게시판 불러오기 실패: '+e.message)}finally{loading=false}
}
async function init(){
 try{user=await ensureUser();if(!user)throw Error('익명 인증에 실패했습니다.');
 await setupNickname();
 accountAccess();
 // Enable posting only after remote authentication succeeds.
 form.hidden=!registeredNickname;
 form.onsubmit=async e=>{e.preventDefault();const nickname=registeredNickname,title=titleInput.value.trim(),body=bodyInput.value.trim();if(!nickname||!title||!body)return;const submit=form.querySelector('[type=submit]');submit.disabled=true;try{const r=await client.from('board_posts').insert({author_id:user.id,nickname,title,body});if(r.error)throw r.error;titleInput.value='';bodyInput.value='';currentPage=0;await refresh()}catch(err){setStatus('글 작성 실패: '+err.message)}finally{submit.disabled=false}};
 await refresh();
 }catch(e){setStatus('공개 게시판 연결 실패: '+e.message+' · 새로고침 후 다시 시도해 주세요.')}
}
init();
})();