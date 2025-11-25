# SeeQi V2 最终交付测试清单

## 前端测试

### ✅ 1. 上传掌纹
- **文件位置**: `src/app/[locale]/v2/analyze/page.tsx`
- **功能**: 
  - 支持文件上传和相机拍照
  - 图片质量验证（`validateImageQuality`）
  - 预览功能
- **测试点**:
  - [ ] 上传 JPG/PNG 格式图片
  - [ ] 相机拍照功能
  - [ ] 图片质量验证（模糊/低分辨率提示）
  - [ ] 图片预览显示
  - [ ] 移除图片功能

### ✅ 2. 上传舌苔
- **文件位置**: `src/app/[locale]/v2/analyze/page.tsx`
- **功能**: 
  - 支持文件上传和相机拍照
  - 图片质量验证
  - 预览功能
- **测试点**:
  - [ ] 上传 JPG/PNG 格式图片
  - [ ] 相机拍照功能
  - [ ] 图片质量验证
  - [ ] 图片预览显示
  - [ ] 移除图片功能

### ✅ 3. 梦境文本输入
- **文件位置**: `src/app/[locale]/v2/analyze/page.tsx`
- **功能**: 
  - 纯文本输入框（已移除类型/情绪/标签选择）
  - 文本验证
- **测试点**:
  - [ ] 文本输入框正常显示
  - [ ] 可以输入中文和英文
  - [ ] 文本验证（非空检查）
  - [ ] Placeholder 提示正常

### ✅ 4. 调用 API `/api/v2/analyze`
- **文件位置**: `src/app/[locale]/v2/analyze/page.tsx` (line 293-314)
- **功能**: 
  - POST 请求到 `/api/v2/analyze`
  - 传递 FormData（palm_image, tongue_image, dream_text, locale, tz）
  - 错误处理
- **测试点**:
  - [ ] 成功调用 API
  - [ ] 正确传递所有参数
  - [ ] 错误处理（网络错误、API 错误）
  - [ ] 加载状态显示
  - [ ] 离线状态检测

### ✅ 5. 跳转结果页
- **文件位置**: `src/app/[locale]/v2/analyze/page.tsx` (line 314)
- **功能**: 
  - 成功后跳转到 `/${locale}/v2/analysis-result?reportId=${reportId}`
- **测试点**:
  - [ ] 成功跳转到结果页
  - [ ] URL 参数正确传递
  - [ ] 页面正常加载

### ✅ 6. 各卡片数据正常渲染
- **文件位置**: `src/app/[locale]/v2/analysis-result/page.tsx`
- **卡片列表**:
  1. **PalmInsightCardV2** - 掌纹洞察卡
  2. **BodyTongueCardV2** - 身体气机卡
  3. **ConstitutionCardV2** - 状态体质卡
  4. **DreamCardV2** - 梦境解读卡
  5. **QiCardV2** - 今日气运卡
  6. **AdviceCardV2** - 综合建议卡
- **测试点**:
  - [ ] 所有 6 张卡片正常显示
  - [ ] 卡片顺序正确（掌纹 → 舌苔 → 体质 → 梦境 → 气运 → 建议）
  - [ ] 数据正确渲染（无空值、格式正确）
  - [ ] Fallback 数据正常显示
  - [ ] 链接按钮正常工作

### ✅ 7. 详情页可访问
- **详情页列表**:
  - `/v2/reports/palm` - 掌纹完整报告
  - `/v2/reports/tongue` - 舌苔完整报告
  - `/v2/reports/dream` - 梦境完整报告
  - `/v2/reports/qi` - 气运完整报告
- **测试点**:
  - [ ] 所有详情页可正常访问
  - [ ] 从结果页链接跳转正常
  - [ ] 数据正确显示
  - [ ] 返回按钮正常工作

### ✅ 8. 气运卡正常工作（初版）
- **文件位置**: `src/components/v2/cards/QiCardV2.tsx`
- **功能**: 
  - 显示气运指数（index）
  - 显示气运标签（tag）
  - 显示气运总览（summary）
  - 显示气运趋势（trend）
  - 显示气运建议（advice）
