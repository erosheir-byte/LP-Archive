// www/ 로컬 번들 빌드 스크립트
//
// Capacitor 가 네이티브 앱에 내장(bundle)할 웹 자산을 www/ 로 모읍니다.
// 앱은 원격(lp-archive.web.app)을 로드하지 않고 이 www/ 안의 파일을
// 자기 자신에 포함해 실행합니다. (앱스토어/플레이 심사 친화적 = "웹 래퍼" 아님)
//
// 동적 데이터(Firebase 인증·Firestore·Storage)는 그대로 온라인으로 동작하고,
// 앱 셸(UI/로직)만 로컬에 번들됩니다.
//
// 사용: node scripts/prepare-www.mjs

import { existsSync, mkdirSync, copyFileSync, rmSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const www = join(root, "www");

// 깨끗하게 다시 만든다
if (existsSync(www)) rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

// 루트 단일 파일들
const files = ["index.html", "manifest.webmanifest", "sw.js", "privacy.html", "terms.html"];
for (const f of files) {
  const src = join(root, f);
  if (existsSync(src)) {
    copyFileSync(src, join(www, f));
    console.log("copied", f);
  } else {
    console.log("skip (없음)", f);
  }
}

// 아이콘 폴더 통째로
const icons = join(root, "icons");
if (existsSync(icons)) {
  cpSync(icons, join(www, "icons"), { recursive: true });
  console.log("copied icons/");
}

console.log("www/ 번들 준비 완료 →", www);
