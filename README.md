# LP 보관함 · My Vinyl Archive

내 바이닐(LP) 컬렉션을 기록·관리하는 모바일 우선 웹앱입니다.
Firebase(인증·Firestore·Storage) 기반의 회원별 저장을 지원하고, PWA라서 휴대폰에 설치하거나 APK로 패키징할 수 있습니다.

- **앱 본체:** `index.html` (단일 파일, 빌드 도구 불필요)
- **Firebase 프로젝트:** `lp-archive`

---

## 1. Firebase 설정 (필수 · 약 5분)

[Firebase 콘솔](https://console.firebase.google.com/u/0/project/lp-archive/overview)에서:

1. **Authentication → Sign-in method**: `이메일/비밀번호`와 `Google` 모두 사용 설정
2. **Firestore Database** 생성 → 규칙에 `firestore.rules` 내용 붙여넣기
3. **Storage** 생성 → 규칙에 `storage.rules` 내용 붙여넣기
4. **프로젝트 설정(톱니) → 일반 → 내 앱 → SDK 설정 및 구성**에서 아래 3개 값을 복사해
   `index.html` 안 `firebaseConfig`의 `PASTE_...` 부분에 넣기:
   - `apiKey`
   - `messagingSenderId`
   - `appId`

   > 도메인 항목(`authDomain`, `projectId`, `storageBucket`)은 `lp-archive` 기준으로 이미 채워져 있습니다.

5. 웹에서 띄울 도메인을 **Authentication → 설정 → 승인된 도메인**에 추가
   (`localhost`는 기본 포함. Firebase Hosting을 쓰면 `lp-archive.web.app`가 자동 등록됨)

> ⚠️ 파일을 더블클릭(`file://`)으로 열면 로그인이 동작하지 않습니다. 반드시 `localhost` 또는 https 주소에서 실행하세요.

---

## 2. 로컬 실행

```bash
# 아무 정적 서버나 가능 (예시)
npx serve .
# 또는 VS Code의 "Live Server" 확장 사용
```

---

## 3. Firebase Hosting 배포 (웹 + PWA 설치용 주소)

```bash
npm i -g firebase-tools
firebase login
firebase deploy            # firebase.json / .firebaserc 가 lp-archive 로 설정되어 있음
```

배포 후 주소: `https://lp-archive.web.app`
이 주소를 폰 크롬에서 열고 **"홈 화면에 추가"** 하면 앱처럼 설치됩니다.

규칙만 따로 올리려면:
```bash
firebase deploy --only firestore:rules,storage:rules
```

---

## 4. 모바일 앱(안드로이드/iOS) 빌드

앱은 웹 셸을 `www/` 로 **기기에 내장(번들)** 해 실행합니다(원격 웹 로드 아님).
데이터는 그대로 Firebase 로 동기화됩니다.

### ✅ 가장 빠른 방법 — 빌드된 디버그 APK 바로 받기

매 빌드마다 갱신되는 **고정 다운로드 링크**:

➡️ **<https://github.com/erosheir-byte/LP-Archive/releases/download/apk-latest/LP-Archive.apk>**

- 폰 브라우저로 위 링크를 열면 바로 받아집니다.
- 설치하려면 *설정 → "출처를 알 수 없는 앱 / 이 출처 허용"* 을 켜야 합니다.
- 앱 안에서도 **환경설정 → 📱 안드로이드 앱 다운로드(APK)** 로 같은 링크에 접근할 수 있습니다.
- GitHub Actions(`Build Android APK`)가 자동 빌드해 [`apk-latest` 릴리스](https://github.com/erosheir-byte/LP-Archive/releases/tag/apk-latest)에 올립니다.

> ⚠️ 이 APK 는 디버그 서명본이라 **스토어 업로드용은 아닙니다.**

### 로컬에서 빌드 (Android Studio / Xcode 필요)
```bash
npm install --legacy-peer-deps
npm run android     # www 번들 + cap sync + Android Studio 열기
npm run ios         # www 번들 + cap sync + Xcode 열기 (macOS)
```

### 🚀 스토어 정식 출시 (구글 플레이 / 애플 앱스토어)
서명된 AAB 빌드 워크플로와 단계별 절차는 **[RELEASE.md](RELEASE.md)** 를 참고하세요.
- 안드로이드 서명 AAB: Actions → **"Release Android (signed AAB)"**
- iOS 컴파일 검증: Actions → **"Build iOS (validate)"** (제출은 Xcode)

> 앱 셸(웹 코드)을 수정하면 재빌드·재업로드가 필요합니다(로컬 번들이므로).

---

## 5. 파일 구성

| 파일 | 설명 |
|---|---|
| `index.html` | 앱 전체 (HTML+CSS+JS, Firebase 연동 포함) |
| `manifest.webmanifest` | PWA 매니페스트 |
| `sw.js` | 서비스워커 (오프라인 앱 셸) |
| `icons/` | 앱 아이콘 (192/512/maskable/apple) |
| `firebase.json`, `.firebaserc` | Hosting/규칙 배포 설정 (프로젝트: lp-archive) |
| `firestore.rules`, `storage.rules` | 보안 규칙 (본인 데이터만 접근) |
| `privacy.html` | 개인정보처리방침 (스토어 필수) |
| `capacitor.config.json` | Capacitor(안드로이드/iOS) 설정 — 로컬 번들 |
| `scripts/prepare-www.mjs` | 웹 자산을 `www/`(앱 내장용)로 모으는 빌드 스크립트 |
| `RELEASE.md` | 구글 플레이 / 애플 앱스토어 출시 단계별 가이드 |

---

## 데이터 구조

```
users/{uid}/lps/{id}   ← LP 한 장 (artist, album, color, status, price,
                          rating, liked, genre, cover, discPhoto …)
```
첫 로그인 시 이 기기의 기존 기록(SEED + localStorage)이 계정으로 1회 자동 이전됩니다.
