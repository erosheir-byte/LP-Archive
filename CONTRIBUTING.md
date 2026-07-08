# 함께 개발하기 (협업 가이드)

이 저장소는 여러 사람이 각자 **Claude(클로드)** 를 붙여 동시에 개발합니다.
앱 전체가 사실상 **`index.html` 단일 파일** 안에 들어 있어, 규칙 없이 동시에 고치면
병합 충돌이 잦습니다. 아래 규칙만 지키면 충돌은 거의 나지 않습니다.

---

## 🌳 기본 흐름: 브랜치 → PR → main 병합

```
main  (항상 최신·안정. 여기에 직접 푸시 금지)
 ├── 내 작업 브랜치     → Pull Request → 리뷰/CI → main 병합
 └── 친구 작업 브랜치   → Pull Request → 리뷰/CI → main 병합
```

- **`main` 에 직접 푸시하지 않습니다.** 모든 변경은 브랜치에서 → PR 로 병합.
- 브랜치 이름 예시: `feat/통계화면`, `fix/로그인버그`, Claude 세션은 `claude/...` 자동 사용.

---

## 🔑 충돌을 막는 5가지 규칙

### 1. 시작 전 항상 최신 `main` 에서 분기
```bash
git checkout main
git pull origin main          # 친구가 병합한 최신 내용 받기
git checkout -b feat/새기능     # 여기서 새 작업 시작
```

### 2. 작업은 잘게, 자주 병합
한 브랜치를 며칠씩 끌지 마세요. **한 기능 = 한 브랜치 = 가능하면 하루 안에 PR·병합.**
오래 묵힐수록 `index.html` 이 서로 멀어져 충돌이 커집니다.

### 3. "누가 어느 영역을 건드릴지" 미리 나누기
같은 시간에 둘 다 `index.html` 의 **같은 화면/기능**을 고치면 충돌합니다.
작업 전에 "오늘 나는 로그인, 너는 통계" 처럼 **영역을 분담**하세요. (PR 템플릿의 "건드린 영역" 참고)

### 4. 세션 하나 = 브랜치 하나
내 Claude 세션과 친구 Claude 세션이 **같은 브랜치에 동시에 푸시하지 않도록** 합니다.

### 5. PR 은 빨리 리뷰하고 빨리 병합
열린 PR 이 쌓일수록 서로 충돌합니다. 올라온 PR 은 바로 확인·병합하세요.

---

## 🛠️ 충돌이 났을 때 해결법

PR 에 "이 브랜치는 병합 충돌이 있습니다" 가 뜨면:

```bash
git checkout <내브랜치>
git fetch origin
git rebase origin/main        # 최신 main 위로 내 작업을 다시 얹음
# index.html 에 <<<<<<< ======= >>>>>>> 충돌 표시가 나타남
```

> 💡 **이때 Claude 에게 "충돌 해결해줘" 라고 하면** 양쪽 변경을 함께 보고 안전하게 합쳐줍니다.
> 손으로 지우는 것보다 실수가 적습니다.

해결 후:
```bash
git add index.html
git rebase --continue
git push --force-with-lease origin <내브랜치>   # --force-with-lease: 친구 작업을 실수로 덮어쓰지 않음
```

> ⚠️ 그냥 `--force` 는 쓰지 마세요. 반드시 `--force-with-lease` 를 사용합니다.

---

## 🔒 (관리자 1회) main 브랜치 보호 설정

실수로 `main` 에 직접 푸시하거나 리뷰 없이 병합되는 걸 막습니다.
저장소 소유자가 **한 번만** 설정하면 됩니다:

1. GitHub 저장소 → **Settings → Branches → Add branch ruleset** (또는 *Add rule*)
2. 대상 브랜치: `main`
3. 체크할 항목:
   - ✅ **Require a pull request before merging** (PR 없이 병합 금지)
   - ✅ **Require status checks to pass** → `Build Android APK` 선택 (CI 통과해야 병합)
   - ✅ **Do not allow bypassing the above settings** (관리자도 규칙 적용 — 선택)
4. Save

> 둘이서 개발한다면 "Require approvals"(리뷰 승인 수)는 0~1 로 두는 게 편합니다.
> 1 로 하면 상대방 승인 없이는 병합이 안 되므로, 서로 바쁠 땐 0 이 현실적입니다.

---

## 📁 파일 구조 메모

앱 본체는 `index.html` 하나입니다(HTML+CSS+JS 통합). 충돌이 계속 잦아지면
장기적으로 파일 분리를 고려할 수 있으나, 그건 별도의 큰 작업입니다.
