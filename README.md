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

## 4. APK 만들기

APK는 컴파일에 Android SDK가 필요하므로 두 가지 방법 중 택1 하세요.

### 방법 A — PWABuilder (도구 설치 없이 가장 간단, 권장)
1. 위 3번으로 Hosting 배포 (`https://lp-archive.web.app`)
2. <https://www.pwabuilder.com> 접속 → 그 주소 입력
3. **Android → Generate Package** → APK/AAB 다운로드
4. 다운로드한 zip 안의 안내대로 서명하면 설치/업로드 가능

### 방법 B — Capacitor (내 PC에 Android Studio 필요, 더 네이티브)
사전 준비: Node.js, Android Studio(+SDK), JDK 17

```bash
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init "LP 보관함" "app.lparchive.vinyl" --web-dir .
npx cap add android
npx cap sync
npx cap open android        # Android Studio가 열리면 Build > Build APK
```

> `capacitor.config.json` 은 이미 포함되어 있습니다.
> Capacitor로 빌드할 경우 Firebase **승인된 도메인**에 `localhost` 가 있으면 됩니다(앱 내 WebView는 https 스킴 사용).

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
| `capacitor.config.json` | APK(방법 B)용 설정 |

---

## 데이터 구조

```
users/{uid}/lps/{id}   ← LP 한 장 (artist, album, color, status, price,
                          rating, liked, genre, cover, discPhoto …)
```
첫 로그인 시 이 기기의 기존 기록(SEED + localStorage)이 계정으로 1회 자동 이전됩니다.
