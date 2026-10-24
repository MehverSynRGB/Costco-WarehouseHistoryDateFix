<div align="center">
  <h1>Costco-WarehouseHistoryDateFix <code>v1.0</code></h1>
  <p>
    <a href="https://github.com/MehverSynRGB/Costco-WarehouseHistoryDateFix"><img src="https://img.shields.io/badge/-GitHub-3A3A3A?style=flat&amp;logo=GitHub&amp;logoColor=white" referrerpolicy="no-referrer" alt="GitHub"></a>
  </p>
  <p><a href="https://github.com/MehverSynRGB/Costco-WarehouseHistoryDateFix">English</a> · <strong>简体中文</strong></p>
</div>

## 简介

Costco-消费历史日期修复 是用于 Costco 店内消费记录查询的非官方用户脚本。它已验证能修正真实请求中的无效日期，并恢复受影响的查询。例如，脚本会在请求发送前修正以下不存在的 `endDate`：

```diff
- "endDate": "6/31/2026"
+ "endDate": "6/30/2026"
```

本项目与 Costco Wholesale 无关联，也未获其认可。

## 特点与严格作用范围

- 仅针对 `https://ecom-api.costco.com/ebusiness/order/v1/orders/graphql`。
- 仅处理 `receiptsWithCounts` 的 `POST` 请求，且只检查 `variables.endDate`。
- 仅当 `M/D/YYYY` 日期在该月确实不存在时才修改；合法日期和其他字段保持不变。
- 同时覆盖 `fetch` 与 `XMLHttpRequest`，包括浏览器中常见的 Axios 适配器。
- 不修改响应、不绕过账户检查，也不恢复会员资格。

## 安装与使用

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或兼容的用户脚本管理器。
2. 安装 [Costco-WarehouseHistoryDateFix.user.js](../Costco-WarehouseHistoryDateFix.user.js)。
3. 确认脚本已启用，刷新 Costco 页面后进入 **Account → Orders and Purchases → warehouse**。
4. 重试受影响的日期范围。

## 验证方法

打开浏览器开发者工具。Console 会显示脚本安装和本地修正记录，例如：

```text
[Costco Receipt Date Fix] Installed
[Costco Receipt Date Fix] 6/31/2026 -> 6/30/2026
```

在 **Network → Fetch/XHR → graphql → Payload** 中确认实际发送的 `variables.endDate` 已为 `6/30/2026`，然后查看 HTTP 状态和页面结果。该脚本已恢复由无效日期影响的查询，但并非所有 HTTP 400 都由此原因造成。

## 脱敏证据截图

以下图片均为排查过程中的隐私脱敏截图。

1. 受影响日期范围的收据页面错误：

   ![Costco 店内消费记录页面显示错误](images/01-site-error.png)

2. GraphQL 请求返回 HTTP 400：

   ![GraphQL 请求返回 400 Bad Request](images/02-graphql-http-400.png)

3. 实际请求 Payload 中含有无效日期：

   ![收据查询包含 endDate 6/31/2026](images/03-invalid-end-date.png)

4. 较早日期范围能够显示收据结果（交易信息已移除）：

   ![较早范围显示收据按钮，隐私信息已脱敏](images/04-older-range-works-redacted.png)

## 隐私与安全

脚本不会向第三方发送数据，不会收集或记录收据详情、会员号码、Cookie 或 Token；控制台只输出被修正的日期。附带 PNG 均经过裁剪和不可逆脱敏。请勿公开原始 HAR、“Copy as cURL”输出、会话 Cookie、授权头、会员号码或未脱敏的小票截图。

## 限制与排障

| 情况 | 检查方式 |
| --- | --- |
| 出现 `Installed` 但没有修正日志 | 日期可能合法、请求可能不是收据查询，或 Costco 已更改请求格式。 |
| 请求仍包含 `6/31` | 确认脚本已启用且获准在 Costco 运行；检查网站或脚本管理器是否有变动。 |
| 修正后仍返回 HTTP 400 | 查看 Response；仍可能存在 API、账户、授权或其他参数问题。 |
| 会员已过期或身份未验证 | 本脚本不能恢复访问权限，也不能绕过 Costco 授权。 |

## 免责声明

此非官方兼容性修复仅应在你有权使用的账户和服务中运行。Costco 可能随时更改网站、API 或访问规则；本项目不保证可用性或结果。

## 许可证

本项目采用 [BSD 3-Clause License](../LICENSE)。
