# 스토어 등록정보 — Turnit

구글 플레이 콘솔 "스토어 등록정보"와 App Store Connect 에 그대로 붙여넣을 수 있는 문구·이미지입니다.
서명 키·빌드·심사 절차는 `RELEASE.md` 를 보세요.

> 용어: 앱 안에서는 **바이닐**로 통일했습니다(LP 대신). 스토어 문구도 같은 표현을 씁니다.
> 검색 노출을 위해 키워드·태그에는 "LP"도 함께 넣었습니다.

---

## 1. 이미지 (저장소 `store-assets/`)

| 용도 | 파일 | 규격 |
|---|---|---|
| 앱 아이콘 | `icons/icon-512.png` | 512×512 |
| 플레이 그래픽 이미지(피처) | `store-assets/play/feature-ko.jpg` · `feature-en.jpg` | 1024×500 |
| 플레이 폰 스크린샷 | `store-assets/play/ko-1~6.jpg` · `en-1~6.jpg` | 1080×1920 (9:16) |
| 앱스토어 6.7" 스크린샷 | `store-assets/app-store/ko-1~6.jpg` · `en-1~6.jpg` | 1290×2796 |

스크린샷 순서와 문구(한국어 / 영어):

1. 모아온 **바이닐**을 한눈에 — Your **vinyl**, all in one place (보관함)
2. 검색 한 번이면 **커버와 노래**까지 — One search finds the **cover & songs** (등록: 이 앨범이 맞나요?)
3. **판 색깔**까지 내 판 그대로 — Right down to your **disc color** (등록: 판 컬러·투명도·RPM·인치)
4. 판을 넘기며 **미리듣기** — Flip through and **hear** every record (바이닐 보기)
5. 사고, 듣고, **달력**에 남기고 — Every buy and spin on your **calendar** (달력)
6. 내 **취향**을 숫자로 돌아보기 — See your **taste** in numbers (통계)

- 스크린샷 속 앨범은 모두 **가상의 앨범과 직접 그린 커버**입니다(실제 앨범 아트 저작권 문제 방지).
- 다시 만들 때는 같은 데모 데이터로 앱을 띄워 캡처한 뒤 문구를 얹었습니다. 화면이 바뀌면 다시 만들어 주세요.
- 앱스토어는 6.7" 규격 한 벌이면 다른 아이폰 크기에도 자동으로 쓰입니다.

---

## 2. 한국어 등록정보

### 앱 이름 (30자)
```
Turnit — 내 바이닐 보관함
```

### 짧은 설명 (플레이, 80자)
```
앨범을 검색하면 커버와 노래까지. 내 바이닐을 기록하고, 돌려 듣고, 돌아보세요.
```

### 부제 (앱스토어, 30자)
```
판을 돌리는 내 바이닐 보관함
```

### 키워드 (앱스토어, 100자, 쉼표 구분)
```
바이닐,LP,레코드,턴테이블,음반,컬렉션,앨범,수집,레코드판,LP판,미리듣기,바코드,음악기록
```

### 긴 설명 (4000자)
```
🎵 Turnit — 판을 돌리는 내 바이닐 보관함

모아온 바이닐을 한 곳에 예쁘게 정리하고, 돌려 듣고, 돌아보세요.

■ 검색 한 번이면 끝나는 등록
• 앨범을 검색하거나 뒷면 바코드를 찍으면 커버와 노래를 자동으로 찾아줘요
• 큰 자켓을 보며 한 단계씩: 앨범 → 판 → 상태 → 구매 정보
• 판 컬러·투명도는 물론 판 사진까지, 12·10·7인치와 33⅓·45 RPM도 기록
• 등록하는 동안 그 앨범 노래가 흘러요
• 원하는 커버가 없으면 사진으로 직접 등록

■ 판을 돌리듯 감상
• 커버를 탭하면 판이 돌며 30초 미리듣기
• 바이닐을 손가락으로 돌리면 다음 곡·이전 곡
• 자켓 대신 컬러 바이닐로 보는 '바이닐 보기'
• 한국 앨범은 곡 제목도 한국어로

■ 기록하고 돌아보기
• 달력: 구매·도착·개봉·청음 기록을 날짜별 커버로
• 통계: 별점, 자주 간 구매처, 장르, 가장 많이 들은 앨범
• 이 달의 기록·취향 카드를 이미지로 만들어 공유
• 미개봉·개봉·배송 전·위시·판매/교환까지 상태별 관리
• 같은 앨범을 또 샀다면 정보 그대로 '같은 앨범 추가'

■ 함께 즐기기
• 테마별 컬렉션을 만들고 링크·카카오톡으로 공유
• 좋아요한 앨범 모아 공유하기

■ 편리하게
• 이메일·구글 로그인으로 기기가 바뀌어도 그대로 (클라우드 동기화)
• Discogs 컬렉션·엑셀(CSV)로 한 번에 가져오기
• 한국어/영어, 다크/라이트 테마

■ 이런 분께
• 바이닐을 모으고 기록하는 걸 좋아하는 분
• 같은 판을 또 사는 실수를 줄이고 싶은 분
• 내 컬렉션을 친구에게 자랑하고 싶은 분

데이터는 본인 계정에만 저장되며, 언제든 설정 → 회원 탈퇴에서 계정과 모든 데이터를 삭제할 수 있습니다.
무료 앱이며 화면 하단 배너와 가끔 전면 광고가 표시됩니다(짧은 광고를 보면 하루 동안 광고 끄기 가능).
개인정보처리방침: https://lp-archive.web.app/privacy.html
```

