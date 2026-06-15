// FocusTube 설정 팝업
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

  const $ = (id) => document.getElementById(id);

  function save(partial) {
    chrome.storage.sync.set(partial);
  }

  function buildPresetList(selectedId) {
    const list = $("preset-list");
    list.textContent = "";

    const options = [
      ...window.FTC_PRESETS,
      { id: "custom", name: "사용자 정의", description: "원하는 검색 키워드 직접 입력" }
    ];

    for (const preset of options) {
      const label = document.createElement("label");
      label.className = "preset";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "preset";
      radio.value = preset.id;
      radio.checked = preset.id === selectedId;
      radio.addEventListener("change", () => {
        save({ presetId: preset.id });
        $("custom-keywords").classList.toggle("hidden", preset.id !== "custom");
      });
      label.appendChild(radio);

      const text = document.createElement("span");
      const name = document.createElement("strong");
      name.textContent = preset.name;
      text.appendChild(name);
      const desc = document.createElement("small");
      desc.textContent = preset.description;
      text.appendChild(desc);
      label.appendChild(text);

      list.appendChild(label);
    }
  }

  chrome.storage.sync.get(DEFAULTS, (settings) => {
    $("enabled").checked = settings.enabled;
    $("hideShorts").checked = settings.hideShorts;
    $("hideRelated").checked = settings.hideRelated;
    $("hideComments").checked = settings.hideComments;

    buildPresetList(settings.presetId);

    const customBox = $("custom-keywords");
    customBox.value = settings.customKeywords;
    customBox.classList.toggle("hidden", settings.presetId !== "custom");

    $("enabled").addEventListener("change", (e) => save({ enabled: e.target.checked }));
    $("hideShorts").addEventListener("change", (e) => save({ hideShorts: e.target.checked }));
    $("hideRelated").addEventListener("change", (e) => save({ hideRelated: e.target.checked }));
    $("hideComments").addEventListener("change", (e) => save({ hideComments: e.target.checked }));

    let debounce;
    customBox.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => save({ customKeywords: customBox.value }), 400);
    });
  });
})();
