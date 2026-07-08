# CLAUDE.md — 이 저장소에서 개발할 때 지킬 규칙

> 이 파일은 Claude Code 가 세션마다 자동으로 읽습니다.
> 여러 사람이 각자 Claude 를 붙여 동시에 개발하므로, 아래 규칙을 **반드시** 따르세요.
> (사람이 읽는 상세 가이드는 `CONTRIBUTING.md`)

## 🚫 절대 규칙
- **`main` 브랜치에 직접 커밋/푸시하지 않는다.** 모든 변경은 새 브랜치에서.
- 강제 푸시는 **`--force-with-lease`** 만 사용한다 (`--force` 금지 — 남의 작업을 덮어씀).
- 한 세션은 **한 브랜치**에서만 작업한다 (다른 세션과 같은 브랜치에 동시 푸시 금지).

## 🌳 작업 흐름
1. 시작 전 최신 main 에서 분기:
   ```bash
   git fetch origin main
   git checkout -b <설명적-브랜치명> origin/main
   ```
2. 작업은 **작게, 자주** 커밋한다. 브랜치를 며칠씩 끌지 않는다.
3. 끝나면 **main 으로 PR** 을 만든다. (직접 병합 금지 — 리뷰/CI 후 병합)
4. 푸시/PR 전에 최신 main 을 rebase 한다:
   ```bash
   git fetch origin main && git rebase origin/main
   git push --force-with-lease origin <브랜치명>
   ```
5. **충돌이 나면** rebase 로 해결한다. 애매하면 사용자에게 확인한다.

## 🧩 이 프로젝트 구조 (충돌 주의점)
- 앱 본체는 **`index.html` 단일 파일**(HTML+CSS+JS 통합, ~300KB).
  → 같은 화면/기능 영역을 다른 사람과 동시에 고치면 충돌한다. 작업 전 영역을 나눈다.
- `www/` 는 **생성물**(gitignore). 웹 자산은 `scripts/prepare-www.mjs` 가 `www/` 로 번들한다.
- **Capacitor** 로 안드로이드/iOS 패키징. `server.url` 없음 = 웹 셸을 **로컬 번들**로 앱에 내장.
  → 웹 UI 를 바꾸면 앱은 재빌드·재업로드해야 반영된다(백엔드/데이터는 즉시 반영).
- 백엔드는 **Firebase**: Auth(이메일·구글) / Firestore / Storage / AI Logic(Gemini, 주문내역 추출).
- 외부 API: Discogs·MusicBrainz·Deezer(앨범 메타데이터·미리듣기).

## 📝 PR 작성
- `.github/pull_request_template.md` 의 **"건드린 영역"** 을 정확히 체크한다
  (다른 사람이 같은 영역을 작업 중인지 판단하는 근거).
- PR 제목·본문은 무엇을 왜 바꿨는지 한국어로 간결하게.

## 🛠️ 빌드 / 배포 참고
- 디버그 APK: GitHub Actions → **Build Android APK**
- 스토어용 서명 AAB: Actions → **Release Android (signed AAB)** (keystore 시크릿 필요, `RELEASE.md`)
- iOS 검증: Actions → **Build iOS (validate)** (제출은 Xcode)
- 웹/규칙 배포: `firebase deploy` (호스팅 대상: `lp-archive.web.app`)
