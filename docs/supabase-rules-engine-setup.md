# Supabase 规则引擎配置指南

## 📋 当前状态

✅ **规则引擎已实现**
- 规则引擎核心代码：`src/lib/rule-engine.ts`
- 规则执行接口：`src/lib/rules.ts`
- 规则文件存储：`src/lib/rules/*.jsonl`
- 规则同步脚本：`scripts/rules-sync.ts` (从 Supabase 拉取)
- 规则上传脚本：`scripts/rules-upload.ts` (上传到 Supabase)

## 🎯 目的

将规则文件从本地文件系统迁移到 Supabase Storage，实现：
1. **集中管理**：规则文件统一存储在云端
2. **版本控制**：通过 Supabase Storage 管理规则版本
3. **动态更新**：无需重新部署即可更新规则
4. **多环境同步**：开发、测试、生产环境共享规则
5. **权限控制**：通过 Supabase RLS 控制规则访问权限

## 📦 Supabase 配置步骤

### 1. 创建 Storage Bucket

#### 在 Supabase Dashboard 中操作：

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Storage** 菜单
4. 点击 **New bucket**
5. 配置如下：
   - **Name**: `rules`
   - **Public bucket**: ✅ **取消勾选**（私有存储）
   - **File size limit**: `10 MB`（规则文件通常很小）
   - **Allowed MIME types**: `application/json`, `text/plain`

6. 点击 **Create bucket**

### 2. 配置 Bucket 策略（RLS Policies）

#### 2.1 允许 Service Role 完全访问

在 Supabase Dashboard 的 **Storage** → **Policies** 中，为 `rules` bucket 添加策略：

**策略名称**: `Service Role Full Access`
```sql
-- 允许 Service Role 完全访问
CREATE POLICY "Service Role Full Access"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'rules')
WITH CHECK (bucket_id = 'rules');
```

#### 2.2 允许认证用户读取（可选）

如果需要前端也能读取规则（通常不需要）：

```sql
-- 允许认证用户读取
CREATE POLICY "Authenticated Read"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'rules');
```

### 3. 上传初始规则文件

#### 3.1 配置环境变量

在 `.env.local` 中添加：

```bash
# Supabase 配置（应该已经存在）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 规则存储配置（新增）
RULES_BUCKET=rules
RULES_BUCKET_PREFIX=rules
RULES_SOURCE_DIR=src/lib/rules
RULES_DOWNLOAD_DIR=src/lib/rules
```

#### 3.2 上传规则文件

运行上传命令：

```bash
npm run rules:upload
```

这将把 `src/lib/rules/` 目录下的所有 `.jsonl` 文件上传到 Supabase Storage。

**预期输出**：
```
[rules-upload] uploaded src/lib/rules/dream.jsonl -> rules/rules/dream.jsonl
[rules-upload] uploaded src/lib/rules/global.jsonl -> rules/rules/global.jsonl
[rules-upload] uploaded src/lib/rules/palm.jsonl -> rules/rules/palm.jsonl
[rules-upload] uploaded src/lib/rules/solar.jsonl -> rules/rules/solar.jsonl
[rules-upload] uploaded src/lib/rules/tongue.jsonl -> rules/rules/tongue.jsonl
```

### 4. 验证上传结果

在 Supabase Dashboard 中：
1. 进入 **Storage** → **rules** bucket
2. 应该看到以下文件：
   - `rules/dream.jsonl`
   - `rules/global.jsonl`
   - `rules/palm.jsonl`
   - `rules/solar.jsonl`
   - `rules/tongue.jsonl`

### 5. 测试规则同步

运行拉取命令验证同步功能：

```bash
npm run rules:pull
```

**预期输出**：
```
[rules-sync] downloaded dream.jsonl -> rules/dream.jsonl
[rules-sync] downloaded global.jsonl -> rules/global.jsonl
[rules-sync] downloaded palm.jsonl -> rules/palm.jsonl
[rules-sync] downloaded solar.jsonl -> rules/solar.jsonl
[rules-sync] downloaded tongue.jsonl -> rules/tongue.jsonl
```

## 🔄 工作流程

### 开发环境

1. **本地修改规则**：编辑 `src/lib/rules/*.jsonl` 文件
2. **测试规则**：运行应用测试规则效果
3. **上传规则**：`npm run rules:upload`
4. **验证**：在 Supabase Dashboard 中查看文件

