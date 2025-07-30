// Alt + D to hide pic after you open a note
// ==UserScript==
// @name         Hide Swiper Active Slide
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hide elements
// @match        https://www.xiaohongshu.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const SELECTORS = [".media-container"];

  function promoteInner() {
    SELECTORS.forEach((sel) => {
      const outerEls = document.querySelectorAll(sel);
      outerEls.forEach((outer) => {
        const note = outer.querySelector(".note-container");
        if (note) {
          // Insert note in place of the deleted element
          outer.parentNode.insertBefore(note, outer);
          // Make note take full size
          note.style.width = "100%";
          note.style.height = "100%";
          note.style.display = "block";
        }
        // Remove the outer element
        outer.remove();
      });
    });
  }

  // Alt + D to trigger
  window.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "d") {
      e.preventDefault();
      promoteInner();
    }
  });
})();
