// ==UserScript==
// @name         LeetCode CN — remove @leetcode watermark
// @namespace    https://leetcode.cn/
// @version      1.0
// @description  Strip the @leetcode attribution appended on copy
// @match        https://leetcode.cn/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";
  document.addEventListener(
    "copy",
    function (e) {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      let text = sel.toString();
      text = text.replace(/\n+来源：力扣（LeetCode）[\s\S]*$/, "");
      text = text.replace(/©leetcode/gi, "");
      text = text.trimEnd();

      e.stopImmediatePropagation();  // 阻止其他监听器
      e.clipboardData.setData("text/plain", text);
      e.preventDefault();
    },
    true  // capture phase，比网站自己的监听器更早
  );
})();
