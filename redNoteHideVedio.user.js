// ==UserScript==
// @name         Xiaohongshu Hide Video Notes
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hide video notes on Xiaohongshu (小红书)
// @author       You
// @match        https://www.xiaohongshu.com/*
// @match        https://xiaohongshu.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  // Add CSS to hide video notes
  const style = document.createElement("style");
  style.textContent = `
        /* Hide note items that contain video play icons */
        .note-item:has(.play-icon) {
            display: none !important;
        }
    `;

  // Insert style as early as possible
  if (document.head) {
    document.head.appendChild(style);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      document.head.appendChild(style);
    });
  }

  // Backup method: Use MutationObserver to hide videos that load dynamically
  function hideVideoNotes() {
    const videoNotes = document.querySelectorAll(".note-item .play-icon");
    videoNotes.forEach((icon) => {
      const noteItem = icon.closest(".note-item");
      if (noteItem) {
        noteItem.style.display = "none";
      }
    });
  }

  // Initial hide
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hideVideoNotes);
  } else {
    hideVideoNotes();
  }

  // Watch for dynamically loaded content
  const observer = new MutationObserver(() => {
    hideVideoNotes();
  });

  // Start observing when body is available
  const startObserving = () => {
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    } else {
      setTimeout(startObserving, 100);
    }
  };

  startObserving();
})();