- **测试点**:
  - [ ] 气运指数正常显示（1-100）
  - [ ] 气运标签正常显示（升/稳/中/低）
  - [ ] 气运总览文本正常显示
  - [ ] 气运趋势文本正常显示
  - [ ] 气运建议列表正常显示
  - [ ] 贡献度图表正常显示（可选）

## 后端测试

### ✅ 9. LLM 调用成功
- **文件位置**: `src/app/api/v2/analyze/route.ts`
- **LLM 调用列表**:
  1. `interpretPalmWithLLM` - 掌纹解读 (line 158)
  2. `interpretTongueWithLLM` - 舌苔解读 (line 159)
  3. `interpretDreamWithLLM` - 梦境解读 (line 160-166)
  4. `interpretConstitutionWithLLM` - 体质解读 (line 171-176)
  5. `interpretQiRhythmWithLLM` - 气运解读 (在 `inferQiRhythmV2` 内部)
- **测试点**:
  - [ ] 所有 LLM 调用成功
  - [ ] Fallback 机制正常工作（LLM 失败时使用规则生成）
  - [ ] 返回数据结构正确
  - [ ] 错误处理正常

### ✅ 10. normalized 数据结构完整
- **文件位置**: `src/app/api/v2/analyze/route.ts` (line 250-262)
- **数据结构**:
```typescript
normalized: {
  palm_insight: {
    life_rhythm: string;
    emotion_pattern: string;
    thought_style: string;
    palm_overview_summary: string;
    palm_advice: string[];
  };
  palm_result: {...};
  body_tongue: {
    qi_pattern: string;
    energy_state: string;
    body_trend: string;
    health_care_advice: string[];
  };
  constitution: {
    type: string;
    name: string;
    name_en: string;
    description_paragraphs: string[];
    constitution_advice: string[];
  };
  dream_insight: {
    ImageSymbol: string;
    MindState: string;
    Trend: string;
    Advice: string[];
  };
  qi_rhythm: {
    index: number;
    tag: string;
    trend: "up" | "down" | "flat";
    summary: string;
    trend: string;
    advice: string[];
  };
  advice: {
    actions: string[];
  };
}
```
- **测试点**:
  - [ ] normalized 对象结构完整
  - [ ] 所有必需字段都存在
  - [ ] 数据类型正确
  - [ ] 数组字段不为 null

### ✅ 11. Supabase 存储成功
- **文件位置**: `src/app/api/v2/analyze/route.ts` (line 310-370)
- **功能**: 
  - 存储到 `report_v2` 表
  - 使用 `upsert` 操作
  - 存储完整的 `normalized` 对象
- **测试点**:
  - [ ] Supabase 连接正常
  - [ ] 数据成功写入 `report_v2` 表
  - [ ] `normalized` 字段正确存储
  - [ ] 可以成功读取存储的数据
  - [ ] 错误处理正常（Supabase 不可用时使用临时存储）

## 数据流验证

### ✅ 12. 数据流完整性
- **流程**:
  1. 前端上传 → `/api/v2/analyze`
  2. 后端分析 → LLM 解读 → 生成 normalized
  3. 存储到 Supabase → 返回 reportId
  4. 前端跳转 → `/v2/analysis-result?reportId=...`
  5. 前端获取 → `/api/v2/result/[reportId]`
  6. 前端渲染 → 显示所有卡片
- **测试点**:
  - [ ] 完整流程无中断
  - [ ] 数据在各个阶段保持一致
  - [ ] 错误处理覆盖所有环节

## UI/UX 验证

### ✅ 13. V2 主题样式
- **文件位置**: `src/styles/v2-theme.css`
- **测试点**:
  - [ ] 宣纸纹理背景正常显示
  - [ ] 墨绿色按钮样式正确
  - [ ] 卡片细边线和圆角 20px
  - [ ] 极轻阴影效果
  - [ ] 大间距（24/32px）正常
  - [ ] Inter + 思源宋体字体正常加载

### ✅ 14. 响应式设计
- **测试点**:
  - [ ] 移动端布局正常
  - [ ] 桌面端布局正常
  - [ ] PWA 安全区域适配正常
  - [ ] 触摸优化正常

## 兼容性验证

