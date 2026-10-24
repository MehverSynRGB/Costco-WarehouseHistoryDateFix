// ==UserScript==
// @name         Costco-WarehouseHistoryDateFix
// @name:zh-CN   Costco-消费历史日期修复
// @namespace    https://github.com/Mehver
// @version      1.0
// @description  Fix invalid end dates in Costco warehouse purchase history queries.
// @description:zh-CN 修复 Costco 消费历史查询中的无效结束日期。
// @author       https://github.com/Mehver
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IB2cksfwAAAAlwSFlzAAAuIwAALiMBeKU/dgAABJJJREFUeJzFl2tsFFUUx9uKyiNG9IstFRoNETFaMIqtEmg1iogoFAkpjwAKGDCWGiQQICZ8wUgIRK34rBbQiAgGPgCK0pUWUKSoWGikKBA7+2i7XfbVfXV39vg/nZk6vb2zj/ihk/ySzeSc8//fe8+9czcnZxCfuOty7mDqp36U/BLmFnAPmAgmgDFg2P+oOQl8C4JgNxghC2LRNaAFJAEJqOAUmJGl+HTQLtTaIQbxKGtBQCIsYgcrQF4a4TxQBs5LapwwBz6sF5WN2oooeBVIm4nfgznAKcnt4QEYgSPAH5KghJ78N3BbmIuAuRYGyvVBiTkxsBHcYAQukgS1gmVgHBgNisHbwC+J7eQ4QXysxaDY8Oo+cT14lxB0RdE6XxzRMFAJuiWF68FNetzNitblYgzP5toBS4YXDUJgjShuimVe1tffnMPLs1IXf15i0gNeAENkRc8IwSul6v/Fc2fzVlWFvDbwHGgU3sfBBsVqx0gMbBswTQNzbgRfSqb5mt5k5nd8+IxMVeyEkHCRGy+VAT1voj66dFt1drpCH0gSu0Cd3vlbwDNGkwm5smbrw1k843RCcZUS0RRQAsaD4WKRsjSjMJqMj+Al5uXB73sV8/kwqpQ6nl1GwboDFL+qUKLNSdHTv1LkWCNFbD9T7Fwzqe7rKky0gDVmEzszMGGwXzF9lPDbxu+7XlpP0YazFPuthbzr3iLngzMta7imViZhwGE2wJ29WZGfXDLqjFzHfdOqQvuPYnQXyLN8A9kLH0ub3zFtCfTJJusH7u77wWRFOwkPKdrpJSvEazoU1Adr95H9zvTCBp6qzWzgvTR93m+dxZ3CvIsinwU//TpjYYNAzW428EpGBnQTheCSuYh7wWvungutGPlkqYj97nLybtpOsTO/9zZk9GQT+bfXkmPck2jKk2ygPBsD3CO1ZoHQV4fp+rqtcvG7plLgnV2q6vU3Qeh1MBdsSkaix8OHbYn4lX+4CYuM4sN5PRXtTnB7ChNb+gSKplDC1UmOsY9LDXSt2EjJcOQYRArMNfgMANVgG8gzvnAHQFjRPiDHQZFEnOPqDYH2skqKNTWnWOM9PMXVgngeGAWW9xlD8CwhmQ+VD4V9zl+4+YrpqsaHTcT2k6UBd2U1qR7vRQgtBHwSziRV3Zno9FyKX77G5tYaxZdKCkT0rv9YN8Mj95ljnA/Nop7Wq6QUWHQ6zgL3vCoK7TuiRhvPRsKHflC967dS+xMLKfTNd2ygQjNQ+Ohoffqz20oFpd3JYOiv9qcWZxDbL4/ibc4EDNzRa6DH0cIXxx1ZG8gveRNF5kdPnUvYLRpRBs8cJZN/Irdfg92qaOe7eMGwgu8Pt6HIEFATPvKj6po0O7MTcNUbPP2fyLZYPtgDOlIU4FtyMyg2dfZIcBQzQZ0Vq7D/yyzFeesG3v+CDayW7vNkwJeDIP5n9LSifXardF4EFaBIkVyrUDAXzAENqj8Y5BOv+/ODFPxob+9nOXTwe4r+ch67whdDTDMY01846MuFeG7S75May+bRD5pHwDywFCwA08EDAy4imrh/UP8i/wtWxCNKsXfQhQAAAABJRU5ErkJggg==
// @match        https://www.costco.com/*
// @match        https://costco.com/*
// @license      BSD-3-Clause
// @charset      UTF-8
// @homepageURL  https://github.com/MehverSynRGB/Costco-WarehouseHistoryDateFix
// @contributionURL https://github.com/MehverSynRGB/Costco-WarehouseHistoryDateFix
// @copyright    Copyright (c) 2026 Mehver (https://github.com/Mehver). All rights reserved.
// @grant        none
// @run-at       document-start
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const TARGET_HOST = 'ecom-api.costco.com';
  const TARGET_PATH = '/ebusiness/order/v1/orders/graphql';
  const PREFIX = '[Costco Receipt Date Fix]';

  function isReceiptEndpoint(url) {
    try {
      const parsed = new URL(String(url), location.href);
      return parsed.protocol === 'https:' &&
        parsed.hostname === TARGET_HOST &&
        parsed.pathname === TARGET_PATH;
    } catch (_) {
      return false;
    }
  }

  function repairReceiptBody(body) {
    if (typeof body !== 'string' || !body.includes('receiptsWithCounts')) {
      return body;
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch (_) {
      return body;
    }

    const operations = Array.isArray(payload) ? payload : [payload];
    let changed = false;

    for (const operation of operations) {
      if (!operation || typeof operation !== 'object') continue;

      const isReceiptQuery =
        (typeof operation.query === 'string' &&
          operation.query.includes('receiptsWithCounts')) ||
        operation.operationName === 'receiptsWithCounts';
      if (!isReceiptQuery) continue;

      const rawDate = operation.variables?.endDate;
      if (typeof rawDate !== 'string') continue;

      const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(rawDate);
      if (!match) continue;

      const [, monthText, dayText, yearText] = match;
      const month = Number(monthText);
      const day = Number(dayText);
      const year = Number(yearText);
      if (month < 1 || month > 12 || day < 1 || day > 31) continue;

      const lastDay = new Date(year, month, 0).getDate();
      if (day <= lastDay) continue;

      const correctedDate =
        `${monthText}/${String(lastDay).padStart(dayText.length, '0')}/${yearText}`;
      operation.variables.endDate = correctedDate;
      changed = true;

      // Only dates are logged; no membership numbers, receipt data, or tokens.
      console.info(`${PREFIX} ${rawDate} -> ${correctedDate}`);
    }

    return changed ? JSON.stringify(payload) : body;
  }

  // Handles fetch(url, {body: string}) and fetch(Request).
  const originalFetch = window.fetch;
  if (typeof originalFetch === 'function') {
    window.fetch = function (resource, init) {
      const url = typeof resource === 'string' || resource instanceof URL
        ? String(resource)
        : resource?.url;
      if (!isReceiptEndpoint(url)) {
        return originalFetch.apply(this, arguments);
      }

      const method = String(init?.method || resource?.method || 'GET').toUpperCase();
      if (method !== 'POST') {
        return originalFetch.apply(this, arguments);
      }

      if (typeof init?.body === 'string') {
        const modified = repairReceiptBody(init.body);
        if (modified !== init.body) {
          return originalFetch.call(this, resource, { ...init, body: modified });
        }
        return originalFetch.apply(this, arguments);
      }

      if (resource instanceof Request && init?.body == null) {
        // Read a clone so the original request remains untouched if no fix is needed.
        return resource.clone().text().then(body => {
          const modified = repairReceiptBody(body);
          if (modified === body) {
            return originalFetch.call(this, resource, init);
          }
          const patched = new Request(resource, { ...init, body: modified });
          return originalFetch.call(this, patched);
        });
      }

      return originalFetch.apply(this, arguments);
    };
  }

  // Covers XMLHttpRequest (including Axios's usual browser adapter).
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const targetRequests = new WeakMap();

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    targetRequests.set(
      this,
      String(method).toUpperCase() === 'POST' && isReceiptEndpoint(url)
    );
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (targetRequests.get(this) && typeof body === 'string') {
      body = repairReceiptBody(body);
    }
    return originalSend.call(this, body);
  };

  console.log('Script Costco-WarehouseHistoryDateFix (Costco-消费历史日期修复) loaded successfully. https://github.com/MehverSynRGB/Costco-WarehouseHistoryDateFix');
})();
