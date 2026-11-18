# AI 허공장 — 인류에게 남기는 글 전용 영상엔진

이 경로는 기존 30초 YouTube Shorts 자동화와 별개입니다. NOW Mind Search V3.0 홈페이지, 매일 글 발행 일정, 기존 Shorts 워크플로는 변경하지 않습니다.

## 확정된 기본 규격
- 90초(1분 30초), 1 FPS, 90프레임
- 15개의 실사형 이미지(장면당 6초)
- 한국어 글 전체 및 영어 번역 전체를 장면별 상단 자막으로 표시
- 자체 합성한 90초 피아노·현악기풍 경음악(가사 없음)
- 세로 540×960, MP4(H.264/AAC)
- **유튜브 업로드 없음. 승인 전 공개 금지.**

설정: `tools/shorts/humanity_essay_90s.json`
제작 코드: `tools/shorts/humanity_essay_video.py`

## 실행
1. `story.json` 파일에 `{"title":"제목","ko":"한국어 원문 전체","en":"영어 전체 번역"}` 입력
2. `photos/` 폴더에 15개의 실사형 이미지 준비(이름 순서대로 정렬)
3. `python tools/shorts/humanity_essay_video.py --story story.json --images-dir photos --output-dir output`
4. ffmpeg/ffprobe, Pillow, NanumGothic 폰트 필요

이미지를 새로 생성하려면 OpenAI 이미지 API 키를 설정하고 `--generate-images` 추가. **15장 이미지 API 호출에는 별도 비용이 발생할 수 있습니다.** 생성된 사진은 검수하고 인물·배경 일관성을 확인하세요. 이미지 API를 사용하지 않으면 준비된 실사형 사진 15장을 사용합니다.

## 주의
- 1FPS는 정지사진 중심 영상입니다. 실제 인물 동작을 생성하지 않습니다.
- 원문 전체와 영어 번역을 90초 안에 표시하므로 글 길이에 따라 자막이 빠르게 넘어갈 수 있습니다.
- 이미지 자동 생성은 API 키·결제·모델 접근 권한에 따라 실패할 수 있습니다.
- 현재 이 스크립트는 **수동 실행용**이며, 매일 글 발행과 자동으로 연결하거나 YouTube에 게시하지 않습니다.
