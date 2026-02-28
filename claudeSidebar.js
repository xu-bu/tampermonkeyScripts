// ==UserScript==
// @name         Claude.ai Question Sidebar
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Sidebar showing questions in current chat
// @author       You
// @match        https://claude.ai/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const style = document.createElement("style");
  style.textContent = `
    #qs-sidebar {
      position: fixed;
      right: 0;
      top: 0;
      height: 100vh;
      z-index: 9999;
      display: flex;
      flex-direction: row;
      align-items: stretch;
    }

    /* Collapsed: just the thin strip */
    #qs-strip {
      width: 6px;
      background: #2a2a2a;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 5px;
      padding: 8px 0;
    }

    #qs-sidebar:hover #qs-strip {
      background: #333;
    }

    .qs-tick {
      width: 3px;
      border-radius: 2px;
      background: #666;
      transition: background 0.2s;
    }

    #qs-sidebar:hover .qs-tick {
      background: #999;
    }

    /* Expanded panel */
    #qs-panel {
      width: 0;
      overflow: hidden;
      background: #171717;
      border-left: 1px solid #2a2a2a;
      transition: width 0.2s ease;
      display: flex;
      flex-direction: column;
    }

    #qs-sidebar:hover #qs-panel {
      width: 260px;
    }

    #qs-panel-inner {
      width: 260px;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    #qs-header {
      padding: 16px 16px 10px;
      font-size: 11px;
      font-family: -apple-system, sans-serif;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #666;
      border-bottom: 1px solid #2a2a2a;
      flex-shrink: 0;
    }

    #qs-list {
      flex: 1;
      overflow-y: auto;
      padding: 6px 0;
    }

    #qs-list::-webkit-scrollbar { width: 4px; }
    #qs-list::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

    .qs-item {
      padding: 8px 16px;
      font-size: 13px;
      font-family: -apple-system, sans-serif;
      color: #8a8a8a;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: background 0.15s, color 0.15s;
      border-radius: 4px;
      margin: 1px 6px;
    }

    .qs-item:hover {
      background: #2a2a2a;
      color: #ececec;
    }
  `;
  document.head.appendChild(style);

  const sidebar = document.createElement("div");
  sidebar.id = "qs-sidebar";
  sidebar.innerHTML = `
    <div id="qs-panel">
      <div id="qs-panel-inner">
        <div id="qs-header">In this chat</div>
        <div id="qs-list"></div>
      </div>
    </div>
    <div id="qs-strip"></div>
  `;
  document.body.appendChild(sidebar);

  function renderQuestions() {
    const list = document.getElementById("qs-list");
    if (!list) return;

    const els = document.querySelectorAll(
      '[data-testid="user-message"] p.whitespace-pre-wrap.break-words',
    );
    list.innerHTML = "";

    els.forEach((p) => {
      const text = p.innerText.trim();
      if (!text) return;

      const item = document.createElement("div");
      item.className = "qs-item";
      item.textContent = text;
      item.title = text;
      item.addEventListener("click", () =>
        p.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
      list.appendChild(item);
    });
  }

  // Poll until messages appear
  const t = setInterval(() => {
    const els = document.querySelectorAll(
      '[data-testid="user-message"] p.whitespace-pre-wrap.break-words',
    );
    if (els.length) {
      clearInterval(t);
      renderQuestions();
    }
  }, 500);

  // Debounced re-render on new messages
  let debounce = null;
  new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(renderQuestions, 1500);
  }).observe(document.body, { childList: true, subtree: false });
})();
