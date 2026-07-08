# 스토어 출시 가이드 — My Vinyl (LP 보관함)

이 문서는 **구글 플레이**와 **애플 앱스토어**에 앱을 올리기 위한 단계별 안내입니다.
앱 코드/설정 준비(로컬 번들 전환, 서명 워크플로, 개인정보처리방침)는 저장소에 이미 되어 있고,
아래는 **계정·서명 키·심사처럼 직접 해야 하는 부분**입니다.

> 핵심 변경점: 앱은 더 이상 원격 웹(`lp-archive.web.app`)을 띄우는 "웹 래퍼"가 아니라,
> 웹 앱 셸을 `www/` 로 **기기에 내장(번들)** 해 실행합니다. 데이터만 Firebase 로 동기화됩니다.
> 이는 특히 **애플 심사(가이드라인 4.2 최소 기능)** 통과에 중요합니다.

---

## 0. 공통 준비물

| 항목 | 내용 |
|---|---|
| 개인정보처리방침 URL | `https://lp-archive.web.app/privacy.html` (배포 후 접속 가능 — `firebase deploy --only hosting`) |
| 앱 이름 | My Vinyl |
| 패키지/번들 ID | `app.lparchive.vinyl` |
| 스크린샷 | 폰 화면 캡처 (스토어별 규격, 아래 참고) |
| 지원 이메일 | 33to45rpm@gmail.com |

먼저 개인정보처리방침을 호스팅에 올리세요:
```bash
firebase deploy --only hosting
# 확인: https://lp-archive.web.app/privacy.html
```

---

## 1. 안드로이드 (구글 플레이)

### 1-1. 구글 플레이 콘솔 계정
- <https://play.google.com/console> 에서 개발자 등록 (**1회 $25**).

### 1-2. 릴리스 서명 키(keystore) 생성 — **딱 한 번, 안전하게 보관**
```bash
keytool -genkeypair -v \
  -keystore release.jks \
  -alias myvinyl \
  -keyalg RSA -keysize 2048 -validity 10000
# 비밀번호와 정보를 입력. release.jks 와 비밀번호는 절대 분실하면 안 됩니다.
# (분실 시 같은 앱으로 업데이트 불가)
```

### 1-3. 깃허브 시크릿 등록
저장소 → **Settings → Secrets and variables → Actions → New repository secret** 에 4개 등록:

| 시크릿 이름 | 값 |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 release.jks` 출력 (맥은 `base64 -i release.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 비밀번호 |
| `ANDROID_KEY_ALIAS` | `myvinyl` (위에서 정한 alias) |
| `ANDROID_KEY_PASSWORD` | 키 비밀번호 |

### 1-4. 서명된 AAB 빌드
GitHub → **Actions → "Release Android (signed AAB)" → Run workflow**
→ `versionName`(예: 1.0.0), `versionCode`(예: 1) 입력 → 실행.
완료되면 아티팩트 `my-vinyl-release-aab` 에서 `.aab` 파일을 받습니다.
> `versionCode` 는 업로드할 때마다 **반드시 1 이상 증가**해야 합니다.

### 1-5. Firebase 에 릴리스 키 SHA-1 등록 (구글 로그인용)
릴리스 키로 서명하면 SHA-1 이 디버그와 다릅니다. 구글 로그인이 동작하려면:
```bash
keytool -list -v -keystore release.jks -alias myvinyl
# SHA1 값을 복사
```
Firebase 콘솔 → 프로젝트 설정 → 내 앱(안드로이드 `app.lparchive.vinyl`) → **지문 추가** 에 SHA-1 등록.
> 구글 플레이 "앱 서명(Play App Signing)"을 사용하면 플레이가 재서명하므로,
> **플레이 콘솔 → 앱 무결성 → 앱 서명** 에 표시되는 SHA-1 도 Firebase 에 추가하세요.

