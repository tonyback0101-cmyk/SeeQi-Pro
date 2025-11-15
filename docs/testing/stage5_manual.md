## 阶段 5 自测脚本（Web + PWA）

### 环境准备
- 本地或预览环境启动 `npm run dev`
- 已配置 Supabase 环境变量
- 浏览器建议使用 Chrome / Edge 最新版

### 1. 数据导入 (如已导入可跳过)
```bash
npm run import:seed
```

### 2. 上传与分析流程
1. 访问 `/zh/analyze`
2. 上传手相/舌相示例图，填写可选梦境文本
3. 勾选隐私条款，点击“开始分析”
4. 页面跳转 `/zh/loading?report=<id>`；等待 7~10 秒后自动跳转结果页
5. 记录返回的 `report_id`

### 3. 结果页验收
1. 在 `/zh/analysis-result/<id>` 查看：
   - 节气卡片显示当前节气与“宜/忌”
   - 体质 / 建议 / 梦境卡片展示文案
2. 点击“复制分享链接”；在新标签页打开链接，检查分享页内容
3. 刷新页面或切换到 `/en/analysis-result/<id>` 验证多语言

### 4. 离线场景
1. 在结果页按提示选择“复制链接”后拔网线 / 断 Wi-Fi
2. 离线刷新 `/zh/analysis-result/<id>`，应提示“离线模式”并显示缓存内容
3. 离线访问 `/zh/privacy`，确认页面可读

### 5. PWA 安装与缓存
1. 在 Chrome 地址栏点击 “安装 SeeQi” 或 `... -> 安装`
2. 打开安装后的应用，离线后依然可访问最近一次结果和隐私页
3. 返回在线模式，确保新报告可继续生成

### 6. 手动验证 API
```bash
curl -X POST https://<HOST>/api/analyze \
  -F "palm_image=@palm.jpg" \
  -F "tongue_image=@tongue.jpg" \
  -F "dream_text=梦见掉牙" \
  -F "locale=zh" \
  -F "tz=Asia/Shanghai"

curl https://<HOST>/api/result/<report_id>
```

### 7. 捕获问题
- 截图 / 复制错误信息
- 记下浏览器、平台、时间、report_id
- 在 `docs/qa/palm_module_checklist.md` 对应项打勾并备注结果