### ✅ 15. V1/V2 隔离
- **测试点**:
  - [ ] V1 路由不受影响（/analyze, /analysis-result 等）
  - [ ] V2 路由独立运行（/v2/analyze, /v2/analysis-result 等）
  - [ ] V1 API 不受影响（/api/analyze 等）
  - [ ] V2 API 独立运行（/api/v2/analyze 等）
  - [ ] 组件命名规范（所有 V2 组件以 V2 结尾）

## 错误处理验证

### ✅ 16. 错误处理
- **测试点**:
  - [ ] 图片上传失败处理
  - [ ] LLM 调用失败 Fallback
  - [ ] Supabase 连接失败 Fallback
  - [ ] 网络错误提示
  - [ ] 离线状态检测

## 性能验证

### ✅ 17. 性能
- **测试点**:
  - [ ] 页面加载速度正常
  - [ ] API 响应时间合理（< 60s）
  - [ ] 图片上传速度正常
  - [ ] 无内存泄漏

---

## 测试执行记录

### 测试日期: _______________
### 测试人员: _______________

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 1. 上传掌纹 | ⬜ | |
| 2. 上传舌苔 | ⬜ | |
| 3. 梦境文本输入 | ⬜ | |
| 4. 调用 API v2/analyze | ⬜ | |
| 5. 跳转结果页 | ⬜ | |
| 6. 各卡片数据渲染 | ⬜ | |
| 7. 详情页可访问 | ⬜ | |
| 8. 气运卡正常工作 | ⬜ | |
| 9. LLM 调用成功 | ⬜ | |
| 10. normalized 数据结构完整 | ⬜ | |
| 11. Supabase 存储成功 | ⬜ | |
| 12. 数据流完整性 | ⬜ | |
| 13. V2 主题样式 | ⬜ | |
| 14. 响应式设计 | ⬜ | |
| 15. V1/V2 隔离 | ⬜ | |
| 16. 错误处理 | ⬜ | |
| 17. 性能 | ⬜ | |

---

## 已知问题

（在此记录测试过程中发现的问题）

---

## 交付确认

- [ ] 所有核心功能测试通过
- [ ] 所有 UI/UX 测试通过
- [ ] 所有兼容性测试通过
- [ ] 代码审查通过
- [ ] 文档完整

**交付日期**: _______________
**交付人员**: _______________





## 前端测试

### ✅ 1. 上传掌纹
- **文件位置**: `src/app/[locale]/v2/analyze/page.tsx`
- **功能**: 
  - 支持文件上传和相机拍照
  - 图片质量验证（`validateImageQuality`）
  - 预览功能
- **测试点**:
  - [ ] 上传 JPG/PNG 格式图片
  - [ ] 相机拍照功能
  - [ ] 图片质量验证（模糊/低分辨率提示）
  - [ ] 图片预览显示
  - [ ] 移除图片功能

### ✅ 2. 上传舌苔
- **文件位置**: `src/app/[locale]/v2/analyze/page.tsx`
- **功能**: 
  - 支持文件上传和相机拍照
  - 图片质量验证
  - 预览功能
- **测试点**:
  - [ ] 上传 JPG/PNG 格式图片
  - [ ] 相机拍照功能
  - [ ] 图片质量验证
  - [ ] 图片预览显示
  - [ ] 移除图片功能

### ✅ 3. 梦境文本输入
- **文件位置**: `src/app/[locale]/v2/analyze/page.tsx`
- **功能**: 
  - 纯文本输入框（已移除类型/情绪/标签选择）
  - 文本验证
- **测试点**:
  - [ ] 文本输入框正常显示
  - [ ] 可以输入中文和英文
  - [ ] 文本验证（非空检查）
  - [ ] Placeholder 提示正常

### ✅ 4. 调用 API `/api/v2/analyze`
- **文件位置**: `src/app/[locale]/v2/analyze/page.tsx` (line 293-314)
- **功能**: 
  - POST 请求到 `/api/v2/analyze`
  - 传递 FormData（palm_image, tongue_image, dream_text, locale, tz）
  - 错误处理
- **测试点**:
  - [ ] 成功调用 API
  - [ ] 正确传递所有参数
  - [ ] 错误处理（网络错误、API 错误）
  - [ ] 加载状态显示
  - [ ] 离线状态检测

