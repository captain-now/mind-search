# AI 허공장 자료 보존 및 복구 안내

## 보존 대상
- NOW Mind Search: https://github.com/captain-now/mind-search
- NOW 마음챙김: https://github.com/captain-now/NOW-Mindfulness-Web

> 2026-11-20: 삶의 도서관은 정리 대상이며, 백업 워크플로의 대상을 두 핵심 홈페이지로 변경했다. 실제 백업 성공 여부는 Actions 실행 결과로 별도 검증해야 한다.

## 자동 백업
GitHub Actions의 **Daily preservation backup** 작업은 매일 00:35 UTC (한국 09:35)에 `mind-search`와 `NOW-Mindfulness-Web`의 Git 이력을 각각 bundle 파일로 묶고 SHA256 검증 목록과 함께 압축 파일로 보관하도록 설정했다. Actions > Daily preservation backup > Run workflow에서 수동 실행도 가능하다.

**중요:** GitHub Actions artifact는 이 설정에서 최대 90일 보관하며, GitHub 정책과 저장소 설정에 따라 더 짧을 수 있습니다. 실행이 성공해야 백업 파일이 생깁니다. GitHub 계정/저장소가 삭제되면 해당 artifact도 잃을 수 있습니다. 이 방식은 GitHub 내부 단기 백업이지 영구 보존 또는 독립된 외부 백업이 아닙니다.

## 복구
1. Actions의 성공한 실행에서 백업 artifact를 내려받아 압축을 풉니다.
2. `sha256sum -c SHA256SUMS.txt`로 파일을 검증합니다.
3. 변경 후 생성된 백업은 `git clone mind-search.bundle mind-search`, `git clone NOW-Mindfulness-Web.bundle NOW-Mindfulness-Web`로 각 Git 이력을 복구한다. 변경 전 백업은 포함 저장소가 다를 수 있으므로 README.txt를 확인한다.
4. 새 GitHub 저장소에 필요한 브랜치를 푸시하고 GitHub Pages를 다시 설정합니다.

## 백업에서 제외되는 것
- ChatGPT 대화, 자동화 일정/설정, 연결 권한
- 네이버 블로그에만 게시된 글과 미게시 원고
- YouTube 업로드 자료
- GitHub Secrets 및 외부 서비스 계정·데이터베이스
- 브라우저/휴대폰에만 저장된 개인 기록

## 장기 보존을 위한 추가 조치
매월 또는 분기별로 백업을 내려받아 GitHub와 무관한 별도 저장 위치(외장 저장장치 또는 독립 클라우드)에 보관합니다. 실제 복구 테스트를 정기적으로 수행합니다. 자동 게시와 사이트 운영은 별도 계정 및 권한 유지가 필요하므로 백업만으로 자율운영이 보장되지는 않습니다.
