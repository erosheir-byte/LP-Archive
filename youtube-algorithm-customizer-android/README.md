# 🎯 FocusTube Android — YouTube 알고리즘 커스터마이저 (모바일 앱)

크롬 확장판([`../youtube-algorithm-customizer`](../youtube-algorithm-customizer))의
안드로이드 버전입니다. 모바일 유튜브(m.youtube.com)를 앱 내 WebView로 띄우고
스크립트를 주입해, **홈 피드를 내가 정한 주제(수험생 공부 자극 등)로 교체**합니다.

> 유튜브 공식 앱 자체는 어떤 방법으로도 수정할 수 없으므로,
> "유튜브를 대신 보는 앱"을 만드는 방식입니다. 이 앱에서 로그인한 채로
> 공부 영상을 시청하면 같은 계정의 공식 앱 추천도 함께 재학습됩니다.

## 기능

- 유튜브 홈 피드를 키워드 기반 피드로 교체 (프리셋 5종 + 사용자 정의)
- Shorts 숨기기 (홈 셸프, 하단 탭, 링크 전부)
- 시청 중 하단 추천 영상 숨기기, 댓글 숨기기
- 전체화면 재생 지원, 외부 링크는 기본 브라우저로 분리
- 일반 모바일 크롬 User-Agent 적용 (WebView 로그인 차단 완화)
- 설정은 네이티브 화면(우상단 ⚙)에서 변경, 유튜브 화면 복귀 시 즉시 반영

## 빌드 방법 (APK 만들기)

1. [Android Studio](https://developer.android.com/studio) 설치 (무료)
2. Android Studio에서 **Open** → 이 폴더(`youtube-algorithm-customizer-android`) 선택
3. Gradle 동기화가 끝나면 메뉴 **Build → Build App Bundle(s) / APK(s) → Build APK(s)**
4. 생성된 `app/build/outputs/apk/debug/app-debug.apk`를 폰으로 옮겨 설치
   (설치 시 "출처를 알 수 없는 앱 허용" 필요)

USB로 폰을 연결했다면 **Run ▶** 버튼으로 바로 설치·실행할 수도 있습니다.

명령줄 빌드(SDK 설치되어 있을 때):

```bash
./gradlew assembleDebug
```

## 사용법 — 수험생 모드 예시

1. 앱 실행 → 홈이 「수험생 · 공부 자극」 피드로 표시됨 (기본값)
2. 우상단 ⚙ 또는 피드의 ⚙️ 버튼에서 주제·옵션 변경
3. 유튜브 로그인 후 라이브러리 → 기록에서 기존 시청 기록 삭제 (알고리즘 초기화)
4. 이 앱에서 공부 영상을 시청 → 며칠 내로 공식 유튜브 앱 추천도 공부 위주로 변화

## 구조

```
app/src/main/
├── java/com/focustube/app/
│   ├── MainActivity.kt      # WebView + 스크립트 주입 + 전체화면/외부링크 처리
│   ├── SettingsActivity.kt  # 네이티브 설정 화면
│   └── AppSettings.kt       # 프리셋 정의 + SharedPreferences + JSON 브리지
├── assets/inject.js         # 피드 교체·숨김 스크립트 (m.youtube.com 전용)
└── res/                     # 레이아웃, 문자열, 테마, 런처 아이콘
tools/make_icons.py          # 런처 아이콘 생성 스크립트 (의존성 없음)
```

## 한계와 주의사항

- 본인 계정의 시청 환경을 관리하는 **개인용 도구**입니다 (스토어 배포 비권장).
- 구글이 일부 WebView 환경에서 로그인을 차단할 수 있습니다. User-Agent 조정으로
  완화했지만, 로그인이 막히면 로그아웃 상태로도 피드 교체 기능은 동작합니다
  (이 경우 알고리즘 재학습은 PC 확장판으로 진행하세요 — 계정 단위라 효과 동일).
- 유튜브 모바일 페이지 구조가 바뀌면 일부 숨김 셀렉터나 피드 파싱이 깨질 수
  있습니다. `assets/inject.js`만 수정하면 됩니다.
- iOS는 같은 구조(WKWebView + 스크립트 주입)로 포팅 가능하지만 별도 프로젝트가
  필요합니다.
