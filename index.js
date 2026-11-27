(() => {
    const STORAGE_KEY = "st_text_color_settings_v1";
    const STYLE_ID = "st-text-color-dynamic-style";
    const PANEL_ID = "st-tc-panel";
    const NAV_BTN_ID = "st-tc-nav-btn";

    const PRESETS = {
        darkBg: {
            body: "#f2f2f7",
            quote: "#ffd68a",
            strong: "#ff9e9e",
            italic: "#b8c7d9",
            name: "#ffffff",
            shadow: true,
            shadowType: "dark"
        },
        lightBg: {
            body: "#1f2329",
            quote: "#8c3b2b",
            strong: "#b32424",
            italic: "#525c6a",
            name: "#111318",
            shadow: true,
            shadowType: "light"
        }
    };

    const defaultSettings = {
        enabled: true,
        ...PRESETS.darkBg
    };

    const COLOR_ITEMS = [
        { key: "body", label: "正文字色", sub: "普通叙述文本" },
        { key: "quote", label: "角色说话", sub: "引号内对话" },
        { key: "strong", label: "重点粗体", sub: "**加粗文字**" },
        { key: "italic", label: "动作 / 心理", sub: "*斜体文字*" },
        { key: "name", label: "角色名称", sub: "消息顶部名字" }
    ];

    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...defaultSettings };
            return { ...defaultSettings, ...JSON.parse(raw) };
        } catch (e) {
            return { ...defaultSettings };
        }
    }

    function saveSettings(s) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        } catch (e) {}
    }

    let settings = loadSettings();

    /* =========================================
       实时注入字色 CSS
       ========================================= */
    function applyTextColors() {
        let styleEl = document.getElementById(STYLE_ID);
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = STYLE_ID;
            (document.head || document.documentElement).appendChild(styleEl);
        }

        if (!settings.enabled) {
            styleEl.textContent = "";
            return;
        }

        const shadowCss = settings.shadow
            ? (settings.shadowType === "light"
                ? "text-shadow: 0 1px 3px rgba(255, 255, 255, 0.85) !important;"
                : "text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85) !important;")
            : "text-shadow: none !important;";

        styleEl.textContent = `
            #chat .mes .mes_text,
            #chat .mes .mes_text p {
                color: ${settings.body} !important;
                ${shadowCss}
            }
            #chat .mes .mes_text q {
                color: ${settings.quote} !important;
                ${shadowCss}
            }
            #chat .mes .mes_text strong,
            #chat .mes .mes_text b {
                color: ${settings.strong} !important;
                ${shadowCss}
            }
            #chat .mes .mes_text em,
            #chat .mes .mes_text i {
                color: ${settings.italic} !important;
                ${shadowCss}
            }
            #chat .mes .name_text {
                color: ${settings.name} !important;
                ${shadowCss}
            }
        `;
    }

    /* =========================================
       构建色盘浮窗与上方导航栏按钮
       ========================================= */
    function initPanel() {
        if (!document.body || document.getElementById(PANEL_ID)) return;

        const rowsHtml = COLOR_ITEMS.map(item => `
            <div class="st-tc-row">
                <div class="st-tc-label">
                    <span>${item.label}</span>
                    <span class="st-tc-sub">${item.sub}</span>
                </div>
                <div class="st-tc-picker-wrap">
                    <input type="text" class="st-tc-hex" data-key="${item.key}" value="${settings[item.key]}" maxlength="7" />
                    <input type="color" class="st-tc-color" data-key="${item.key}" value="${settings[item.key]}" />
                </div>
            </div>
        `).join("");

        const panel = document.createElement("div");
        panel.id = PANEL_ID;
        panel.innerHTML = `
            <div class="st-tc-header">
                <span class="st-tc-title">自定义字色</span>
                <div class="st-tc-header-actions">
                    <button type="button" id="st-tc-toggle" class="st-tc-btn ${settings.enabled ? "st-tc-on" : ""}">
                        ${settings.enabled ? "已开启" : "已关闭"}
                    </button>
                    <button type="button" id="st-tc-close" class="st-tc-btn st-tc-close">×</button>
                </div>
            </div>
            <div class="st-tc-body">
                <div class="st-tc-presets">
                    <button type="button" id="st-tc-preset-dark" class="st-tc-btn">深色背景·浅字</button>
                    <button type="button" id="st-tc-preset-light" class="st-tc-btn">浅色背景·深字</button>
                    <button type="button" id="st-tc-reset" class="st-tc-btn">重置</button>
                </div>
                ${rowsHtml}
                <label class="st-tc-switch-row">
                    <span>文字微阴影（全透背景防看不清）</span>
                    <input type="checkbox" id="st-tc-shadow" ${settings.shadow ? "checked" : ""} />
                </label>
            </div>
        `;
        document.body.appendChild(panel);

        const toggleBtn = document.getElementById("st-tc-toggle");
        const closeBtn = document.getElementById("st-tc-close");
        const shadowInput = document.getElementById("st-tc-shadow");

        function syncInputsFromSettings() {
            toggleBtn.textContent = settings.enabled ? "已开启" : "已关闭";
            toggleBtn.classList.toggle("st-tc-on", settings.enabled);
            shadowInput.checked = Boolean(settings.shadow);

            COLOR_ITEMS.forEach(item => {
                const hexEl = panel.querySelector(`.st-tc-hex[data-key="${item.key}"]`);
                const colEl = panel.querySelector(`.st-tc-color[data-key="${item.key}"]`);
                if (hexEl) hexEl.value = settings[item.key];
                if (colEl) colEl.value = settings[item.key];
            });
        }

        toggleBtn.addEventListener("click", () => {
            settings.enabled = !settings.enabled;
            saveSettings(settings);
            applyTextColors();
            syncInputsFromSettings();
        });

        closeBtn.addEventListener("click", () => {
            panel.classList.remove("st-tc-open");
            const navBtn = document.getElementById(NAV_BTN_ID);
            if (navBtn) navBtn.classList.remove("st-tc-active");
        });

        document.getElementById("st-tc-preset-dark").addEventListener("click", () => {
            settings = { ...settings, enabled: true, ...PRESETS.darkBg };
            saveSettings(settings);
            applyTextColors();
            syncInputsFromSettings();
        });

        document.getElementById("st-tc-preset-light").addEventListener("click", () => {
            settings = { ...settings, enabled: true, ...PRESETS.lightBg };
            saveSettings(settings);
            applyTextColors();
            syncInputsFromSettings();
        });

        document.getElementById("st-tc-reset").addEventListener("click", () => {
            settings = { ...defaultSettings };
            saveSettings(settings);
            applyTextColors();
            syncInputsFromSettings();
        });

        shadowInput.addEventListener("change", (e) => {
            settings.shadow = e.target.checked;
            saveSettings(settings);
            applyTextColors();
        });

        // 绑定色盘实时选色
        panel.querySelectorAll(".st-tc-color").forEach(input => {
            input.addEventListener("input", (e) => {
                const key = input.getAttribute("data-key");
                const val = e.target.value;
                settings[key] = val;
                if (!settings.enabled) settings.enabled = true;
                const hexEl = panel.querySelector(`.st-tc-hex[data-key="${key}"]`);
                if (hexEl) hexEl.value = val;
                saveSettings(settings);
                applyTextColors();
                toggleBtn.textContent = "已开启";
                toggleBtn.classList.add("st-tc-on");
            });
        });

        // 绑定 Hex 色号手动输入
        panel.querySelectorAll(".st-tc-hex").forEach(input => {
            input.addEventListener("input", (e) => {
                const key = input.getAttribute("data-key");
                const val = e.target.value.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                    settings[key] = val;
                    if (!settings.enabled) settings.enabled = true;
                    const colEl = panel.querySelector(`.st-tc-color[data-key="${key}"]`);
                    if (colEl) colEl.value = val;
                    saveSettings(settings);
                    applyTextColors();
                    toggleBtn.textContent = "已开启";
                    toggleBtn.classList.add("st-tc-on");
                }
            });
        });
    }

    function injectTopNavButton() {
        const topBar = document.querySelector("#top-settings-holder");
        if (!topBar) return false;
        if (document.getElementById(NAV_BTN_ID)) return true;

        const btnWrap = document.createElement("div");
        btnWrap.id = NAV_BTN_ID;
        btnWrap.className = "drawer";
        btnWrap.title = "自定义字色色盘";
        btnWrap.innerHTML = `
            <div class="drawer-toggle">
                <div class="drawer-icon fa-solid fa-palette fa-fw closedIcon"></div>
            </div>
        `;

        btnWrap.addEventListener("click", (e) => {
            e.stopPropagation();
            initPanel();
            const panel = document.getElementById(PANEL_ID);
            if (!panel) return;
            const isOpen = panel.classList.toggle("st-tc-open");
            btnWrap.classList.toggle("st-tc-active", isOpen);
        });

        topBar.appendChild(btnWrap);
        return true;
    }

    function start() {
        applyTextColors();
        initPanel();
        injectTopNavButton();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }

    window.addEventListener("load", start);

    let retries = 0;
    const timer = setInterval(() => {
        retries++;
        applyTextColors();
        initPanel();
        if (injectTopNavButton() || retries >= 15) {
            clearInterval(timer);
        }
    }, 600);
})();