### ✅ 5. 跳转结果页
- **文件位置**: `src/app/[locale]/v2/analyze/page.tsx` (line 314)
- **功能**: 
  - 成功后跳转到 `/${locale}/v2/analysis-result?reportId=${reportId}`
- **测试点**:
  - [ ] 成功跳转到结果页
  - [ ] URL 参数正确传递
  - [ ] 页面正常加载

### ✅ 6. 各卡片数据正常渲染
- **文件位置**: `src/app/[locale]/v2/analysis-result/page.tsx`
- **卡片列表**:
  1. **PalmInsightCardV2** - 掌纹洞察卡
  2. **BodyTongueCardV2** - 身体气机卡
  3. **ConstitutionCardV2** - 状态体质卡
  4. **DreamCardV2** - 梦境解读卡
  5. **QiCardV2** - 今日气运卡
  6. **AdviceCardV2** - 综合建议卡
- **测试点**:
  - [ ] 所有 6 张卡片正常显示
  - [ ] 卡片顺序正确（掌纹 → 舌苔 → 体质 → 梦境 → 气运 → 建议）
  - [ ] 数据正确渲染（无空值、格式正确）
  - [ ] Fallback 数据正常显示
  - [ ] 链接按钮正常工作

### ✅ 7. 详情页可访问
- **详情页列表**:
  - `/v2/reports/palm` - 掌纹完整报告
  - `/v2/reports/tongue` - 舌苔完整报告
  - `/v2/reports/dream` - 梦境完整报告
  - `/v2/reports/qi` - 气运完整报告
- **测试点**:
  - [ ] 所有详情页可正常访问
  - [ ] 从结果页链接跳转正常
  - [ ] 数据正确显示
  - [ ] 返回按钮正常工作

### ✅ 8. 气运卡正常工作（初版）
- **文件位置**: `src/components/v2/cards/QiCardV2.tsx`
- **功能**: 
  - 显示气运指数（index）
  - 显示气运标签（tag）
  - 显示气运总览（summary）
  - 显示气运趋势（trend）
  - 显示气运建议（advice）
- **测试点**:
  - [ ] 气运指数正常显示（1-100）
  - [ ] 气运标签正常显示（升/稳/中/低）
  - [ ] 气运总览文本正常显示
  - [ ] 气运趋势文本正常显示
  - [ ] 气运建议列表正常显示
  - [ ] 贡献度图表正常显示（可选）

## 后端测试

### ✅ 9. LLM 调用成功
- **文件位置**: `src/app/api/v2/analyze/route.ts`
- **LLM 调用列表**:
  1. `interpretPalmWithLLM` - 掌纹解读 (line 158)
  2. `interpretTongueWithLLM` - 舌苔解读 (line 159)
  3. `interpretDreamWithLLM` - 梦境解读 (line 160-166)
  4. `interpretConstitutionWithLLM` - 体质解读 (line 171-176)
  5. `interpretQiRhythmWithLLM` - 气运解读 (在 `inferQiRhythmV2` 内部)
- **测试点**:
  - [ ] 所有 LLM 调用成功
  - [ ] Fallback 机制正常工作（LLM 失败时使用规则生成）
  - [ ] 返回数据结构正确
  - [ ] 错误处理正常

### ✅ 10. normalized 数据结构完整
- **文件位置**: `src/app/api/v2/analyze/route.ts` (line 250-262)
- **数据结构**:
```typescript
normalized: {
  palm_insight: {
    life_rhythm: string;
    emotion_pattern: string;
    thought_style: string;
    palm_overview_summary: string;
    palm_advice: string[];
  };
  palm_result: {...};
  body_tongue: {
    qi_pattern: string;
    energy_state: string;
    body_trend: string;
    health_care_advice: string[];
  };
  constitution: {
    type: string;
    name: string;
    name_en: string;
    description_paragraphs: string[];
    constitution_advice: string[];
  };
  dream_insight: {
    ImageSymbol: string;
    MindState: string;
    Trend: string;
    Advice: string[];
  };
  qi_rhythm: {
    index: number;
    tag: string;
    trend: "up" | "down" | "flat";
    summary: string;
    trend: string;
    advice: string[];
  };
  advice: {
    actions: string[];
  };
}
```
- **测试点**:
  - [ ] normalized 对象结构完整
  - [ ] 所有必需字段都存在
  - [ ] 数据类型正确
  - [ ] 数组字段不为 null

