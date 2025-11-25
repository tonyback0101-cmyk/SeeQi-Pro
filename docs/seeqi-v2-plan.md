# SeeQi V2 气运 & 报告规划速记

## 目标概览
- **规则层**：掌纹 / 舌苔 / 梦境 / 体质 / 黄历全部 V2 化，并输出 `almanacHint + components` 供 UI 使用。
- **数据流**：`/v2/analyze → /api/v2/analyze → Supabase report_v2 → /api/v2/result → /v2/analysis-result + /v2/reports/*`。
- **隔离策略**：老版 `/analysis` 不变，V2 全部挂 `/v2/*`，Supabase 也使用新表 `report_v2`，可通过 `ENABLE_SUPABASE_ANALYZE` 开关灰度。

## 已完成内容
1. **规则/引擎**  
   - 新建 `qiRulesTongue/Palm/Dream/Almanac/Constitution` 与 `rules/index.ts`。  
   - `qiEngine.ts` 仅依赖 V2 规则，返回 `almanacHint` + `components`。  
   - `QiCardV2` 展示指数/趋势/黄历提示及查看完整报告链接。

2. **V2 报告页与 UI**  
   - `/v2/reports/{palm|tongue|dream|qi}`：全部完成“轻、软、现代”风格布局。  
   - `analysis-result` 六张卡片顺序固定并接入完整报告按钮。  
   - `LLM prompt` 在掌纹/舌苔/梦境三处统一语气与格式。

3. **Supabase 接入**  
   - 迁移：`supabase/migrations/20251119_create_report_v2.sql` 创建 `report_v2`（JSON 字段与 normalized.* 对齐）。  
   - 写入：`ENABLE_SUPABASE_ANALYZE=true` 时，`/api/v2/analyze` upsert 完整 V2 数据；默认仍走内存存储。  
   - 读取：`/api/v2/result/[reportId]` 先查 Supabase，再 fallback 到本地缓存。

4. **安全与风险**  
   - 默认不开启 Supabase，生产可按需设置 `ENABLE_SUPABASE_ANALYZE`。  
   - 新表未启用 RLS（与旧 `reports` 一致）；若后续需要对 user 绑定，可在启用前补充策略。

## 启用步骤（可选）
1. 运行最新迁移（或在 Supabase 控制台执行 `20251119_create_report_v2.sql`）。  
2. 设置环境变量：  
   ```
   ENABLE_SUPABASE_ANALYZE=true
   SUPABASE_SERVICE_ROLE_KEY=…
   SUPABASE_URL=…
   ```  
3. 观察 `/v2/analyze` 写入日志，确认 `report_v2` 有数据，再放开 `/v2/result` 前端访问。

## 后续可选事项
- `report_v2` RLS（若需用户维度隔离）。  
- 针对 `inferQiRhythmV2` / LLM 解释补充单元测试。  
- 若未来要在 Supabase 查询历史 V2 报告，可加索引（如 `locale`/`created_at` 组合）。






## 目标概览
- **规则层**：掌纹 / 舌苔 / 梦境 / 体质 / 黄历全部 V2 化，并输出 `almanacHint + components` 供 UI 使用。
- **数据流**：`/v2/analyze → /api/v2/analyze → Supabase report_v2 → /api/v2/result → /v2/analysis-result + /v2/reports/*`。
- **隔离策略**：老版 `/analysis` 不变，V2 全部挂 `/v2/*`，Supabase 也使用新表 `report_v2`，可通过 `ENABLE_SUPABASE_ANALYZE` 开关灰度。

## 已完成内容
1. **规则/引擎**  
   - 新建 `qiRulesTongue/Palm/Dream/Almanac/Constitution` 与 `rules/index.ts`。  
   - `qiEngine.ts` 仅依赖 V2 规则，返回 `almanacHint` + `components`。  
   - `QiCardV2` 展示指数/趋势/黄历提示及查看完整报告链接。

2. **V2 报告页与 UI**  
   - `/v2/reports/{palm|tongue|dream|qi}`：全部完成“轻、软、现代”风格布局。  
   - `analysis-result` 六张卡片顺序固定并接入完整报告按钮。  
   - `LLM prompt` 在掌纹/舌苔/梦境三处统一语气与格式。

3. **Supabase 接入**  
   - 迁移：`supabase/migrations/20251119_create_report_v2.sql` 创建 `report_v2`（JSON 字段与 normalized.* 对齐）。  
   - 写入：`ENABLE_SUPABASE_ANALYZE=true` 时，`/api/v2/analyze` upsert 完整 V2 数据；默认仍走内存存储。  
   - 读取：`/api/v2/result/[reportId]` 先查 Supabase，再 fallback 到本地缓存。

4. **安全与风险**  
   - 默认不开启 Supabase，生产可按需设置 `ENABLE_SUPABASE_ANALYZE`。  
   - 新表未启用 RLS（与旧 `reports` 一致）；若后续需要对 user 绑定，可在启用前补充策略。

## 启用步骤（可选）
1. 运行最新迁移（或在 Supabase 控制台执行 `20251119_create_report_v2.sql`）。  
2. 设置环境变量：  
   ```
   ENABLE_SUPABASE_ANALYZE=true
   SUPABASE_SERVICE_ROLE_KEY=…
   SUPABASE_URL=…
   ```  
3. 观察 `/v2/analyze` 写入日志，确认 `report_v2` 有数据，再放开 `/v2/result` 前端访问。

## 后续可选事项
- `report_v2` RLS（若需用户维度隔离）。  
- 针对 `inferQiRhythmV2` / LLM 解释补充单元测试。  
- 若未来要在 Supabase 查询历史 V2 报告，可加索引（如 `locale`/`created_at` 组合）。