### 1-6. 플레이 콘솔 등록
1. 앱 만들기 → 이름/언어/무료 설정
2. **AAB 업로드** (1-4 결과물) — 프로덕션 또는 비공개 테스트 트랙
3. **앱 콘텐츠** 작성:
   - 개인정보처리방침 URL: `https://lp-archive.web.app/privacy.html`
   - **데이터 보안(Data safety)**: 이메일·사용자 콘텐츠(사진) 수집, 카메라 사용, 데이터 암호화 전송, 삭제 요청 가능 — privacy.html 내용대로 신고
   - 광고 없음, 타겟 연령
4. 스토어 등록정보: 짧은/긴 설명, 아이콘(512), 그래픽 이미지(1024×500), **폰 스크린샷 2장 이상**
5. 심사 제출

---

## 2. iOS (애플 앱스토어)  — macOS + Xcode 필요

> iOS 빌드·제출은 **맥에서만** 가능합니다. 맥이 없으면 Codemagic/Xcode Cloud 같은 맥 CI 를 사용하세요.
> 저장소의 `Build iOS (validate)` 워크플로는 컴파일 검증용이며, 제출용 서명 IPA 는 아래 절차로 만듭니다.

### 2-1. 애플 개발자 계정
- <https://developer.apple.com/programs/> 등록 (**$99/년**).

### 2-2. App Store Connect 에 앱 등록
- <https://appstoreconnect.apple.com> → 새 앱 → 번들 ID `app.lparchive.vinyl` (Identifiers 에서 먼저 생성).

### 2-3. Firebase iOS 앱 추가
- Firebase 콘솔 → 앱 추가 → iOS, 번들 ID `app.lparchive.vinyl`
- `GoogleService-Info.plist` 다운로드 → `ios/App/App/` 에 추가 (Xcode 에서 타깃에 포함)
- 구글 로그인용 **URL Scheme**(plist 의 `REVERSED_CLIENT_ID`)을 `Info.plist` 의 URL Types 에 추가

### 2-4. 로컬에서 iOS 프로젝트 생성·열기
```bash
npm install --legacy-peer-deps
npm run ios          # = prepare:www + cap sync ios + cap open ios (Xcode 열림)
```

### 2-5. Xcode 설정
- **Signing & Capabilities**: 본인 팀 선택, 자동 서명 켜기
- 카메라 사용 설명 추가 — `Info.plist` 에
  `NSCameraUsageDescription` = "바코드 스캔으로 바이닐을 등록하기 위해 카메라를 사용합니다."
- 버전/빌드 번호 설정

### 2-6. 빌드 & 업로드
- Xcode → **Product → Archive** → Organizer → **Distribute App → App Store Connect** 로 업로드
- (또는 `fastlane`/Transporter 사용)

### 2-7. App Store Connect 심사 제출
- **앱 개인정보(App Privacy)**: privacy.html 기준으로 수집 데이터 신고
  (이메일/이름, 사용자 콘텐츠, 카메라; 광고·추적 없음)
- 개인정보처리방침 URL: `https://lp-archive.web.app/privacy.html`
- **스크린샷**: 6.7" 및 6.5" iPhone 규격 필수 (각 1장 이상)
- 설명·키워드·카테고리·연령등급
- 심사 제출

> ⚠️ 애플 심사 팁: 이 앱은 **카메라 바코드 스캔·네이티브 구글 로그인** 같은 기기 기능을 쓰는
> 실 기능 앱입니다. 심사노트에 테스트 계정과 "바코드 스캔으로 LP 등록" 흐름을 설명하면 통과가 수월합니다.

---

## 3. 출시 후 업데이트
- 안드로이드: `versionCode` 를 올려 "Release Android" 워크플로 재실행 → 새 AAB 업로드
- iOS: 빌드 번호를 올려 Xcode 에서 다시 Archive → 업로드
- 앱 셸을 바꾸면(웹 코드 수정) **재빌드·재업로드**가 필요합니다 (로컬 번들이므로).
  데이터/백엔드 동작은 Firebase 쪽 변경만으로 즉시 반영됩니다.
