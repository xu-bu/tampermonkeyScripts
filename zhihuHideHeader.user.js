// ==UserScript==
// @name         test zhihu
// @namespace    http://tampermonkey.net/
// @version      2025-06-18
// @description  try to take over the world!
// @author       You
// @match        https://www.zhihu.com/question/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zhihu.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const titles = document.querySelectorAll("h1");

  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 500) {
      // Scrolling down — hide titles
      titles.forEach((el) => (el.style.display = "none"));
    } else {
      // Scrolling up — show titles
      titles.forEach((el) => (el.style.display = ""));
    }
  });
})();