### 生产环境

1. **从 Supabase 拉取**：`npm run rules:pull`（在部署脚本中）
2. **应用启动**：规则引擎自动加载本地规则文件
3. **定期同步**：可以设置定时任务定期拉取最新规则

## 📝 规则文件格式

规则文件采用 JSONL 格式（每行一个 JSON 对象）：

```json
{"id":"rule_id","priority":60,"when":{"condition":"value"},"then":{"result":"data"},"merge":"append"}
```

**字段说明**：
- `id`: 规则唯一标识符
- `priority`: 优先级（数字越大优先级越高）
- `when`: 匹配条件（使用 lodash.get 路径语法）
- `then`: 执行结果
- `merge`: 合并策略（`append` | `replace` | `skip`）

**示例规则**：
```json
{
  "id": "palm_ruddy_deep_life",
  "priority": 60,
  "when": {
    "palm.color": "pink",
    "palm.lines.life": "deep"
  },
  "then": {
    "advice": {
      "lifestyle": ["适度耐力训练"],
      "exercise": ["快走或慢跑20-30分钟"]
    }
  },
  "merge": "append"
}
```

## ✅ 验收标准

### 功能验收

1. **✅ 上传功能**
   - [ ] 运行 `npm run rules:upload` 成功
   - [ ] 所有 `.jsonl` 文件上传到 Supabase Storage
   - [ ] 文件路径正确：`rules/rules/*.jsonl`

2. **✅ 拉取功能**
   - [ ] 运行 `npm run rules:pull` 成功
   - [ ] 规则文件下载到本地目录
   - [ ] 文件内容与 Supabase 中的一致

3. **✅ 规则执行**
   - [ ] 应用启动后规则引擎正常加载规则
   - [ ] 规则匹配和执行功能正常
   - [ ] 规则优先级排序正确

4. **✅ 权限控制**
   - [ ] Service Role 可以上传/下载规则
   - [ ] 未授权用户无法访问规则文件
   - [ ] RLS 策略正确配置

### 性能验收

1. **✅ 上传性能**
   - [ ] 5 个规则文件上传时间 < 5 秒
   - [ ] 单个文件大小 < 1MB

2. **✅ 拉取性能**
   - [ ] 5 个规则文件拉取时间 < 3 秒
   - [ ] 网络错误时有重试机制（可选）

### 安全验收

1. **✅ 存储安全**
   - [ ] Bucket 设置为私有（非公开）
   - [ ] 只有 Service Role 可以写入
   - [ ] 规则文件内容不包含敏感信息

2. **✅ 访问控制**
   - [ ] RLS 策略正确配置
   - [ ] 无法通过公开 URL 直接访问规则文件

## 🚨 常见问题

### Q1: 上传失败，提示权限不足

**解决方案**：
1. 检查 `SUPABASE_SERVICE_ROLE_KEY` 是否正确
2. 确认 RLS 策略已正确配置
3. 检查 bucket 名称是否正确

### Q2: 拉取失败，提示文件不存在

**解决方案**：
1. 确认文件已成功上传到 Supabase
2. 检查 `RULES_BUCKET_PREFIX` 配置是否正确
3. 确认文件路径格式：`{prefix}/{filename}`

### Q3: 规则执行时找不到规则文件

**解决方案**：
1. 确认 `src/lib/rules/` 目录存在
2. 运行 `npm run rules:pull` 拉取规则
3. 检查 `RULES_DIR_PATH` 环境变量（如果设置了）

### Q4: 如何更新规则？

**工作流程**：
1. 在 Supabase Dashboard 中直接编辑文件，或
2. 本地修改 → `npm run rules:upload` → 其他环境 `npm run rules:pull`

## 📚 相关文件

- 规则引擎核心：`src/lib/rule-engine.ts`
- 规则执行接口：`src/lib/rules.ts`
- 规则同步脚本：`scripts/rules-sync.ts`
- 规则上传脚本：`scripts/rules-upload.ts`
- 规则文件目录：`src/lib/rules/`

## 🔗 相关命令

```bash
# 上传规则到 Supabase
npm run rules:upload

# 从 Supabase 拉取规则
npm run rules:pull
```

## 📞 技术支持

如遇到问题，请检查：
1. Supabase Dashboard 中的 Storage 配置
2. 环境变量配置
3. RLS 策略设置
4. 网络连接状态