### 이번 버전 새 기능 (첫 출시용)
```
Turnit 첫 버전이에요 🎉
• 검색·바코드로 커버와 노래를 찾아주는 단계형 등록
• 판 컬러·사진·RPM·인치까지 내 판 그대로 기록
• 30초 미리듣기, 달력, 통계, 컬렉션 공유
```

---

## 3. English listing

### App name (30)
```
Turnit — My Vinyl Shelf
```

### Short description (Play, 80)
```
Search an album to get its cover and songs. Log, spin and revisit your vinyl.
```

### Subtitle (App Store, 30)
```
Your vinyl, ready to spin
```

### Keywords (App Store, 100)
```
vinyl,record,LP,turntable,collection,album,collector,barcode,music log,crate,records
```

### Full description (4000)
```
🎵 Turnit — your vinyl collection, ready to spin

Keep every record you own in one beautiful place, give it a spin, and look back on what you've collected.

■ Add a record in seconds
• Search an album or scan the barcode on the back — Turnit finds the cover and the songs
• One step at a time with a big jacket in view: album → disc → condition → purchase
• Log the disc color and opacity, even a photo of the disc, plus 12"/10"/7" and 33⅓/45 RPM
• The album plays while you add it
• No matching cover? Use your own photo

■ Listen like you're spinning it
• Tap a cover and the disc turns with a 30-second preview
• Spin the record with your finger for the next or previous track
• Vinyl view shows your colored discs instead of jackets

■ Log it and look back
• Calendar: purchases, arrivals, openings and listens shown as covers by date
• Stats: ratings, favorite stores, genres and most-played albums
• Turn your month or your taste into a shareable card
• Track sealed, opened, on the way, wishlist and sold/traded records
• Bought another copy? "Add the same album" copies everything over

■ Share with friends
• Build themed collections and share them by link
• Share the albums you like

■ Made easy
• Sign in with email or Google — your shelf syncs across devices
• Import a Discogs collection or a spreadsheet (CSV) in one go
• Korean/English, dark/light themes

Your data is stored only in your account, and you can delete your account and all data anytime in Settings → Delete account.
Turnit is free and shows a banner at the bottom and occasional full-screen ads (watch a short ad to turn ads off for a day).
Privacy policy: https://lp-archive.web.app/privacy.html
```

### What's new (first release)
```
Welcome to Turnit 🎉
• Step-by-step adding with search and barcode
• Log your disc's color, photo, RPM and size
• 30-second previews, calendar, stats and shareable collections
```

---

## 4. 분류·연락처

| 항목 | 값 |
|---|---|
| 카테고리 | 플레이: 음악 및 오디오 / 앱스토어: 음악 (보조: 라이프스타일) |
| 콘텐츠 등급 | 전체 이용가 (설문: 폭력·성적 내용·도박 없음, 사용자 간 공유는 링크 공유만) |
| 광고 포함 | 예 (Google AdMob) |
| 지원 이메일 | 33to45rpm@gmail.com |
| 개인정보처리방침 URL | https://lp-archive.web.app/privacy.html |

## 5. 데이터 보안(Data safety) 신고 요약
- **수집·전송 데이터**: 이메일 주소, 이름(구글 로그인), 사용자 콘텐츠(앨범/판/주문내역 사진), 앱 활동(컬렉션 기록)
- **목적**: 앱 기능(계정·동기화·메타데이터 조회·주문내역 텍스트 추출), 광고
- **전송 중 암호화**: 예 (HTTPS)
- **삭제 요청 가능**: 예 — 인앱 '회원 탈퇴' + 이메일 요청
- **카메라**: 기기 내 바코드 스캔·사진 등록용
- **광고/추적 식별자**: 사용함 — Google AdMob 광고 게재에 광고 ID 사용

## 6. 앱 액세스(App access) — 심사용 데모 계정
로그인이 필요한 앱이므로 리뷰어용 테스트 계정을 등록하세요. 바이닐이 몇 장 들어 있는 계정이면 심사가 수월합니다.
```
이메일: (테스트용 계정 생성 후 입력)
비밀번호: (해당 비밀번호)
안내: 로그인 후 왼쪽 위 + 버튼으로 바이닐 등록(앨범 검색 → 자켓 → 판 → 상태 → 구매) /
      보관함에서 커버를 탭하면 30초 미리듣기 / 설정 → 회원 탈퇴에서 계정 삭제 확인 가능
```

## 7. 출시 전 체크리스트
- [x] 서명된 AAB 빌드 워크플로 (Actions → Release Android) — 동작 확인됨
- [x] 개인정보처리방침 페이지, 인앱 회원 탈퇴
- [x] 스토어 문구(한/영)·스크린샷·그래픽 이미지 — 이 문서와 `store-assets/`
- [ ] 플레이 콘솔: 앱 만들기 → 스토어 등록정보 입력 → 앱 콘텐츠(데이터 보안·광고·등급·타겟 연령) 작성
- [ ] 심사용 테스트 계정 만들기(바이닐 몇 장 등록해 두기)
- [ ] `versionCode` 올려 AAB 빌드 → 비공개 테스트(최소 12명·14일, 개인 개발자 계정 조건) → 프로덕션 신청
- [ ] Firebase 에 플레이 앱 서명 SHA-1 추가(구글 로그인용, `RELEASE.md` 1-5)
- [ ] (iOS) 맥에서 빌드·제출 — `RELEASE.md` 2장
