// ==UserScript==
// @name         Gemini Chat History Sidebar
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Transparent sidebar showing chat history in Gemini
// @author       You
// @match        https://gemini.google.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const style = document.createElement("style");
  style.textContent = `
    #gs-sidebar {
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
    #gs-strip {
      width: 8px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 6px;
      padding: 12px 0;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
    }

    #gs-sidebar:hover #gs-strip {
      background: rgba(255, 255, 255, 0.15);
      width: 10px;
    }

    .gs-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      transition: all 0.3s ease;
    }

    #gs-sidebar:hover .gs-dot {
      background: rgba(255, 255, 255, 0.7);
      transform: scale(1.2);
    }

    /* Expanded panel */
    #gs-panel {
      width: 0;
      overflow: hidden;
      background: rgba(30, 30, 30, 0.75);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      transition: width 0.2s ease;
      display: flex;
      flex-direction: column;
      box-shadow: -5px 0 30px rgba(0, 0, 0, 0.3);
    }

    #gs-sidebar:hover #gs-panel {
      width: 300px;
    }

    #gs-panel-inner {
      width: 300px;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    #gs-header {
      padding: 20px 20px 12px;
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.5);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      flex-shrink: 0;
    }

    #gs-list {
      flex: 1;
      overflow-y: auto;
      padding: 10px 0;
    }

    #gs-list::-webkit-scrollbar { 
      width: 4px; 
    }
    #gs-list::-webkit-scrollbar-track { 
      background: transparent; 
    }
    #gs-list::-webkit-scrollbar-thumb { 
      background: rgba(255, 255, 255, 0.15); 
      border-radius: 4px; 
    }
    #gs-list::-webkit-scrollbar-thumb:hover { 
      background: rgba(255, 255, 255, 0.25); 
    }

    .gs-item {
      padding: 12px 18px;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: all 0.15s ease;
      border-radius: 8px;
      margin: 2px 10px;
      border: 1px solid transparent;
    }

    .gs-item:hover {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.95);
      border-color: rgba(255, 255, 255, 0.1);
      transform: translateX(-2px);
    }

    .gs-item-number {
      display: inline-block;
      width: 20px;
      height: 20px;
      line-height: 20px;
      text-align: center;
      font-size: 10px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.4);
      background: rgba(255, 255, 255, 0.05);
      border-radius: 50%;
      margin-right: 10px;
      transition: all 0.2s ease;
    }

    .gs-item:hover .gs-item-number {
      background: rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.7);
    }
  `;
  document.head.appendChild(style);

  const sidebar = document.createElement("div");
  sidebar.id = "gs-sidebar";

  const panel = document.createElement("div");
  panel.id = "gs-panel";

  const panelInner = document.createElement("div");
  panelInner.id = "gs-panel-inner";

  const header = document.createElement("div");
  header.id = "gs-header";
  header.textContent = "Chat History";

  const list = document.createElement("div");
  list.id = "gs-list";

  const strip = document.createElement("div");
  strip.id = "gs-strip";

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "gs-dot";
    strip.appendChild(dot);
  }

  panelInner.appendChild(header);
  panelInner.appendChild(list);
  panel.appendChild(panelInner);
  sidebar.appendChild(panel);
  sidebar.appendChild(strip);
  document.body.appendChild(sidebar);

  function renderMessages() {
    const list = document.getElementById("gs-list");
    if (!list) return;

    // Try multiple selectors for Gemini user messages
    const selectors = [
      "span.user-query-bubble-with-background",
      'div[id^="user-query-content-"]',
      "p.query-text-line",
      ".query-text",
    ];

    let messages = [];
    for (const selector of selectors) {
      const els = document.querySelectorAll(selector);
      if (els.length > 0) {
        // Filter for actual user message content
        messages = Array.from(els).filter((el) => {
          const text = el.innerText?.trim();
          // Get text from p.query-text-line if available
          const queryLine = el.querySelector(".query-text-line");
          const queryText = queryLine ? queryLine.innerText?.trim() : text;
          return queryText && queryText.length > 0;
        });
        if (messages.length > 0) break;
      }
    }

    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    messages.forEach((msg, index) => {
      // Get text from query-line if available, otherwise use innerText
      const queryLine = msg.querySelector(".query-text-line");
      const text = queryLine
        ? queryLine.innerText.trim()
        : msg.innerText.trim();
      if (!text) return;

      const item = document.createElement("div");
      item.className = "gs-item";
      item.title = text;

      const numberSpan = document.createElement("span");
      numberSpan.className = "gs-item-number";
      numberSpan.textContent = index + 1;

      const textNode = document.createTextNode(text);
      item.appendChild(numberSpan);
      item.appendChild(textNode);

      item.addEventListener("click", () =>
        msg.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
      list.appendChild(item);
    });
  }

  // Poll until messages appear
  const t = setInterval(() => {
    const hasContent = document.body.innerText.length > 100;
    if (hasContent) {
      clearInterval(t);
      renderMessages();
    }
  }, 200);

  // Debounced re-render on new messages
  let debounce = null;
  new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(renderMessages, 200);
  }).observe(document.body, { childList: true, subtree: true });
})();
