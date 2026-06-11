// FocusTube 콘텐츠 스크립트
// 유튜브 홈 피드를 선택한 주제의 검색 결과로 교체하고,
// Shorts / 사이드바 추천 / 댓글 숨김 옵션을 적용한다.
(() => {
  "use strict";

  const DEFAULTS = {
    enabled: true,
    presetId: "study",
    customKeywords: "",
    hideShorts: true,
    hideRelated: false,
    hideComments: false
  };

  const CACHE_TTL_MS = 30 * 60 * 1000; // 30분
  const KEYWORDS_PER_REFRESH = 3;
  const MAX_VIDEOS = 24;

  let settings = { ...DEFAULTS };
  let renderToken = 0;

  // ---------------------------------------------------------------- settings

  function activeKeywords() {
    if (settings.presetId === "custom") {
      return settings.customKeywords
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const preset = (window.FTC_PRESETS || []).find((p) => p.id === settings.presetId);
    return preset ? preset.keywords : [];
  }

  function presetName() {
    if (settings.presetId === "custom") return "사용자 정의";
    const preset = (window.FTC_PRESETS || []).find((p) => p.id === settings.presetId);
    return preset ? preset.name : "";
  }

  function applyFlags() {
    const root = document.documentElement;
    const replace = settings.enabled && activeKeywords().length > 0;
    root.classList.toggle("ftc-replace", replace);
    root.classList.toggle("ftc-hide-shorts", settings.hideShorts);
    root.classList.toggle("ftc-hide-related", settings.hideRelated);
    root.classList.toggle("ftc-hide-comments", settings.hideComments);
  }

  // ------------------------------------------------------------------ search

  function pickKeywords(keywords) {
    const pool = [...keywords];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, KEYWORDS_PER_REFRESH);
  }

  async function fetchSearchResults(query) {
    const url =
      "https://www.youtube.com/results?search_query=" + encodeURIComponent(query);
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) return [];
    const html = await res.text();
    const marker = "var ytInitialData = ";
    const start = html.indexOf(marker);
    if (start === -1) return [];
    const jsonStart = start + marker.length;
    const jsonEnd = html.indexOf(";</script>", jsonStart);
    if (jsonEnd === -1) return [];

    let data;
    try {
      data = JSON.parse(html.slice(jsonStart, jsonEnd));
    } catch {
      return [];
    }

    const videos = [];
    try {
      const sections =
        data.contents.twoColumnSearchResultsRenderer.primaryContents
          .sectionListRenderer.contents;
      for (const section of sections) {
        const items = section.itemSectionRenderer?.contents || [];
        for (const item of items) {
          const v = item.videoRenderer;
          if (!v || !v.videoId) continue;
          videos.push({
            id: v.videoId,
            title: (v.title?.runs || []).map((r) => r.text).join("") || "(제목 없음)",
            channel: v.ownerText?.runs?.[0]?.text || "",
            duration: v.lengthText?.simpleText || "",
            views: v.viewCountText?.simpleText || "",
            published: v.publishedTimeText?.simpleText || ""
          });
        }
      }
    } catch {
      // 유튜브 응답 구조가 바뀐 경우 - 빈 목록 반환
    }
    return videos;
  }

  function interleave(lists) {
    const out = [];
    const seen = new Set();
    const maxLen = Math.max(0, ...lists.map((l) => l.length));
    for (let i = 0; i < maxLen && out.length < MAX_VIDEOS; i++) {
      for (const list of lists) {
        const v = list[i];
        if (v && !seen.has(v.id)) {
          seen.add(v.id);
          out.push(v);
          if (out.length >= MAX_VIDEOS) break;
        }
      }
    }
    return out;
  }

  function cacheKey() {
    return "ftc:videos:" + settings.presetId;
  }

  function readCache() {
    try {
      const raw = sessionStorage.getItem(cacheKey());
      if (!raw) return null;
      const { ts, videos } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL_MS || !Array.isArray(videos) || !videos.length) {
        return null;
      }
      return videos;
    } catch {
      return null;
    }
  }

  function writeCache(videos) {
    try {
      sessionStorage.setItem(cacheKey(), JSON.stringify({ ts: Date.now(), videos }));
    } catch {
      // sessionStorage 사용 불가 시 캐시 생략
    }
  }

  async function loadVideos(force) {
    if (!force) {
      const cached = readCache();
      if (cached) return cached;
    }
    const keywords = pickKeywords(activeKeywords());
    const lists = await Promise.all(keywords.map(fetchSearchResults));
    const videos = interleave(lists);
    if (videos.length) writeCache(videos);
    return videos;
  }

  // ------------------------------------------------------------------ render

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function buildCard(video) {
    const link = el("a", "ftc-card");
    link.href = "/watch?v=" + video.id;

    const thumbWrap = el("div", "ftc-thumb");
    const img = document.createElement("img");
    img.src = "https://i.ytimg.com/vi/" + video.id + "/mqdefault.jpg";
    img.loading = "lazy";
    img.alt = "";
    thumbWrap.appendChild(img);
    if (video.duration) thumbWrap.appendChild(el("span", "ftc-duration", video.duration));
    link.appendChild(thumbWrap);

    const meta = el("div", "ftc-meta");
    meta.appendChild(el("div", "ftc-title", video.title));
    if (video.channel) meta.appendChild(el("div", "ftc-channel", video.channel));
    const sub = [video.views, video.published].filter(Boolean).join(" · ");
    if (sub) meta.appendChild(el("div", "ftc-sub", sub));
    link.appendChild(meta);

    return link;
  }

  function buildContainer() {
    const container = el("div");
    container.id = "ftc-feed";

    const header = el("div", "ftc-header");
    const titleBox = el("div", "ftc-header-text");
    titleBox.appendChild(el("h2", "ftc-heading", "🎯 " + presetName() + " 피드"));
    titleBox.appendChild(
      el(
        "p",
        "ftc-note",
        "이 피드의 영상을 시청할수록 유튜브 알고리즘이 이 주제로 재학습됩니다."
      )
    );
    header.appendChild(titleBox);

    const refreshBtn = el("button", "ftc-refresh", "🔄 새로고침");
    refreshBtn.type = "button";
    refreshBtn.addEventListener("click", () => renderFeed(true));
    header.appendChild(refreshBtn);

    container.appendChild(header);
    container.appendChild(el("div", "ftc-grid"));
    return container;
  }

  function isHomePage() {
    return location.hostname === "www.youtube.com" && location.pathname === "/";
  }

  function waitFor(selector, timeoutMs) {
    return new Promise((resolve) => {
      const found = document.querySelector(selector);
      if (found) return resolve(found);
      const observer = new MutationObserver(() => {
        const node = document.querySelector(selector);
        if (node) {
          observer.disconnect();
          clearTimeout(timer);
          resolve(node);
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      const timer = setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeoutMs);
    });
  }

  async function renderFeed(force) {
    const token = ++renderToken;
    applyFlags();

    const shouldReplace =
      settings.enabled && activeKeywords().length > 0 && isHomePage();
    const existing = document.getElementById("ftc-feed");
    if (!shouldReplace) {
      if (existing && !isHomePage()) {
        // 다른 페이지의 ytd-browse가 재사용될 수 있으므로 홈이 아니면 그대로 둔다.
      } else if (existing && !settings.enabled) {
        existing.remove();
      }
      return;
    }

    const browse = await waitFor('ytd-browse[page-subtype="home"]', 15000);
    if (token !== renderToken) return;
    if (!browse) return;

    let container = browse.querySelector("#ftc-feed");
    if (!container) {
      container = buildContainer();
      browse.prepend(container);
    } else {
      const heading = container.querySelector(".ftc-heading");
      if (heading) heading.textContent = "🎯 " + presetName() + " 피드";
    }

    const grid = container.querySelector(".ftc-grid");
    grid.textContent = "";
    grid.appendChild(el("div", "ftc-status", "영상을 불러오는 중…"));

    const videos = await loadVideos(force);
    if (token !== renderToken) return;

    grid.textContent = "";
    if (!videos.length) {
      grid.appendChild(
        el(
          "div",
          "ftc-status",
          "영상을 불러오지 못했습니다. 새로고침을 눌러 다시 시도해 주세요."
        )
      );
      return;
    }
    for (const video of videos) grid.appendChild(buildCard(video));
  }

  // ------------------------------------------------------------------- start

  function init() {
    chrome.storage.sync.get(DEFAULTS, (stored) => {
      settings = { ...DEFAULTS, ...stored };
      applyFlags();
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => renderFeed(false), {
          once: true
        });
      } else {
        renderFeed(false);
      }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;
      let presetChanged = false;
      for (const [key, { newValue }] of Object.entries(changes)) {
        if (key in settings) {
          if (key === "presetId" || key === "customKeywords") presetChanged = true;
          settings[key] = newValue;
        }
      }
      applyFlags();
      renderFeed(presetChanged);
    });

    // 유튜브는 SPA라 페이지 이동 시 전용 이벤트가 발생한다.
    window.addEventListener("yt-navigate-finish", () => renderFeed(false));
  }

  init();
})();
