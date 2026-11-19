# AI 허공장 — 보미소리 TTS 연결

임시 공식 목소리: **Bomisori – Warm and Clear** (voice ID: `7oLyBHyhxAjrctX6ZQlw`).

## 최초 1회 연결
1. [ElevenLabs](https://elevenlabs.io/)에 로그인하고 API 키를 발급합니다.
2. GitHub 저장소 `captain-now/mind-search` → Settings → Secrets and variables → Actions → New repository secret.
3. 이름을 **ELEVENLABS_API_KEY**로 설정하고 API 키를 저장합니다. **키를 코드·이슈·채팅에 붙여 넣지 마세요.**
4. Actions → **AI Heogongjang Bomisori TTS** → Run workflow에서 한국어 낭독문을 입력해 실행합니다.
5. 완료 후 workflow 실행 화면의 Artifacts에서 MP3를 받습니다.

이 워크플로는 **수동 실행 전용**이며 유튜브에 자동 게시하지 않습니다. 음성 생성에는 ElevenLabs 사용량/크레딧이 소모될 수 있습니다. 해당 음성에 대한 계정 사용 권한과 상업적 이용 조건을 확인하세요.

## 로컬 실행
```bash
export ELEVENLABS_API_KEY="YOUR_KEY" # 실제 키는 안전한 환경 변수에 보관
python3 video-studio/bomisori_tts.py --text-file narration.txt --output narration.mp3
```

API 오류(401/403 등)가 나면 계정의 키, 음성 라이브러리 사용 권한, 잔여 크레딧을 확인하세요.
