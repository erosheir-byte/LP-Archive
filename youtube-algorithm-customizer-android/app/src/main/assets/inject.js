// FocusTube — m.youtube.com 주입 스크립트
// 모바일 유튜브 홈 피드를 선택한 주제의 검색 결과로 교체하고,
// Shorts / 추천 / 댓글 숨김 옵션을 적용한다.
// MainActivity가 페이지 로드 시 주입하며, 여러 번 주입돼도 안전하다(멱등).
(function () {
  "use strict";

  if (window.__ftcInstalled) {
    window.__ftcSync && window.__ftcSync();
    return;
  }
  window.__ftcInstalled = true;

  var CACHE_TTL_MS = 30 * 60 * 1000;
  var KEYWORDS_PER_REFRESH = 3;
  var MAX_VIDEOS = 24;

  var settings = readSettings();
  var renderToken = 0;
  var lastHref = "";

  function readSettings() {
    try {
      return JSON.parse(window.FocusTubeBridge.getSettings());
    } catch (e) {
      return {
        enabled: false, presetId: "study", presetName: "",
        keywords: [], hideShorts: true, hideRelated: false, hideComments: false
      };
    }
  }

  // ------------------------------------------------------------------- style

  var CSS = [
    "body.ftc-home.ftc-on ytm-browse { display: none !important; }",
    "#ftc-feed { display: none; padding: 12px 12px 48px; font-family: Roboto, 'Noto Sans KR', sans-serif; }",
    "body.ftc-home.ftc-on #ftc-feed { display: block; }",
    ".ftc-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 14px; }",
    ".ftc-heading { margin: 0 0 2px; font-size: 17px; font-weight: 700; }",
    ".ftc-note { margin: 0; font-size: 12px; opacity: .6; }",
    ".ftc-actions { display: flex; gap: 6px; flex-shrink: 0; }",
    ".ftc-btn { border: none; border-radius: 16px; padding: 7px 12px; font-size: 13px; background: rgba(128,128,128,.15); color: inherit; }",
    ".ftc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px 10px; }",
    ".ftc-status { grid-column: 1 / -1; padding: 40px 0; text-align: center; font-size: 14px; opacity: .6; }",
    ".ftc-card { display: block; text-decoration: none; color: inherit; }",
    ".ftc-thumb { position: relative; border-radius: 10px; overflow: hidden; aspect-ratio: 16/9; background: rgba(128,128,128,.15); }",
    ".ftc-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }",
    ".ftc-duration { position: absolute; right: 4px; bottom: 4px; padding: 1px 4px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font-size: 11px; }",
    ".ftc-title { margin-top: 7px; font-size: 13px; font-weight: 600; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }",
    ".ftc-channel, .ftc-sub { margin-top: 2px; font-size: 11px; opacity: .6; }",
    // Shorts 숨기기 (홈 셸프, 검색 결과, 하단 탭)
    "html.ftc-hide-shorts ytm-reel-shelf-renderer," ,
    "html.ftc-hide-shorts ytm-rich-section-renderer:has([class*='shorts'])," ,
    "html.ftc-hide-shorts ytm-pivot-bar-item-renderer:has([class*='shorts'])," ,
    "html.ftc-hide-shorts a[href^='/shorts'] { display: none !important; }",
    // 시청 페이지 아래 추천 영상 숨기기
    "html.ftc-hide-related ytm-watch ytm-item-section-renderer[section-identifier='related-items']," ,
    "html.ftc-hide-related ytm-watch ytm-single-column-watch-next-results-renderer ytm-item-section-renderer:not([section-identifier='comments-entry-point']):not(:first-of-type) { display: none !important; }",
    // 댓글 진입부 숨기기
    "html.ftc-hide-comments ytm-comment-section-renderer," ,
    "html.ftc-hide-comments ytm-item-section-renderer[section-identifier='comments-entry-point'] { display: none !important; }"
  ].join("\n");

  function installStyle() {
    if (document.getElementById("ftc-style")) return;
    var style = document.createElement("style");
    style.id = "ftc-style";
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function applyFlags() {
    var root = document.documentElement;
    root.classList.toggle("ftc-hide-shorts", !!settings.hideShorts);
    root.classList.toggle("ftc-hide-related", !!settings.hideRelated);
    root.classList.toggle("ftc-hide-comments", !!settings.hideComments);
    var home = location.pathname === "/";
    document.body.classList.toggle("ftc-home", home);
    document.body.classList.toggle(
      "ftc-on",
      !!settings.enabled && settings.keywords.length > 0
    );
  }

  // ------------------------------------------------------------------ search

  function pickKeywords(keywords) {
    var pool = keywords.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool.slice(0, KEYWORDS_PER_REFRESH);
  }

  function textOf(node) {
    if (!node) return "";
    if (node.simpleText) return node.simpleText;
    if (node.runs) return node.runs.map(function (r) { return r.text; }).join("");
    return "";
  }

  // ytInitialData 전체를 재귀 순회하며 영상 객체를 수집한다.
  // (videoRenderer / videoWithContextRenderer / compactVideoRenderer 등
  //  이름이 달라도 videoId + 제목 필드만 있으면 인식 → 구조 변경에 강함)
  function collectVideos(node, out, seen) {
    if (!node || typeof node !== "object" || out.length >= 200) return;
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) collectVideos(node[i], out, seen);
      return;
    }
    var title = textOf(node.headline) || textOf(node.title);
    if (node.videoId && title &&
        (node.thumbnail || node.lengthText || node.publishedTimeText)) {
      if (!seen[node.videoId]) {
        seen[node.videoId] = true;
        out.push({
          id: node.videoId,
          title: title,
          channel: textOf(node.shortBylineText) || textOf(node.ownerText) ||
                   textOf(node.longBylineText),
          duration: textOf(node.lengthText),
          views: textOf(node.shortViewCountText) || textOf(node.viewCountText),
          published: textOf(node.publishedTimeText)
        });
      }
      return;
    }
    for (var key in node) {
      if (key === "reelItemRenderer" || key === "reelShelfRenderer") continue; // Shorts 제외
      collectVideos(node[key], out, seen);
    }
  }

  function fetchSearchResults(query) {
    var url = location.origin + "/results?search_query=" + encodeURIComponent(query);
    return fetch(url, { credentials: "same-origin" })
      .then(function (res) { return res.ok ? res.text() : ""; })
      .then(function (html) {
        var marker = "var ytInitialData = ";
        var start = html.indexOf(marker);
        if (start === -1) return [];
        var jsonStart = start + marker.length;
        var end = html.indexOf(";</script>", jsonStart);
        if (end === -1) return [];
        var out = [];
        try {
          collectVideos(JSON.parse(html.slice(jsonStart, end)), out, {});
        } catch (e) { /* 구조 변경 시 빈 목록 */ }
        if (settings.hideShorts) {
          out = out.filter(function (v) { return v.duration; });
        }
        return out;
      })
      .catch(function () { return []; });
  }

  function interleave(lists) {
    var out = [], seen = {}, maxLen = 0, i, j;
    for (i = 0; i < lists.length; i++) maxLen = Math.max(maxLen, lists[i].length);
    for (i = 0; i < maxLen && out.length < MAX_VIDEOS; i++) {
      for (j = 0; j < lists.length && out.length < MAX_VIDEOS; j++) {
        var v = lists[j][i];
        if (v && !seen[v.id]) { seen[v.id] = true; out.push(v); }
      }
    }
    return out;
  }

  function cacheKey() {
    return "ftc:videos:" + settings.presetId + ":" + settings.keywords.join("|").length;
  }

  function readCache() {
    try {
      var raw = sessionStorage.getItem(cacheKey());
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (Date.now() - data.ts > CACHE_TTL_MS || !data.videos.length) return null;
      return data.videos;
    } catch (e) { return null; }
  }

  function writeCache(videos) {
    try {
      sessionStorage.setItem(cacheKey(), JSON.stringify({ ts: Date.now(), videos: videos }));
    } catch (e) { /* 캐시 실패는 무시 */ }
  }

  function loadVideos(force) {
    if (!force) {
      var cached = readCache();
      if (cached) return Promise.resolve(cached);
    }
    var picked = pickKeywords(settings.keywords);
    return Promise.all(picked.map(fetchSearchResults)).then(function (lists) {
      var videos = interleave(lists);
      if (videos.length) writeCache(videos);
      return videos;
    });
  }

  // ------------------------------------------------------------------ render

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function buildCard(video) {
    var link = el("a", "ftc-card");
    link.href = "/watch?v=" + video.id;

    var thumb = el("div", "ftc-thumb");
    var img = document.createElement("img");
    img.src = "https://i.ytimg.com/vi/" + video.id + "/mqdefault.jpg";
    img.loading = "lazy";
    img.alt = "";
    thumb.appendChild(img);
    if (video.duration) thumb.appendChild(el("span", "ftc-duration", video.duration));
    link.appendChild(thumb);

    link.appendChild(el("div", "ftc-title", video.title));
    if (video.channel) link.appendChild(el("div", "ftc-channel", video.channel));
    var sub = [video.views, video.published].filter(Boolean).join(" · ");
    if (sub) link.appendChild(el("div", "ftc-sub", sub));
    return link;
  }

  function ensureContainer() {
    var container = document.getElementById("ftc-feed");
    if (container) return container;

    container = el("div");
    container.id = "ftc-feed";

    var header = el("div", "ftc-header");
    var textBox = el("div");
    textBox.appendChild(el("h2", "ftc-heading", "🎯 " + settings.presetName + " 피드"));
    textBox.appendChild(el("p", "ftc-note", "이 피드의 영상을 시청할수록 알고리즘이 이 주제로 재학습됩니다."));
    header.appendChild(textBox);

    var actions = el("div", "ftc-actions");
    var refreshBtn = el("button", "ftc-btn", "🔄");
    refreshBtn.type = "button";
    refreshBtn.addEventListener("click", function () { render(true); });
    actions.appendChild(refreshBtn);
    var settingsBtn = el("button", "ftc-btn", "⚙️");
    settingsBtn.type = "button";
    settingsBtn.addEventListener("click", function () {
      window.FocusTubeBridge && window.FocusTubeBridge.openSettings();
    });
    actions.appendChild(settingsBtn);
    header.appendChild(actions);

    container.appendChild(header);
    container.appendChild(el("div", "ftc-grid"));

    // 기존 피드(ytm-browse)와 같은 위치에 끼워 넣는다.
    var browse = document.querySelector("ytm-browse");
    if (browse && browse.parentNode) {
      browse.parentNode.insertBefore(container, browse.nextSibling);
    } else {
      document.body.appendChild(container);
    }
    return container;
  }

  function render(force) {
    installStyle();
    applyFlags();

    if (location.pathname !== "/" || !settings.enabled || !settings.keywords.length) {
      return;
    }

    var token = ++renderToken;
    var container = ensureContainer();
    container.querySelector(".ftc-heading").textContent =
      "🎯 " + settings.presetName + " 피드";

    var grid = container.querySelector(".ftc-grid");
    grid.textContent = "";
    grid.appendChild(el("div", "ftc-status", "영상을 불러오는 중…"));

    loadVideos(force).then(function (videos) {
      if (token !== renderToken) return;
      grid.textContent = "";
      if (!videos.length) {
        grid.appendChild(el("div", "ftc-status",
          "영상을 불러오지 못했습니다. 🔄 버튼으로 다시 시도해 주세요."));
        return;
      }
      for (var i = 0; i < videos.length; i++) grid.appendChild(buildCard(videos[i]));
    });
  }

  // 설정 변경(네이티브 설정 화면에서 복귀) 시 호출된다.
  window.__ftcSync = function () {
    var before = JSON.stringify(settings);
    settings = readSettings();
    applyFlags();
    if (JSON.stringify(settings) !== before) render(false);
  };

  // 유튜브 모바일은 SPA라서 주소 변화를 주기적으로 감시한다.
  setInterval(function () {
    if (location.href !== lastHref) {
      lastHref = location.href;
      render(false);
    } else {
      applyFlags();
    }
  }, 600);

  render(false);
})();
