# AI 허공장 자체 쇼츠 제작 엔진

홈페이지 V3.0의 디자인과 기존 발행 로직을 변경하지 않고 별도 경로에서 작동합니다.

## 동작
- 매일 한국시간 19:00 GitHub Actions 실행 또는 Actions > AI Heogongjang Daily YouTube Short > Run workflow 수동 실행
- OpenAI API가 날짜별 새로운 한국어 6문장과 영어 번역 작성
- Edge TTS가 한국어 남성 음성 생성
- Python/Pillow가 산·달·별 배경 제작
- FFmpeg가 30초 세로 MP4, 한국어/영어 자막, 음성, 합성 배경음 제작
- 결과물은 Actions Artifacts에 14일간 저장
- `ENABLE_SHORTS_PUBLISH=true`인 경우에만 YouTube에 공개 게시
- 영상 설명에 공식 홈페이지 링크 삽입

## 최초 1회 필요한 설정
GitHub 저장소 Settings > Secrets and variables > Actions > Secrets에 다음 네 가지를 등록:
- `OPENAI_API_KEY`: OpenAI API 키 (사용량 과금 가능)
- `YOUTUBE_CLIENT_ID`: Google Cloud OAuth 데스크톱 앱 클라이언트 ID
- `YOUTUBE_CLIENT_SECRET`: 해당 클라이언트 비밀
- `YOUTUBE_REFRESH_TOKEN`: YouTube 채널 소유자 계정이 youtube.upload 권한을 승인한 OAuth 리프레시 토큰

Google Cloud에서 YouTube Data API v3를 활성화해야 합니다. OAuth 앱 검증/테스트 사용자 제한, 토큰 만료 및 YouTube 업로드 할당량을 확인하세요. 토큰을 소스 코드나 공개 파일에 절대 저장하지 마세요.

먼저 Actions에서 수동 실행해 영상과 자막을 검수하세요. 정상 동작을 확인한 다음 Actions Variables에 `ENABLE_SHORTS_PUBLISH`를 `true`로 등록하면 이후 예약 실행에서 업로드합니다. 설정하지 않으면 **제작만 하고 게시하지 않습니다.**

## 운영상의 제한
- GitHub Actions cron은 실행 시각이 지연되거나 비활성 저장소에서 중지될 수 있습니다.
- TTS는 외부 서비스 Edge TTS에 의존하므로 장애 시 작업이 실패합니다.
- 풍경은 AI 동영상 생성이 아닌 코드로 제작한 정적 일러스트입니다. 움직임 있는 생성형 영상은 별도 모델이 필요합니다.
- API 사용료, GitHub Actions 제한, YouTube 인증 유지가 필요합니다.
- 실패하면 업로드를 하지 않도록 구성했으며, GitHub Actions 실행 로그로 확인할 수 있습니다.
- 유튜브 고정 댓글은 이 엔진에서 지원하지 않습니다.
