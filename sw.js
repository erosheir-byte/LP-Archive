/* Turnit 서비스워커
   - 앱 셸(아이콘/매니페스트)은 캐시 우선으로 빠르게
   - 화면(HTML/네비게이션)은 네트워크 우선 → 웹 배포 시 항상 최신 버전 표시
   - Firebase/gstatic 등 외부(cross-origin) 요청은 가로채지 않음 */
const CACHE = 'lp-archive-v2';   // 아이콘·워드마크 교체 → 캐시 갱신
const SHELL = [
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-180.png',
  './icons/wordmark.png',
  './icons/wordmark-dark.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 같은 출처만 처리 (Firebase, gstatic, 외부 앨범아트 등은 통과)
  if (url.origin !== self.location.origin) return;

  // 화면 진입(네비게이션) 또는 HTML 문서: 네트워크 우선
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // 그 외 정적 자원: 캐시 우선, 없으면 네트워크 후 캐싱
  e.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached)
    )
  );
});
