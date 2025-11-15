# 阶段 6 自测脚本：支付链路 & 气指数验证（Web + PWA）

本手册覆盖“上传 → 分析 → Lite 报告 → 支付解锁 → Full 报告 → 分享 → 数据清理”全流程，重点关注 Stripe 支付与气指数展示的商业化验收。

---

## 0. 预备条件

1. `.env.local` 已配置：
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`、`STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_FULL_REPORT_PRICE_ID`（测试价 ID，例如 `price_test_xxx`）
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
2. Supabase：
   - 执行过所有 migrations（`npm run bootstrap` 或 `npx supabase db push`）
   - 导入数据字典（`npm run seed`）
   - 运行 `npm run qi:rebuild`（若存在历史报告）
3. Stripe Dashboard 打开 **Test mode**。
4. 浏览器建议开启无痕窗口，避免缓存导致的状态干扰。

---

## 1. Lite 分析体验

1. 启动开发环境：`npm run dev` → 访问 `http://localhost:3000/zh`。
2. 进入 “立即体验”，在 `/zh/analyze` 页面：
   - 上传手掌、舌头示例图（可用真机拍摄或测试图）。
   - 输入一段梦境描述（例如 `梦见下雨`）。
   - 勾选隐私授权后提交。
3. 支持点：
   - 表单提交成功后跳转 `/zh/loading`，并 3 秒后进入 `/zh/analysis-result/{reportId}`。
   - 首次展示为 Lite 模式：顶部显示锁定提示、部分建议折叠，仅展示一条气指数建议（总分 + 趋势 + 等级）。
   - 浏览器控制台无报错，IndexedDB 存储 `reportCache`.

---

## 2. 支付链路（Stripe 测试）

1. 在 Lite 报告底部点击 “解锁专业版”。
2. Stripe Checkout 页面：
   - 使用测试卡 `4242 4242 4242 4242`，任意未来有效期 + 任意 CVC。
   - 若在新标签页打开，支付完成后会自动回到 Stripe 页。
3. 支付完成 → 回跳原报告页：
   - URL 带 `?session_id=cs_test_***`；3 秒内自动刷新。
   - 顶部提示 “支付成功，正在刷新报告…”，随后锁定提示消失。
4. 数据验证（Supabase 控制台）：
   - `orders` 表新增记录，`status = paid`，`provider_intent_id = checkout session id`。
   - `reports.unlocked = true`，`report_access` 中同报表、同 session 的 `tier = full`。
   - `qi_index` 字段存在 `total / vitality / harmony / mindset` 等内容。

---

## 3. Full 报告审查

1. 页面展示：
   - 气指数卡片显示全部 3 个子维度与完整建议列表（无锁定提醒）。
   - 手掌、舌象、梦境模块展示完整细节（与 Lite 对比）。
2. 分享功能：
   - 点击 “复制分享链接”，在新标签访问 → `/analysis-result/share?payload=...`。
   - 检查分享页展示宪制概要 + 节气提示 + 梦境摘要，无敏感信息。

---

## 4. 取消与异常回归

1. 回到 Lite 报告（可重新生成一份测试报告）。
2. 点击 “解锁专业版” → 到 Stripe 页后 **直接关闭**：
   - 浏览器回到 Lite 报告，提示仍保留 “解锁专业版”。
   - 控制台无错误日志，应用未误判为已付款。
3. 手动访问 `/zh/billing/cancel`：
   - 页面文案提醒可回到报告再次点击 “解锁专业版”。
   - 底部按钮指向 `/zh/analyze` 与 `/zh`。

---

## 5. PWA / 离线确认（可选）

1. 在 Lite 报告打开 DevTools → Network → Offline。
2. 点击 “解锁专业版”：
   - 会提示网络错误，返回 Lite 状态。
   - 控制台无未捕获异常。
3. 恢复网络后再次点击，支付流程可正常进入。

---

## 6. 清理脚本验收

1. 执行 `npm run cleanup:analysis-temp`：
   - 终端输出删除的临时图片数量或“无过期数据”。
   - Supabase `uploads` 对应记录被清理。
2. 执行 `npm run cleanup:reports`：
   - 如存在过期报告应被删除，并在 `cleanup_jobs` 表记录执行状态。
3. 升级规则后（例如新增气指数计算逻辑）执行 `npm run qi:rebuild`：
   - 终端输出批次更新条数，旧报告 `qi_index` 字段被补齐。

---

## 7. 回归记录

| 检查项 | 结果 | 备注 |
| --- | --- | --- |
| Lite 报告生成 | ☐ 通过 / ☐ 失败 | |
| Stripe 支付完成跳转 | ☐ 通过 / ☐ 失败 | |
| Full 报告解锁 | ☐ 通过 / ☐ 失败 | |
| 气指数分布、建议 | ☐ 通过 / ☐ 失败 | |
| 分享页展示 | ☐ 通过 / ☐ 失败 | |
| 取消支付回退 | ☐ 通过 / ☐ 失败 | |
| 清理脚本执行 | ☐ 通过 / ☐ 失败 | |
| 其他备注 |  | |

