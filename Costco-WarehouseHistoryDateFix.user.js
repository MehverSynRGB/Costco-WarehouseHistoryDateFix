// ==UserScript==
// @name         Costco-WarehouseHistoryDateFix
// @name:zh-CN   Costco-消费历史日期修复
// @namespace    https://github.com/Mehver
// @version      1.0
// @description  Fix invalid end dates in Costco warehouse purchase history queries.
// @description:zh-CN 修复 Costco 消费历史查询中的无效结束日期。
// @author       https://github.com/Mehver
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IB2cksfwAAAAlwSFlzAAAuIwAALiMBeKU/dgAABMxJREFUeJzFl3tsU1Ucx7cp6iREg/+AY+ArOM1EBAmOTQaJKELGaywqkVeGDggi0ZngM4qZM2IIcS4jOjLGjAE2IzEGCHEy5jQDMSJhKs/BbteuXVv6XLve9v78/tZbbc/ObTs14SSf9Pb29zrn/H6/c5qRcR2HajmfeT39Jx/KuJnMGDAZTAUPg4kg+z/YnAEOAy9oBKNlQuz0FdAFNEACEdABFozQ+XzQJ9jaIQrxLOuBR+JYxAReAFkpHGeBYnBaYqMtXvBR3ahs1kYEwSYgTSZ+D5YBs0Q3xBOICY4Gv0mEwrryRdBvEFwALDcIYI4+KVFnELwBbogJPi8ROgfKwf0gF0wBO4FbImtjOcH5fQaT4oA3/+1cF94jCF1SopkvzigbPAt8EsOt4CZd7mYlmuWiDK9m5bAtw4vjgmCN6DxOlnlR3/94Hd6e9brzRZIgHaAU3Cgz2ikIr5d6/0eeM5tLNSLo9YAS0C68V8HrilHFSALYPmyZhuuMAl9KlrlbT7L4d9x8bk9mrE1QOMuJlywAXW+qPrtUpboklaE6iaIdNOiZXwWejiWZoJuYbHcWkKXoGXJseJtcVbXkrd9v0Xz+aiLaDErAgyBLNFKcYhaxJOMWvDp+e/Ccx79ZF5aT/8AhCveYKXy1lwa+aSXPp03k/nAXubd/Tt7dByjQ+hOp3Qr8kwU8JAZRm0YQMZoV/VCCoXsGfz5jY8eud3ZS35wVpIx/LKn+wJF2DqJMDIAz+11F3rlkNMBIqRYIelzbasiUW5Ru8KReuMIB5BvlA2d3PihUop3woBLtXglGnC9vo7DFFul7YmXajhnTxCLS1HAIAQzLp2RJmhdfKbbFFRSx2slSWDYi5wxvEcbvaTuPCyIH/MlLrV7uIfuqV41nCRl7+Vbyf3WEgj/+Qv6vj5Kj4k0yTXqc7PjEaPk3AWQhuer7yzZRqOsCme6aLXeO9+7qOlKvmGxwtBe8BxrCVnu3p7ZJ42rA+Fg0fiuYqUTvBGONgrAULK/ytxyma1s/Mpy9s/IDCnacov4VW3bH6h2fmWAyhcN7tJDahee58c75hGsBA0r0APkOTJKsQLatdGNrWLGQpaBUPvsJhRQ41kn2Na/x97p4fTgdBR4AeSDB8GJJw9mlxF0+legJ95xt2UYPhVTjkkMX9O/7ljyfNJJ5WkmLPvMxYDppWq3mH7iK52ZxZmskxgJ61n+mB8NnvYu7XcTjo968eYZbwJURQKMJ/XHxGpweQxs+hWeHp6aR/M2HeP/bEwPIKcjVlz9lCVlmLBnKavtK4woY2op755L1yVWEFSPr/LVknrIAq4btaTsRRgDVCQGEerv44rgjrTrOmUXOLe9T8PjJIYMjqX/z9EWkXurpRQALZSV2mxLt7+IFQ1pmobPnnVxqyoRZaQdgW7qB0LY7EMAd0hKD0DiwF1iTGOJb8hnfFwfXIaF8joq30g7AWcknMjVKnceG5nFloFvxP6OnlOix+5LOWrCUy1PRr1UwNo1barD9JPWj7Ex3F8ud42Q0P1JCgaM/cADr5I69rkw4z9TcrqQBikOv7dXgezSYQfXcZQp2/oocOYHP0xTC94jbq+H3PtAExkucu/+Xv8gwfgtfMsBsME//zAdjuR8Y6f0FSOMyVAS3b2YAAAAASUVORK5CYII=
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