### ✅ 11. Supabase 存储成功
- **文件位置**: `src/app/api/v2/analyze/route.ts` (line 310-370)
- **功能**: 
  - 存储到 `report_v2` 表
  - 使用 `upsert` 操作
  - 存储完整的 `normalized` 对象
- **测试点**:
  - [ ] Supabase 连接正常
  - [ ] 数据成功写入 `report_v2` 表
  - [ ] `normalized` 字段正确存储
  - [ ] 可以成功读取存储的数据
  - [ ] 错误处理正常（Supabase 不可用时使用临时存储）

## 数据流验证

### ✅ 12. 数据流完整性
- **流程**:
  1. 前端上传 → `/api/v2/analyze`
  2. 后端分析 → LLM 解读 → 生成 normalized
  3. 存储到 Supabase → 返回 reportId
  4. 前端跳转 → `/v2/analysis-result?reportId=...`
  5. 前端获取 → `/api/v2/result/[reportId]`
  6. 前端渲染 → 显示所有卡片
- **测试点**:
  - [ ] 完整流程无中断
  - [ ] 数据在各个阶段保持一致
  - [ ] 错误处理覆盖所有环节

## UI/UX 验证

### ✅ 13. V2 主题样式
- **文件位置**: `src/styles/v2-theme.css`
- **测试点**:
  - [ ] 宣纸纹理背景正常显示
  - [ ] 墨绿色按钮样式正确
  - [ ] 卡片细边线和圆角 20px
  - [ ] 极轻阴影效果
  - [ ] 大间距（24/32px）正常
  - [ ] Inter + 思源宋体字体正常加载

### ✅ 14. 响应式设计
- **测试点**:
  - [ ] 移动端布局正常
  - [ ] 桌面端布局正常
  - [ ] PWA 安全区域适配正常
  - [ ] 触摸优化正常

## 兼容性验证

### ✅ 15. V1/V2 隔离
- **测试点**:
  - [ ] V1 路由不受影响（/analyze, /analysis-result 等）
  - [ ] V2 路由独立运行（/v2/analyze, /v2/analysis-result 等）
  - [ ] V1 API 不受影响（/api/analyze 等）
  - [ ] V2 API 独立运行（/api/v2/analyze 等）
  - [ ] 组件命名规范（所有 V2 组件以 V2 结尾）

## 错误处理验证

### ✅ 16. 错误处理
- **测试点**:
  - [ ] 图片上传失败处理
  - [ ] LLM 调用失败 Fallback
  - [ ] Supabase 连接失败 Fallback
  - [ ] 网络错误提示
  - [ ] 离线状态检测

## 性能验证

### ✅ 17. 性能
- **测试点**:
  - [ ] 页面加载速度正常
  - [ ] API 响应时间合理（< 60s）
  - [ ] 图片上传速度正常
  - [ ] 无内存泄漏

---

## 测试执行记录

### 测试日期: _______________
### 测试人员: _______________

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 1. 上传掌纹 | ⬜ | |
| 2. 上传舌苔 | ⬜ | |
| 3. 梦境文本输入 | ⬜ | |
| 4. 调用 API v2/analyze | ⬜ | |
| 5. 跳转结果页 | ⬜ | |
| 6. 各卡片数据渲染 | ⬜ | |
| 7. 详情页可访问 | ⬜ | |
| 8. 气运卡正常工作 | ⬜ | |
| 9. LLM 调用成功 | ⬜ | |
| 10. normalized 数据结构完整 | ⬜ | |
| 11. Supabase 存储成功 | ⬜ | |
| 12. 数据流完整性 | ⬜ | |
| 13. V2 主题样式 | ⬜ | |
| 14. 响应式设计 | ⬜ | |
| 15. V1/V2 隔离 | ⬜ | |
| 16. 错误处理 | ⬜ | |
| 17. 性能 | ⬜ | |

---

## 已知问题

（在此记录测试过程中发现的问题）

---

## 交付确认

- [ ] 所有核心功能测试通过
- [ ] 所有 UI/UX 测试通过
- [ ] 所有兼容性测试通过
- [ ] 代码审查通过
- [ ] 文档完整

**交付日期**: _______________
**交付人员**: _______________




