/* Shared Korean / English UI for board and chat. Never translate user-generated content. */
(()=>{'use strict';
const pairs=[["고유 닉네임이 있으면 자동으로 입장합니다.","You will join automatically with your registered nickname."],["닉네임 등록 또는 연결하기","Register or link your nickname"],["닉네임 설정","Nickname settings"],["닉네임을 등록하거나 연결해 주세요.","Register or link your nickname to join."],["글과 댓글","Posts and comments"],["🔐 운영자 관리실","🔐 Admin dashboard"],["운영자 관리실 새 페이지로 열기","Open admin dashboard on a separate page"],["연동이 완료됐습니다. 채팅방을 다시 불러옵니다.","Linking complete. Reloading the chat room."],["채팅방을 이용하려면 보안 인증을 완료해 주세요.","Complete the security check to use the chat room."],["게시판에 고유 닉네임이 없는 분만 먼저 등록해 주세요. 이미 등록한 분은 자동으로 입장합니다. 게시판과 채팅방은 같은 닉네임을 사용합니다.", "If you do not have a board nickname, register one first. Registered users join automatically. The board and chat use the same nickname."],["먼저 게시판에서 고유 닉네임을 등록해 주세요.", "Please register a board nickname before joining."],["← NOW Mind Search 홈으로", "← NOW Mind Search home"],["게시판 이동", "Board navigation"],["닉네임만 삭제합니다. 게시글과 댓글은 유지됩니다. 확인하려면 현재 고유 닉네임을 입력하세요:", "This deletes your nickname and keeps your posts and comments. Enter your current nickname to confirm:"],["관리자에게 계정 및 모든 기록 삭제를 신청합니다. 관리자가 승인하면 복구할 수 없습니다. 확인 문구:", "Request deletion of your account and all records. They cannot be recovered once an administrator approves the request. Confirmation text:"],["닉네임만 삭제하면 기존 게시글·댓글·채팅은 남고 이름을 다시 등록할 수 있습니다. 계정 전체 삭제는 관리자에게 신청하며, 관리자가 승인하면 게시글·댓글·채팅과 익명 계정까지 영구 삭제됩니다. 원래 닉네임을 만든 앱에서만 삭제할 수 있습니다.","Deleting your nickname keeps your posts, comments, and chat messages; you may register a new name. Full account deletion requires admin approval and permanently deletes account data. You can request deletion only from the original device."],["공개 게시판 · 별명은 공개되지만 작성자 삭제 권한은 익명 계정으로 확인합니다. 브라우저의 로그인 정보가 삭제되면 기존 글을 삭제하지 못할 수 있습니다.","Public board · Nicknames are visible. Deletion rights are verified through your anonymous account. If browser login data is lost, you may not be able to delete old posts."],["가입 없는 익명 계정입니다. 브라우저 데이터를 삭제하거나 기기를 바꾸면 이 닉네임을 복구할 수 없습니다. 기존 게시글의 별명과는 별개로 새로 등록됩니다.","This is an anonymous account. If you clear browser data or change devices, you may lose access to this nickname. Registration is separate from older post display names."],["다른 브라우저에서 같은 닉네임을 사용하려면 이곳에서 코드를 발급하세요. 코드는 5분 동안 한 번만 사용할 수 있습니다.","Generate a code to use the same nickname in another browser. The code can be used once within 5 minutes."],["공개 채팅방입니다. 모든 참여자가 메시지와 닉네임을 볼 수 있습니다. 개인정보를 올리지 말고 서로 존중해 주세요.","This is a public chat room. Everyone can see messages and nicknames. Do not share personal information; please respect others."],[" 먼저 등록해 주세요. 이미 등록한 분은 자동으로 입장합니다. 게시판과 채팅방은 같은 닉네임을 사용합니다."," please register first. Existing users enter automatically. The board and chat share the same nickname."],["코드가 발급됐습니다. 다른 브라우저에서 5분 안에 입력하세요. 코드는 다른 사람에게 보여주지 마세요.","Code generated. Enter it in the other browser within 5 minutes. Do not share it."],["이미 다른 앱에서 고유 닉네임을 사용 중이라면 그 앱에서 발급한 연동 코드를 입력하세요.","If you already have a nickname on another device, enter its linking code here."],["메시지 간 최소 5초 · 시간당 최대 60개 · 본인 메시지는 삭제할 수 있습니다.","Wait at least 5 seconds between messages · Maximum 60 per hour · You can delete your own messages."],["계정 삭제 신청을 관리자에게 제출할까요? 제출 즉시 삭제되지는 않습니다.","Submit an account deletion request? Your account will not be deleted immediately."],["게시판에서 고유 닉네임을 등록하면 채팅방에서도 같은 이름을 사용합니다.","Register a unique nickname on the board to use the same name in chat."],["신고가 접수되었습니다. 운영자가 확인할 수 있도록 저장되었습니다.","Report submitted for administrator review."],["공개 게시판 연결을 준비 중입니다. 잠시 후 다시 시도해 주세요.","Preparing board connection. Please try again shortly."],["계정 삭제 신청이 접수됐습니다. 관리자가 확인한 뒤 처리합니다.","Account deletion request received. An administrator will review it."],["이미 사용 중인 닉네임입니다. 다른 이름을 선택해 주세요.","That nickname is already taken. Choose another."],["이 페이지에는 글이 없습니다. 최신 글로 돌아가 주세요.","No posts on this page. Return to the latest posts."],["고유 닉네임을 삭제하고 다른 기기와의 연결도 해제할까요?","Delete the nickname and unlink other devices?"],["고유 닉네임 등록 (2~30자 · 변경 및 복구 불가)","Register unique nickname (2–30 characters · cannot be changed or recovered)"],["Turnstile 사이트 키가 설정되지 않았습니다.","Security site key is not configured."],["보안 인증이 만료되었습니다. 다시 인증해 주세요.","Security verification expired. Please verify again."],["Turnstile 스크립트를 불러오지 못했습니다.","Could not load the security check."],["마음챙김 이야기와 일상을 자유롭게 나눠 보세요.","Share your mindfulness experiences and everyday life."],["게시판 이용을 위해 보안 인증을 완료해 주세요.","Complete the security check to use the board."],["보안 인증에 실패했습니다. 다시 시도해 주세요.","Security verification failed. Please try again."],["연동이 완료됐습니다. 게시판을 다시 불러옵니다.","Linking complete. Reloading the board."],["게시판의 고유 닉네임으로 자동 입장합니다.","You will join automatically using your board nickname."],["게시판에서 고유 닉네임을 등록해 주세요.","Please register a unique nickname on the board."],["💬 NOW Mind Search 실시간 게시판","💬 NOW Mind Search Live Board"],["메시지는 5초 간격으로 보내 주세요.","Please wait 5 seconds between messages."],["상세 설명 (선택, 최대 500자)","Details (optional, max 500 characters)"],["게시판에 고유 닉네임이 없는 분만","Only if you do not have a unique board nickname"],["게시판 닉네임 등록이 필요합니다.","Board nickname registration is required."],["새로고침 후 다시 시도해 주세요.","Refresh and try again."],["고유 닉네임 등록 후 자동 입력","Automatically filled after nickname registration"],["운영자 관리실, 대기 중인 신고","Admin dashboard, pending reports: "],["게시판에서 닉네임 등록하기 →","Register a nickname on the board →"],["메시지 입력 (최대 500자)","Type a message (max 500 characters)"],["🔑 고유 닉네임 일회용 연동","🔑 One-time nickname linking"],["Turnstile 초기화 실패","Security check initialization failed"],["보안 인증 토큰이 없습니다.","Missing security verification token."],["게시글과 댓글은 유지됩니다.","Posts and comments will remain."],["게시판에서 닉네임 등록하기","Register a nickname on the board"],["고유 닉네임 / 계정 삭제","Nickname / account deletion"],["관리자에게 계정 삭제 신청","Request account deletion"],["운영자 신고 관리실로 이동","Open admin report dashboard"],["익명 인증에 실패했습니다.","Anonymous authentication failed."],["이 메시지를 삭제할까요?","Delete this message?"],["자유롭게 이야기해 주세요","Share your thoughts"],["신고 사유를 선택하세요.","Choose a reason for reporting."],["이미 신고한 항목입니다.","You have already reported this item."],["공개 게시판 연결 실패:","Board connection failed:"],["고유 닉네임 등록 완료:","Nickname registered:"],["📢 채팅방 이용 안내","📢 Chat Room Guide"],["고유 닉네임 기기 연동","Link nickname across devices"],["일회용 연동 코드 발급","Generate one-time link code"],["계정 삭제 신청 접수됨","Deletion request submitted"],["🔐 운영자 관리실 ↗","🔐 Admin Dashboard ↗"],["게시판 불러오기 실패:","Could not load board:"],["계정 삭제 신청 실패:","Deletion request failed:"],["메시지를 보냈습니다.","Message sent."],["공개 게시판 준비 중","Public board"],["아직 글이 없습니다.","No posts yet."],["페이지당 최대 50개","Up to 50 per page"],["연결 준비 중...","Preparing connection..."],["24자리 연동 코드","24-character linking code"],["고유 닉네임만 삭제","Delete nickname only"],["사용할 고유 닉네임","Choose a unique nickname"],["이전 기록(미인증)","Older record (unverified)"],["게시글 페이지 이동","Post pagination"],["채팅방 연결 실패:","Chat connection failed:"],["닉네임 등록 실패:","Nickname registration failed:"],["닉네임 삭제 실패:","Nickname deletion failed:"],["공개 게시판 연결됨","Board connected"],["으로 입장했습니다.","."],["메시지 삭제 실패:","Could not delete message:"],["💬 자유 게시판","💬 Community Board"],["제목을 입력하세요","Enter a title"],["기존 닉네임 연결","Link existing nickname"],["정말 삭제할까요?","Are you sure you want to delete this?"],["이전 글 보기 →","Older posts →"],["댓글 작성 실패:","Could not add comment:"],["코드 발급 실패:","Could not generate code:"],["게시판으로 이동","Go to board"],["욕설 및 괴롭힘","Abuse or harassment"],["글 작성 실패:","Could not publish post:"],["게시판 닉네임 ","Joined with nickname "],["V2.1 정식","V2.1 Official"],["스팸 및 광고","Spam or advertising"],["개인정보 침해","Privacy violation"],["연결 중...","Connecting..."],["운영자 관리실","Admin Dashboard"],["고유 닉네임","Unique nickname"],["닉네임 등록","Register nickname"],["내 글 삭제","Delete my post"],["게시판 신고","Report board content"],["게시글 신고","Report post"],["← 최신 글","← Latest posts"],["삭제 실패:","Delete failed:"],["전송 실패:","Send failed:"],["신고 실패:","Report failed:"],["연동 실패:","Linking failed:"],["연결 실패:","Connection failed:"],["← 홈으로","← Home"],["댓글 신고","Report comment"],["신고 사유","Report reason"],["신고 접수","Submit report"],["댓글 달기","Add comment"],["글 제목","Post title"],["글 작성","Publish post"],["보내기","Send"],["메시지","Message"],["게시글","post"],["페이지","Page"],["게시판","Board"],["삭제","Delete"],["내용","Content"],["기타","Other"],["취소","Cancel"],["신고","Report"],["댓글","comment"],["홈","Home"]];
pairs.push(
 ["NOW길드에 가입하시겠어요?","Would you like to join NOW Guild?"],
 ["가입하기","Join guild"],
 ["NOW길드 가입 상태","NOW Guild membership"],
 ["가입 상태를 확인하는 중이에요.","Checking your membership…"],
 ["이미 NOW길드에 가입했어요.","You are already a NOW Guild member."],
 ["가입하면 고유 닉네임이 공개 길드원 명단에 표시됩니다.","Your unique nickname will appear on the public guild roster if you join."],
 ["길드 구성표 보기","View guild ranks"],
 ["길드 가입 상태를 확인하지 못했어요. 잠시 후 새로고침해 주세요.","Could not check membership. Refresh the page to try again."],
 ["길드 가입을 완료하지 못했어요. 다시 시도해 주세요.","Could not join the guild. Please try again."],
 ["가입 안 함","Skip joining"],
 ["고유 닉네임 등록 및 NOW길드 가입 완료:","Nickname registered and NOW Guild joined:"]
);
const map=new Map(pairs);
const extra={...window.MIND_SEARCH_EXTRA_LANG,
"NOW길드에 가입하시겠어요?":["要加入 NOW 公会吗？","NOWギルドに参加しますか？"],
"가입하기":["加入公会","ギルドに参加"],
"NOW길드 가입 상태":["NOW 公会成员状态","NOWギルドの参加状況"],
"가입 상태를 확인하는 중이에요.":["正在确认成员状态…","参加状況を確認しています…"],
"이미 NOW길드에 가입했어요.":["您已加入 NOW 公会。","すでにNOWギルドに参加しています。"],
"가입하면 고유 닉네임이 공개 길드원 명단에 표시됩니다.":["加入后，您的专属昵称将显示在公开成员名单中。","参加すると固有ニックネームが公開メンバー一覧に表示されます。"],
"길드 구성표 보기":["查看公会等级","ギルドの階級を見る"],
"가입 안 함":["暂不加入","参加しない"],

"💬 NOW Mind Search 실시간 게시판":["💬 NOW Mind Search 实时留言板","💬 NOW Mind Search リアルタイム掲示板"],
"고유 닉네임이 있으면 자동으로 입장합니다.":["已有专属昵称时会自动进入。","固有ニックネームがあれば自動で入室します。"],
"닉네임 등록 또는 연결하기":["注册或关联昵称","ニックネームを登録・連携"],
"닉네임 설정":["昵称设置","ニックネーム設定"],
"닉네임을 등록하거나 연결해 주세요.":["请注册或关联您的昵称。","ニックネームを登録または連携してください。"],
"글과 댓글":["帖子与评论","投稿とコメント"],
"🔐 운영자 관리실":["🔐 管理控制台","🔐 管理画面"],
"운영자 관리실 새 페이지로 열기":["在单独页面打开管理控制台","管理画面を別ページで開く"],
"연동이 완료됐습니다. 채팅방을 다시 불러옵니다.":["关联成功，正在重新加载聊天室。","連携が完了しました。チャットルームを再読み込みします。"],
"채팅방을 이용하려면 보안 인증을 완료해 주세요.":["请完成安全验证以使用聊天室。","チャットを利用するにはセキュリティ認証を完了してください。"]
};
const french={
"고유 닉네임이 있으면 자동으로 입장합니다.":"Vous rejoignez automatiquement le chat avec votre pseudo enregistré.",
"닉네임 등록 또는 연결하기":"Enregistrer ou associer un pseudo",
"닉네임 설정":"Paramètres du pseudo",
"닉네임을 등록하거나 연결해 주세요.":"Enregistrez ou associez votre pseudo pour participer.",
"글과 댓글":"Publications et commentaires",
"🔐 운영자 관리실":"🔐 Administration",
"운영자 관리실 새 페이지로 열기":"Ouvrir l’administration dans une autre page",
"연동이 완료됐습니다. 채팅방을 다시 불러옵니다.":"Association terminée. Le chat va se recharger.",
"채팅방을 이용하려면 보안 인증을 완료해 주세요.":"Terminez la vérification de sécurité pour accéder au chat.",
  "게시판에 고유 닉네임이 없는 분만 먼저 등록해 주세요. 이미 등록한 분은 자동으로 입장합니다. 게시판과 채팅방은 같은 닉네임을 사용합니다.": "Si vous n’avez pas de pseudo sur le forum, inscrivez-vous d’abord. Les membres déjà inscrits accèdent automatiquement au chat. Le même pseudo est utilisé sur le forum et dans le chat.",
  "먼저 게시판에서 고유 닉네임을 등록해 주세요.": "Inscrivez d’abord un pseudo sur le forum.",
  "← NOW Mind Search 홈으로": "← Accueil NOW Mind Search",
  "게시판 이동": "Navigation du forum",
  "닉네임만 삭제합니다. 게시글과 댓글은 유지됩니다. 확인하려면 현재 고유 닉네임을 입력하세요:": "Cette action supprime votre pseudo et conserve vos publications et commentaires. Pour confirmer, saisissez votre pseudo actuel :",
  "관리자에게 계정 및 모든 기록 삭제를 신청합니다. 관리자가 승인하면 복구할 수 없습니다. 확인 문구:": "Vous demandez à l’administration de supprimer votre compte et toutes vos données. Après approbation, la suppression est définitive. Texte de confirmation :",
  "닉네임만 삭제하면 기존 게시글·댓글·채팅은 남고 이름을 다시 등록할 수 있습니다. 계정 전체 삭제는 관리자에게 신청하며, 관리자가 승인하면 게시글·댓글·채팅과 익명 계정까지 영구 삭제됩니다. 원래 닉네임을 만든 앱에서만 삭제할 수 있습니다.": "Supprimer votre pseudo conserve vos publications, commentaires et messages. Vous pourrez choisir un autre pseudo. La suppression complète du compte doit être approuvée par l’administration et efface définitivement toutes ses données. Utilisez l’appareil d’origine pour faire la demande.",
  "공개 게시판 · 별명은 공개되지만 작성자 삭제 권한은 익명 계정으로 확인합니다. 브라우저의 로그인 정보가 삭제되면 기존 글을 삭제하지 못할 수 있습니다.": "Forum public · Les pseudos sont visibles. Le droit de suppression est vérifié via votre compte anonyme. Si les données de connexion du navigateur sont effacées, vous risquez de ne plus pouvoir supprimer vos anciennes publications.",
  "가입 없는 익명 계정입니다. 브라우저 데이터를 삭제하거나 기기를 바꾸면 이 닉네임을 복구할 수 없습니다. 기존 게시글의 별명과는 별개로 새로 등록됩니다.": "Ce compte est anonyme. Si vous changez d’appareil ou effacez les données du navigateur, vous risquez de perdre l’accès à votre pseudo. L’inscription est indépendante des anciens noms affichés.",
  "다른 브라우저에서 같은 닉네임을 사용하려면 이곳에서 코드를 발급하세요. 코드는 5분 동안 한 번만 사용할 수 있습니다.": "Générez un code pour utiliser le même pseudo dans un autre navigateur. Il est utilisable une seule fois et valable 5 minutes.",
  "공개 채팅방입니다. 모든 참여자가 메시지와 닉네임을 볼 수 있습니다. 개인정보를 올리지 말고 서로 존중해 주세요.": "Ce chat est public. Tout le monde peut voir les messages et les pseudos. Respectez les autres et protégez vos informations personnelles.",
  " 먼저 등록해 주세요. 이미 등록한 분은 자동으로 입장합니다. 게시판과 채팅방은 같은 닉네임을 사용합니다.": " inscrivez-vous d’abord. Les membres déjà inscrits accèdent automatiquement au chat. Le même pseudo est utilisé sur le forum et dans le chat.",
  "코드가 발급됐습니다. 다른 브라우저에서 5분 안에 입력하세요. 코드는 다른 사람에게 보여주지 마세요.": "Code généré. Saisissez-le dans l’autre navigateur sous 5 minutes. Gardez-le confidentiel.",
  "이미 다른 앱에서 고유 닉네임을 사용 중이라면 그 앱에서 발급한 연동 코드를 입력하세요.": "Si vous avez déjà un pseudo sur un autre appareil, saisissez le code d’association qui y a été généré.",
  "메시지 간 최소 5초 · 시간당 최대 60개 · 본인 메시지는 삭제할 수 있습니다.": "5 secondes minimum entre les messages · 60 messages par heure au maximum · Vous pouvez supprimer vos propres messages.",
  "계정 삭제 신청을 관리자에게 제출할까요? 제출 즉시 삭제되지는 않습니다.": "Envoyer la demande de suppression du compte à l’administration ? La suppression interviendra après examen.",
  "게시판에서 고유 닉네임을 등록하면 채팅방에서도 같은 이름을 사용합니다.": "Inscrivez un pseudo unique sur le forum pour l’utiliser aussi dans le chat.",
  "신고가 접수되었습니다. 운영자가 확인할 수 있도록 저장되었습니다.": "Signalement transmis à l’administration.",
  "공개 게시판 연결을 준비 중입니다. 잠시 후 다시 시도해 주세요.": "Préparation de la connexion au forum. Réessayez dans un instant.",
  "계정 삭제 신청이 접수됐습니다. 관리자가 확인한 뒤 처리합니다.": "Demande de suppression reçue. L’administration va l’examiner.",
  "이미 사용 중인 닉네임입니다. 다른 이름을 선택해 주세요.": "Ce pseudo est déjà pris. Choisissez-en un autre.",
  "이 페이지에는 글이 없습니다. 최신 글로 돌아가 주세요.": "Aucune publication sur cette page. Revenez aux publications récentes.",
  "고유 닉네임을 삭제하고 다른 기기와의 연결도 해제할까요?": "Supprimer le pseudo et dissocier les autres appareils ?",
  "고유 닉네임 등록 (2~30자 · 변경 및 복구 불가)": "Inscrire un pseudo unique (2 à 30 caractères · modification et récupération indisponibles)",
  "Turnstile 사이트 키가 설정되지 않았습니다.": "La clé de vérification de sécurité est absente.",
  "보안 인증이 만료되었습니다. 다시 인증해 주세요.": "La vérification de sécurité a expiré. Réessayez.",
  "Turnstile 스크립트를 불러오지 못했습니다.": "Impossible de charger la vérification de sécurité.",
  "마음챙김 이야기와 일상을 자유롭게 나눠 보세요.": "Partagez vos expériences de pleine conscience et votre quotidien.",
  "게시판 이용을 위해 보안 인증을 완료해 주세요.": "Terminez la vérification de sécurité pour utiliser le forum.",
  "보안 인증에 실패했습니다. 다시 시도해 주세요.": "La vérification a échoué. Réessayez.",
  "연동이 완료됐습니다. 게시판을 다시 불러옵니다.": "Association terminée. Rechargement du forum.",
  "게시판의 고유 닉네임으로 자동 입장합니다.": "Vous accéderez automatiquement au chat avec votre pseudo du forum.",
  "게시판에서 고유 닉네임을 등록해 주세요.": "Inscrivez un pseudo unique sur le forum.",
  "💬 NOW Mind Search 실시간 게시판": "💬 Forum en direct NOW Mind Search",
  "메시지는 5초 간격으로 보내 주세요.": "Attendez 5 secondes entre les messages.",
  "상세 설명 (선택, 최대 500자)": "Détails (facultatif, 500 caractères max.)",
  "게시판에 고유 닉네임이 없는 분만": "Uniquement si vous n’avez pas de pseudo unique sur le forum",
  "게시판 닉네임 등록이 필요합니다.": "Vous devez inscrire un pseudo sur le forum.",
  "새로고침 후 다시 시도해 주세요.": "Actualisez la page et réessayez.",
  "고유 닉네임 등록 후 자동 입력": "Rempli automatiquement après l’inscription du pseudo",
  "운영자 관리실, 대기 중인 신고": "Tableau de bord, signalements en attente : ",
  "게시판에서 닉네임 등록하기 →": "Inscrire un pseudo sur le forum →",
  "메시지 입력 (최대 500자)": "Saisir un message (500 caractères max.)",
  "🔑 고유 닉네임 일회용 연동": "🔑 Association du pseudo par code à usage unique",
  "Turnstile 초기화 실패": "Impossible de démarrer la vérification de sécurité",
  "보안 인증 토큰이 없습니다.": "Jeton de vérification de sécurité manquant.",
  "게시글과 댓글은 유지됩니다.": "Les publications et les commentaires seront conservés.",
  "게시판에서 닉네임 등록하기": "Inscrire un pseudo sur le forum",
  "고유 닉네임 / 계정 삭제": "Suppression du pseudo ou du compte",
  "관리자에게 계정 삭제 신청": "Demander la suppression du compte",
  "운영자 신고 관리실로 이동": "Ouvrir le tableau de bord des signalements",
  "익명 인증에 실패했습니다.": "Échec de l’authentification anonyme.",
  "이 메시지를 삭제할까요?": "Supprimer ce message ?",
  "자유롭게 이야기해 주세요": "Partagez vos réflexions",
  "신고 사유를 선택하세요.": "Choisissez un motif de signalement.",
  "이미 신고한 항목입니다.": "Vous avez déjà signalé ce contenu.",
  "공개 게시판 연결 실패:": "Connexion au forum impossible :",
  "고유 닉네임 등록 완료:": "Pseudo enregistré :",
  "📢 채팅방 이용 안내": "📢 Guide du chat",
  "고유 닉네임 기기 연동": "Associer le pseudo à un autre appareil",
  "일회용 연동 코드 발급": "Générer un code à usage unique",
  "계정 삭제 신청 접수됨": "Demande de suppression envoyée",
  "🔐 운영자 관리실 ↗": "🔐 Administration ↗",
  "게시판 불러오기 실패:": "Impossible de charger le forum :",
  "계정 삭제 신청 실패:": "Échec de la demande de suppression :",
  "메시지를 보냈습니다.": "Message envoyé.",
  "공개 게시판 준비 중": "Forum public",
  "아직 글이 없습니다.": "Aucune publication pour le moment.",
  "페이지당 최대 50개": "Jusqu’à 50 par page",
  "연결 준비 중...": "Préparation de la connexion…",
  "24자리 연동 코드": "Code d’association à 24 caractères",
  "고유 닉네임만 삭제": "Supprimer uniquement le pseudo",
  "사용할 고유 닉네임": "Choisir un pseudo unique",
  "이전 기록(미인증)": "Ancienne entrée (non vérifiée)",
  "게시글 페이지 이동": "Navigation entre les pages",
  "채팅방 연결 실패:": "Connexion au chat impossible :",
  "닉네임 등록 실패:": "Inscription du pseudo impossible :",
  "닉네임 삭제 실패:": "Suppression du pseudo impossible :",
  "공개 게시판 연결됨": "Forum connecté",
  "으로 입장했습니다.": ".",
  "메시지 삭제 실패:": "Impossible de supprimer le message :",
  "💬 자유 게시판": "💬 Forum",
  "제목을 입력하세요": "Saisir un titre",
  "기존 닉네임 연결": "Associer un pseudo existant",
  "정말 삭제할까요?": "Confirmer la suppression ?",
  "이전 글 보기 →": "Publications plus anciennes →",
  "댓글 작성 실패:": "Impossible d’ajouter le commentaire :",
  "코드 발급 실패:": "Impossible de générer le code :",
  "게시판으로 이동": "Aller au forum",
  "욕설 및 괴롭힘": "Insultes ou harcèlement",
  "글 작성 실패:": "Impossible de publier :",
  "게시판 닉네임 ": "Connecté avec le pseudo du forum ",
  "V2.1 정식": "Version officielle V2.1",
  "스팸 및 광고": "Spam ou publicité",
  "개인정보 침해": "Atteinte à la vie privée",
  "연결 중...": "Connexion…",
  "운영자 관리실": "Tableau de bord d’administration",
  "고유 닉네임": "Pseudo unique",
  "닉네임 등록": "Inscrire le pseudo",
  "내 글 삭제": "Supprimer ma publication",
  "게시판 신고": "Signaler un contenu du forum",
  "게시글 신고": "Signaler la publication",
  "← 최신 글": "← Publications récentes",
  "삭제 실패:": "Échec de la suppression :",
  "전송 실패:": "Échec de l’envoi :",
  "신고 실패:": "Échec du signalement :",
  "연동 실패:": "Échec de l’association :",
  "연결 실패:": "Échec de la connexion :",
  "← 홈으로": "← Accueil",
  "댓글 신고": "Signaler le commentaire",
  "신고 사유": "Motif du signalement",
  "신고 접수": "Envoyer le signalement",
  "댓글 달기": "Ajouter un commentaire",
  "글 제목": "Titre de la publication",
  "글 작성": "Publier",
  "보내기": "Envoyer",
  "메시지": "Message",
  "게시글": "publication",
  "페이지": "Page",
  "게시판": "Forum",
  "삭제": "Supprimer",
  "내용": "Contenu",
  "기타": "Autre",
  "취소": "Annuler",
  "신고": "Signaler",
  "댓글": "commentaire",
  "홈": "Accueil",
  "NOW길드에 가입하시겠어요?": "Souhaitez-vous rejoindre la guilde NOW ?",
  "가입하기": "Rejoindre la guilde",
  "NOW길드 가입 상태": "Adhésion à la guilde NOW",
  "가입 상태를 확인하는 중이에요.": "Vérification de l’adhésion…",
  "이미 NOW길드에 가입했어요.": "Vous êtes déjà membre de la guilde NOW.",
  "가입하면 고유 닉네임이 공개 길드원 명단에 표시됩니다.": "Votre pseudo unique apparaîtra dans la liste publique des membres.",
  "길드 구성표 보기": "Voir les rangs de la guilde",
  "길드 가입 상태를 확인하지 못했어요. 잠시 후 새로고침해 주세요.": "Impossible de vérifier l’adhésion. Actualisez la page dans un instant.",
  "길드 가입을 완료하지 못했어요. 다시 시도해 주세요.": "Impossible de rejoindre la guilde. Réessayez.",
  "가입 안 함": "Passer",
  "고유 닉네임 등록 및 NOW길드 가입 완료:": "Pseudo inscrit et adhésion à la guilde NOW confirmée :"
};
Object.assign(french, {
  '고유 닉네임 등록 (2~30자)': 'Inscrire un pseudo unique (2 à 30 caractères)',
  '이 게시글 신고': 'Signaler cette publication',
  '이 댓글 신고': 'Signaler ce commentaire'
});
const origins=new Map(Object.entries(french).map(([ko,fr])=>[fr,ko]));for(const [ko,en] of pairs){origins.set(en,ko);const v=extra[ko];if(v){origins.set(v[0],ko);origins.set(v[1],ko)}}
const language=mindSearchLanguage;
let lang=language.read();
const button=document.createElement('select');button.id='languageToggle';button.setAttribute('aria-label','언어 선택');button.style.cssText='border:1px solid #cbdacf;background:#fff;color:#355a48;border-radius:24px;padding:9px 8px;font-weight:750;cursor:pointer;max-width:125px';
for(const [code,label] of [['ko','🇰🇷 Korean'],['en','🇺🇸 English'],['zh','🇨🇳 中文'],['ja','🇯🇵 日本語'],['fr','🇫🇷 Français']]){const o=document.createElement('option');o.value=code;o.textContent=label;button.append(o)}
const header=document.querySelector('.head,.top .container');if(header)header.append(button);else document.body.prepend(button);
function protectedNode(n){const e=n.parentElement;if(!e)return true;
if(e.closest('#boardPosts small'))return !e.matches('.board-nickname-badge');return !!e.closest('script,style,textarea,option,#messages .bubble .meta,#messages .bubble > div:not(.meta),#boardPosts .board-post h3,#boardPosts .board-post > p,#boardPosts .board-comment > p,#boardName,#nicknameNotice input,.board-nickname-register input:not([placeholder])')}
function translateText(value){const m=value.match(/^(\s*)([\s\S]*?)(\s*)$/);if(!m)return value;let core=m[2];if(!core)return value;
if(lang==='fr'){const admin=core.match(/^운영자 관리실, 대기 중인 신고 (\d+)건$/);if(admin)return m[1]+'Administration · Signalements en attente : '+admin[1]+m[3];}
const exact=origins.get(core)||core;
const target=ko=>lang==='ko'?ko:lang==='fr'?(french[ko]||map.get(ko)||ko):lang==='en'?(map.get(ko)||ko):((extra[ko]||[])[lang==='zh'?0:1]||map.get(ko)||ko);
if(map.has(exact)||extra[exact]||origins.has(core))return m[1]+target(exact)+m[3];
const joined=core.match(/^(?:고유 닉네임 (.+)으로 입장했습니다\.|Joined with nickname (.+)\.|已使用专属昵称「(.+)」进入。|固有ニックネーム「(.+)」で入室しました。)$/);
if(joined){const nickname=joined.slice(1).find(value=>value!==undefined);return m[1]+({ko:`고유 닉네임 ${nickname}으로 입장했습니다.`,en:`Joined with nickname ${nickname}.`,zh:`已使用专属昵称「${nickname}」进入。`,ja:`固有ニックネーム「${nickname}」で入室しました。`,fr:`Vous avez rejoint le chat avec le pseudo « ${nickname} ».`})[lang]+m[3]}
if(/^\d+(페이지| Page|页|ページ)$/.test(core)){const n=core.match(/^\d+/)[0];if(lang==='fr')return m[1]+'Page '+n+m[3];return m[1]+n+({ko:'페이지',en:' Page',zh:'页',ja:'ページ'})[lang]+m[3]}
for(const [ko,en] of pairs){if(!ko.endsWith(':'))continue;for(const candidate of [ko,en,...(extra[ko]||[])]){if(candidate&&core.startsWith(candidate))return m[1]+target(ko)+core.slice(candidate.length)+m[3]}}
return m[1]+core+m[3]}
const translateFromSource=language.sourceText(translateText);
let working=false;
function apply(){if(working)return;working=true;
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];
while(walker.nextNode()){const n=walker.currentNode;if(!protectedNode(n))nodes.push(n)}
for(const n of nodes){const t=translateFromSource(n,"text",n.nodeValue);if(t!==n.nodeValue)n.nodeValue=t}
for(const e of document.querySelectorAll('input[placeholder],textarea[placeholder],select option')){if(e.id==='boardName'&&e.value)continue;if(e.tagName==='OPTION'){if(e.parentElement===button)continue;const v=e.textContent;const t=translateFromSource(e,"text",v);if(t!==v)e.textContent=t;continue}const v=e.getAttribute('placeholder');const t=translateFromSource(e,'placeholder',v);if(t!==v)e.setAttribute('placeholder',t)}
for(const e of document.querySelectorAll('[aria-label]')){if(e.id==='languageToggle'||e.closest('#messages .bubble'))continue;const v=e.getAttribute('aria-label');const t=translateFromSource(e,'aria-label',v);if(t!==v)e.setAttribute('aria-label',t)}
const dateFormat=new Intl.DateTimeFormat(language.locales[lang],{dateStyle:'medium',timeStyle:'medium'});
for(const time of document.querySelectorAll('#boardPosts time[datetime]')){
  const date=new Date(time.dateTime);
  if(!Number.isNaN(date.getTime())){
    const value=dateFormat.format(date);
    if(time.textContent!==value)time.textContent=value;
  }
}
button.value=lang;
button.setAttribute('aria-label',language.labels[lang]);
const titles=document.getElementById('room')
  ? {ko:'NOW Mind Search | 실시간 게시판',en:'NOW Mind Search | Live Board',zh:'NOW Mind Search | 实时留言板',ja:'NOW Mind Search | リアルタイム掲示板',fr:'NOW Mind Search | Forum en direct'}
  : {ko:'커뮤니티 게시판 | NOW Mind Search',en:'Community Board | NOW Mind Search',zh:'社区论坛 | NOW Mind Search',ja:'コミュニティ掲示板 | NOW Mind Search',fr:'Forum | NOW Mind Search'};
document.title=titles[lang];
document.documentElement.lang=lang;
working=false;
}
button.onchange=()=>{lang=button.value;try{localStorage.setItem(language.key,lang)}catch(e){}apply()};
let pending=false;const observer=new MutationObserver(()=>{if(working||pending)return;pending=true;queueMicrotask(()=>{pending=false;observer.disconnect();apply();observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label']})})});
window.mindSearchCommunityText=translateText;
apply();observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label']});
})();