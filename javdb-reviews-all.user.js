// ==UserScript==
// @name         JavDB 短評全部展开（新→旧）
// @namespace    javdb-reviews-expand
// @version      1.0.0
// @description  打开 JavDB 影片页的「短評」时自动加载全部分页，并按日期从新到旧排列
// @match        https://javdb.com/v/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const MAX_PAGES = 100;
  const ITEM_SEL = 'dt.review-item';
  const NEXT_SEL = 'nav.pagination a.pagination-next[href]';

  const root = () => document.querySelector('#reviews');

  const timeOf = (el) => (el.querySelector('.time')?.textContent || '').trim();
  const idOf = (el) => Number((el.id.match(/(\d+)$/) || [0, 0])[1]);

  function compare(a, b) {
    return timeOf(b).localeCompare(timeOf(a)) || idOf(b) - idOf(a);
  }

  function statusEl(text) {
    const el = document.createElement('div');
    el.className = 'jdb-expand-status';
    el.style.cssText = 'font-size:12px;color:#7a7a7a;margin:0 0 8px;';
    el.textContent = text;
    return el;
  }

  async function fetchPage(href) {
    const res = await fetch(new URL(href, location.href).href, {
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: '*/*' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    if (!text.includes('review-item') && /openAuthModal|location\.href\s*=\s*"\/login"/.test(text)) {
      throw new Error('登录状态已失效，请刷新页面重新登录');
    }

    const doc = new DOMParser().parseFromString(text, 'text/html');
    return {
      items: Array.from(doc.querySelectorAll(ITEM_SEL)),
      next: doc.querySelector(NEXT_SEL)?.getAttribute('href') || null,
    };
  }

  async function expandAll(container) {
    if (container.dataset.expanding === '1') return;

    const list = container.querySelector('dl.review-items');
    if (!list) return;

    container.dataset.expanding = '1';
    container.querySelector('.jdb-expand-status')?.remove();

    const items = new Map();
    container.querySelectorAll(ITEM_SEL).forEach((el) => items.set(el.id, el));

    const status = statusEl('正在加载全部短評…');
    (container.querySelector('.message-body') || container).prepend(status);

    let next = container.querySelector(NEXT_SEL)?.getAttribute('href') || null;
    let page = 1;

    try {
      while (next && page < MAX_PAGES) {
        page += 1;
        status.textContent = `正在加载第 ${page} 页…（已获取 ${items.size} 条）`;

        const { items: pageItems, next: nextHref } = await fetchPage(next);
        let added = 0;
        for (const el of pageItems) {
          if (!items.has(el.id)) {
            items.set(el.id, el);
            added += 1;
          }
        }
        if (!added) break;
        next = nextHref;
      }

      list.replaceChildren(...Array.from(items.values()).sort(compare));
      container.querySelectorAll('nav.pagination').forEach((el) => el.remove());
      status.textContent = `已展开全部 ${items.size} 条短評（按日期从新到旧）`;
    } catch (err) {
      status.textContent = `加载失败：${err.message} `;
      const retry = document.createElement('button');
      retry.className = 'button is-small is-light';
      retry.textContent = '重试';
      retry.addEventListener('click', () => expandAll(container));
      status.appendChild(retry);
    } finally {
      delete container.dataset.expanding;
    }
  }

  function boot() {
    const container = root();
    if (!container) return;

    if (container.querySelector(ITEM_SEL)) {
      expandAll(container);
      return;
    }

    const observer = new MutationObserver(() => {
      if (container.querySelector(ITEM_SEL)) {
        observer.disconnect();
        expandAll(container);
      }
    });
    observer.observe(container, { childList: true, subtree: true });
  }

  boot();
})();
